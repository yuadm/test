'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DocumentModal from './components/DocumentModal';
import { DocumentService } from '@/lib/services/document.service';
import { parseISO, format, isValid, isBefore, addDays } from 'date-fns';
import { MagnifyingGlassIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function TrackerPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<any[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('all');

  useEffect(() => {
    loadDocuments();
  }, [activeTab]);

  useEffect(() => {
    // Apply search and branch filters whenever documents, searchQuery, or selectedBranch changes
    applyFilters();
  }, [documents, searchQuery, selectedBranch]);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      let result;
      if (activeTab === 'all') {
        result = await DocumentService.getDocuments();
      } else {
        result = await DocumentService.getDocumentsByFilter(activeTab);
      }
      
      if (result.error) {
        console.error('Error loading documents:', result.error);
        setError(result.error);
        setDocuments([]);
      } else {
        setError(null);
        const docs = result.data || [];
        setDocuments(docs);
        
        // Extract unique branches for the filter
        const uniqueBranches = Array.from(new Set(docs.map(doc => doc.branch).filter(Boolean)));
        setBranches(uniqueBranches);
      }
    } catch (err: any) {
      console.error('Error loading documents:', err);
      setError(err.message);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...documents];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        (doc.employee_name && doc.employee_name.toLowerCase().includes(query)) ||
        (doc.branch && doc.branch.toLowerCase().includes(query)) ||
        (doc.status && doc.status.toLowerCase().includes(query)) ||
        (doc.country && doc.country.toLowerCase().includes(query))
      );
    }
    
    // Apply branch filter
    if (selectedBranch !== 'all') {
      filtered = filtered.filter(doc => doc.branch === selectedBranch);
    }
    
    setFilteredDocuments(filtered);
  };

  const handleModalSuccess = () => {
    // Refresh documents after successful addition or edit
    loadDocuments();
    setSelectedDocumentId(null);
  };
  
  const handleEdit = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setIsEditMode(true);
    setIsModalOpen(true);
  };
  
  const handleDelete = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = async () => {
    if (!selectedDocumentId) return;
    
    try {
      setIsLoading(true);
      const { error } = await DocumentService.deleteDocument(selectedDocumentId);
      
      if (error) {
        throw new Error(error);
      }
      
      // Refresh documents after deletion
      loadDocuments();
      setShowDeleteConfirm(false);
      setSelectedDocumentId(null);
    } catch (err: any) {
      console.error('Error deleting document:', err.message);
      setIsLoading(false);
    }
  };
  
  const handleSelectDocument = (documentId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedDocuments(prev => [...prev, documentId]);
    } else {
      setSelectedDocuments(prev => prev.filter(docId => docId !== documentId));
    }
  };
  
  const handleBatchDelete = () => {
    if (selectedDocuments.length === 0) return;
    setShowBatchDeleteConfirm(true);
  };
  
  const confirmBatchDelete = async () => {
    if (selectedDocuments.length === 0) return;
    
    try {
      setIsLoading(true);
      const { error } = await DocumentService.batchDeleteDocuments(selectedDocuments);
      
      if (error) {
        throw new Error(error);
      }
      
      // Refresh documents after deletion
      loadDocuments();
      setShowBatchDeleteConfirm(false);
      setSelectedDocuments([]);
    } catch (err: any) {
      console.error('Error deleting documents:', err.message);
      setIsLoading(false);
    }
  };
  
  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };
  
  // Export documents to CSV
  const exportToCSV = () => {
    // Create CSV content
    const headers = [
      'Employee Name',
      'Branch',
      'Status',
      'Country',
      'Passport Expiry',
      'BRP Expiry',
      'Right to Work Expiry',
      'Other Document Type',
      'Other Document Expiry',
      'Notes'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredDocuments.map(doc => {
        return [
          `"${doc.employee_name || ''}"`,
          `"${doc.branch || ''}"`,
          `"${doc.status || ''}"`,
          `"${doc.country || ''}"`,
          `"${formatDate(doc.passport_expiry) || ''}"`,
          `"${formatDate(doc.brp_expiry) || ''}"`,
          `"${formatDate(doc.right_to_work_expiry) || ''}"`,
          `"${doc.other_document_type || ''}"`,
          `"${formatDate(doc.other_document_expiry) || ''}"`,
          `"${doc.notes || ''}"`,
        ].join(',');
      })
    ].join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const today = new Date();
    const formattedDate = format(today, 'dd-MM-yyyy');
    link.setAttribute('download', `document_tracker_export_${formattedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Helper function to determine document status
  const getDocumentStatus = (expiryDate: string) => {
    if (!expiryDate || expiryDate === 'N/A') return 'valid';
    
    try {
      // If it's a date string, parse it
      if (expiryDate.includes('-')) {
        const date = parseISO(expiryDate);
        if (!isValid(date)) return 'unknown';
        
        const today = new Date();
        const in30Days = addDays(today, 30);
        const in90Days = addDays(today, 90);
        
        if (isBefore(date, today)) return 'expired';
        if (isBefore(date, in30Days)) return 'expiring-soon';
        if (isBefore(date, in90Days)) return 'expiring';
        return 'valid';
      }
      return 'valid';
    } catch (e) {
      return 'unknown';
    }
  };
  
  // Calculate days remaining or days expired
  const getDaysIndicator = (expiryDate: string) => {
    if (!expiryDate || expiryDate === 'N/A') return null;
    
    try {
      if (expiryDate.includes('-')) {
        const date = parseISO(expiryDate);
        if (!isValid(date)) return null;
        
        const today = new Date();
        const diffInDays = Math.round(Math.abs((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        
        if (isBefore(date, today)) {
          return { days: diffInDays, type: 'expired' };
        } else {
          return { days: diffInDays, type: 'remaining' };
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  };
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    
    try {
      if (dateStr.includes('-')) {
        const date = parseISO(dateStr);
        if (!isValid(date)) return dateStr;
        return format(date, 'dd/MM/yyyy');
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Document Tracker</h1>
            <p className="mt-1 text-sm text-gray-600">Manage employee documents and track expiry dates</p>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={exportToCSV}
            >
              <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Export CSV
            </button>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => {
                setIsEditMode(false);
                setSelectedDocumentId(null);
                setIsModalOpen(true);
              }}
            >
              Add Document
            </button>
          </div>
        </div>
        
        {/* Search and filter bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            <select
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="all">All Branches</option>
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                All Documents
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {documents.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('expired')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'expired' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Expired
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {documents.filter(doc => 
                    getDocumentStatus(doc.passport_expiry) === 'expired' || 
                    getDocumentStatus(doc.brp_expiry) === 'expired' || 
                    getDocumentStatus(doc.right_to_work_expiry) === 'expired' || 
                    getDocumentStatus(doc.other_document_expiry) === 'expired'
                  ).length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('expiring30')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'expiring30' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Expiring in 30 Days
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {documents.filter(doc => 
                    getDocumentStatus(doc.passport_expiry) === 'expiring-soon' || 
                    getDocumentStatus(doc.brp_expiry) === 'expiring-soon' || 
                    getDocumentStatus(doc.right_to_work_expiry) === 'expiring-soon' || 
                    getDocumentStatus(doc.other_document_expiry) === 'expiring-soon'
                  ).length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('expiring90')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'expiring90' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Expiring in 90 Days
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  {documents.filter(doc => 
                    getDocumentStatus(doc.passport_expiry) === 'expiring' || 
                    getDocumentStatus(doc.brp_expiry) === 'expiring' || 
                    getDocumentStatus(doc.right_to_work_expiry) === 'expiring' || 
                    getDocumentStatus(doc.other_document_expiry) === 'expiring'
                  ).length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('valid')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'valid' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Valid
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {documents.filter(doc => 
                    getDocumentStatus(doc.passport_expiry) === 'valid' && 
                    getDocumentStatus(doc.brp_expiry) === 'valid' && 
                    getDocumentStatus(doc.right_to_work_expiry) === 'valid' && 
                    getDocumentStatus(doc.other_document_expiry) === 'valid'
                  ).length}
                </span>
              </button>
            </nav>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading documents...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No documents found. Add a document to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                        <span className="ml-2">Employee</span>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                    {documents.some(doc => doc.passport_expiry && doc.passport_expiry !== 'N/A') && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passport</th>
                    )}
                    {documents.some(doc => doc.brp_expiry && doc.brp_expiry !== 'N/A') && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BRP</th>
                    )}
                    {documents.some(doc => doc.right_to_work_expiry && doc.right_to_work_expiry !== 'N/A') && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Right to Work</th>
                    )}
                    {documents.some(doc => doc.other_document_type && doc.other_document_expiry && doc.other_document_expiry !== 'N/A') && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Other Document</th>
                    )}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                            checked={selectedDocuments.includes(doc.id)}
                            onChange={(e) => handleSelectDocument(doc.id, e.target.checked)}
                          />
                          <div className="text-sm font-medium text-gray-900">{doc.employee_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.branch || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.country || '-'}
                      </td>
                      {documents.some(d => d.passport_expiry && d.passport_expiry !== 'N/A') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col items-start">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${getDocumentStatus(doc.passport_expiry) === 'expired' ? 'bg-red-100 text-red-800' : 
                                getDocumentStatus(doc.passport_expiry) === 'expiring-soon' ? 'bg-yellow-100 text-yellow-800' : 
                                getDocumentStatus(doc.passport_expiry) === 'expiring' ? 'bg-orange-100 text-orange-800' : 
                                'bg-green-100 text-green-800'}`}>
                              {formatDate(doc.passport_expiry)}
                            </span>
                            {getDaysIndicator(doc.passport_expiry) && (
                              <span className={`mt-1 px-2 py-0.5 text-xs rounded-sm inline-flex items-center
                                ${getDaysIndicator(doc.passport_expiry)?.type === 'expired' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                                {getDaysIndicator(doc.passport_expiry)?.type === 'expired' ? (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {getDaysIndicator(doc.passport_expiry)?.days} days expired
                                  </>
                                ) : (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {getDaysIndicator(doc.passport_expiry)?.days} days left
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                      {documents.some(d => d.brp_expiry && d.brp_expiry !== 'N/A') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col items-start">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${getDocumentStatus(doc.brp_expiry) === 'expired' ? 'bg-red-100 text-red-800' : 
                                getDocumentStatus(doc.brp_expiry) === 'expiring-soon' ? 'bg-yellow-100 text-yellow-800' : 
                                getDocumentStatus(doc.brp_expiry) === 'expiring' ? 'bg-orange-100 text-orange-800' : 
                                'bg-green-100 text-green-800'}`}>
                              {formatDate(doc.brp_expiry)}
                            </span>
                            {getDaysIndicator(doc.brp_expiry) && (
                              <span className={`mt-1 px-2 py-0.5 text-xs rounded-sm inline-flex items-center
                                ${getDaysIndicator(doc.brp_expiry)?.type === 'expired' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                                {getDaysIndicator(doc.brp_expiry)?.type === 'expired' ? (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {getDaysIndicator(doc.brp_expiry)?.days} days expired
                                  </>
                                ) : (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {getDaysIndicator(doc.brp_expiry)?.days} days left
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                      {documents.some(d => d.right_to_work_expiry && d.right_to_work_expiry !== 'N/A') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col items-start">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${getDocumentStatus(doc.right_to_work_expiry) === 'expired' ? 'bg-red-100 text-red-800' : 
                                getDocumentStatus(doc.right_to_work_expiry) === 'expiring-soon' ? 'bg-yellow-100 text-yellow-800' : 
                                getDocumentStatus(doc.right_to_work_expiry) === 'expiring' ? 'bg-orange-100 text-orange-800' : 
                                'bg-green-100 text-green-800'}`}>
                              {formatDate(doc.right_to_work_expiry)}
                            </span>
                            {getDaysIndicator(doc.right_to_work_expiry) && (
                              <span className={`mt-1 px-2 py-0.5 text-xs rounded-sm inline-flex items-center
                                ${getDaysIndicator(doc.right_to_work_expiry)?.type === 'expired' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                                {getDaysIndicator(doc.right_to_work_expiry)?.type === 'expired' ? (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {getDaysIndicator(doc.right_to_work_expiry)?.days} days expired
                                  </>
                                ) : (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {getDaysIndicator(doc.right_to_work_expiry)?.days} days left
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                      {documents.some(d => d.other_document_type && d.other_document_expiry && d.other_document_expiry !== 'N/A') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {doc.other_document_type ? (
                            <div>
                              <div className="text-sm text-gray-900">{doc.other_document_type}</div>
                              <div>
                                <div className="flex flex-col items-start">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${getDocumentStatus(doc.other_document_expiry) === 'expired' ? 'bg-red-100 text-red-800' : 
                                      getDocumentStatus(doc.other_document_expiry) === 'expiring-soon' ? 'bg-yellow-100 text-yellow-800' : 
                                      getDocumentStatus(doc.other_document_expiry) === 'expiring' ? 'bg-orange-100 text-orange-800' : 
                                      'bg-green-100 text-green-800'}`}>
                                    {formatDate(doc.other_document_expiry)}
                                  </span>
                                  {getDaysIndicator(doc.other_document_expiry) && (
                                    <span className={`mt-1 px-2 py-0.5 text-xs rounded-sm inline-flex items-center
                                      ${getDaysIndicator(doc.other_document_expiry)?.type === 'expired' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                                      {getDaysIndicator(doc.other_document_expiry)?.type === 'expired' ? (
                                        <>
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          {getDaysIndicator(doc.other_document_expiry)?.days} days expired
                                        </>
                                      ) : (
                                        <>
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          {getDaysIndicator(doc.other_document_expiry)?.days} days left
                                        </>
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button 
                            className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            onClick={() => handleEdit(doc.id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button 
                            className="inline-flex items-center px-3 py-1.5 border border-red-600 text-red-600 bg-white hover:bg-red-50 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Document Modal */}
      <DocumentModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDocumentId(null);
        }} 
        onSuccess={handleModalSuccess}
        documentId={selectedDocumentId || undefined}
        isEdit={!!selectedDocumentId}
      />
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Document</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this document? This action cannot be undone.
                        <br />
                        <strong>Note:</strong> This will only delete the document record, not the employee data.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedDocumentId(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Batch Delete Confirmation Modal */}
      {showBatchDeleteConfirm && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Multiple Documents</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete {selectedDocuments.length} selected documents? This action cannot be undone.
                        <br />
                        <strong>Note:</strong> This will only delete the document records, not the employee data.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmBatchDelete}
                >
                  Delete All
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setShowBatchDeleteConfirm(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
