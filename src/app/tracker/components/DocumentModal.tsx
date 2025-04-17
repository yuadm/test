'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { DocumentService } from '@/lib/services/document.service';
import { EmployeeService } from '@/lib/services/employee.service';
import { BranchService } from '@/lib/services/branch.service';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: string;
  isEdit?: boolean;
  onSuccess: () => void;
}

export default function DocumentModal({ isOpen, onClose, documentId, isEdit = false, onSuccess }: DocumentModalProps) {
  const [formData, setFormData] = useState<any>({
    employee_id: '',
    branch: '',
    status: '',
    country: '',
    passport_expiry: '',
    brp_expiry: '',
    right_to_work_expiry: '',
    other_document_type: '',
    other_document_expiry: '',
    notes: ''
  });
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track which document types are visible
  const [visibleDocuments, setVisibleDocuments] = useState({
    passport: true,
    brp: false,
    right_to_work: false,
    other: false
  });
  
  // For the document type dropdown
  const [showDocumentDropdown, setShowDocumentDropdown] = useState(false);
  
  const documentTypes = [
    { id: 'brp', name: 'BRP' },
    { id: 'right_to_work', name: 'Right to Work' },
    { id: 'other', name: 'Other Document' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadData();
      
      // Reset form when modal opens
      if (!isEdit) {
        setFormData({
          employee_id: '',
          status: '',
          country: '',
          passport_expiry: '',
          brp_expiry: '',
          right_to_work_expiry: '',
          other_document_type: '',
          other_document_expiry: '',
          notes: ''
        });
        
        // Reset visible documents
        setVisibleDocuments({
          passport: true,
          brp: false,
          right_to_work: false,
          other: false
        });
      }
    }
  }, [isOpen, isEdit, documentId]);

  async function loadData() {
    try {
      setIsLoading(true);
      
      // Load employees
      const { data: employeeData, error: employeeError } = await EmployeeService.getEmployees();
      if (employeeError) {
        throw new Error(employeeError);
      }
      setEmployees(employeeData || []);
      
      // Load existing documents to filter out employees who already have documents
      const { data: documentData, error: documentError } = await DocumentService.getDocuments();
      if (documentError) {
        throw new Error(documentError);
      }
      setExistingDocuments(documentData || []);
      
      // Filter employees who don't already have documents
      // If editing, include the current employee in the available list
      const existingEmployeeIds = documentData?.map(doc => doc.employee_id) || [];
      let filteredEmployees;
      
      if (isEdit && documentId) {
        // If editing, get the current document to know which employee to keep in the list
        const { data: currentDoc } = await DocumentService.getDocumentById(documentId);
        const currentEmployeeId = currentDoc?.employee_id;
        
        // Filter out employees who have documents, except the current one being edited
        filteredEmployees = employeeData?.filter(emp => 
          !existingEmployeeIds.includes(emp.id) || emp.id === currentEmployeeId
        ) || [];
      } else {
        // For new documents, filter out all employees who already have documents
        filteredEmployees = employeeData?.filter(emp => 
          !existingEmployeeIds.includes(emp.id)
        ) || [];
      }
      
      setAvailableEmployees(filteredEmployees);
      
      // Load branches
      const { data: branchData, error: branchError } = await BranchService.getAllBranches();
      if (branchError) {
        throw new Error(branchError);
      }
      setBranches(branchData || []);
      
      // If editing, load document data
      if (isEdit && documentId) {
        const { data: documentData, error: documentError } = await DocumentService.getDocumentById(documentId);
        if (documentError) {
          throw new Error(documentError);
        }
        
        if (documentData) {
          // Set form data from document
          setFormData({
            employee_id: documentData.employee_id || '',
            branch: documentData.branch || '',
            status: documentData.status || '',
            country: documentData.country || '',
            passport_expiry: documentData.passport_expiry && documentData.passport_expiry !== 'N/A' ? documentData.passport_expiry : '',
            brp_expiry: documentData.brp_expiry && documentData.brp_expiry !== 'N/A' ? documentData.brp_expiry : '',
            right_to_work_expiry: documentData.right_to_work_expiry && documentData.right_to_work_expiry !== 'N/A' ? documentData.right_to_work_expiry : '',
            other_document_type: documentData.other_document_type || '',
            other_document_expiry: documentData.other_document_expiry && documentData.other_document_expiry !== 'N/A' ? documentData.other_document_expiry : '',
            notes: documentData.notes || ''
          });
          
          // Set visible documents based on what's in the document
          setVisibleDocuments({
            passport: true,
            brp: documentData.brp_expiry && documentData.brp_expiry !== 'N/A',
            right_to_work: documentData.right_to_work_expiry && documentData.right_to_work_expiry !== 'N/A',
            other: documentData.other_document_type && documentData.other_document_type.length > 0
          });
        }
      }
      
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
    
    // If employee changes, update the branch information
    if (name === 'employee_id' && value) {
      const selectedEmployee = employees.find(emp => emp.id === value);
      if (selectedEmployee && selectedEmployee.branch_id) {
        const employeeBranch = branches.find(branch => branch.id === selectedEmployee.branch_id);
        if (employeeBranch) {
          setFormData((prev: typeof formData) => ({
            ...prev,
            branch: employeeBranch.name
          }));
        }
      }
    }
  };
  
  const addDocumentType = (type: string) => {
    setVisibleDocuments((prev: typeof visibleDocuments) => ({
      ...prev,
      [type]: true
    }));
    setShowDocumentDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      
      // Validate form
      if (!formData.employee_id) {
        throw new Error('Please select an employee');
      }
      
      if (!formData.status) {
        throw new Error('Please select a status');
      }
      
      // Ensure at least one document type is selected
      const hasAnyVisibleDocument = Object.values(visibleDocuments).some(value => value === true);
      if (!hasAnyVisibleDocument) {
        throw new Error('Please add at least one document type');
      }
      
      // Get the selected employee name and branch
      const selectedEmployee = employees.find(emp => emp.id === formData.employee_id);
      const employeeName = selectedEmployee ? selectedEmployee.full_name : '';
      let branchName = formData.branch || '';
      
      // If branch is not already set, try to get it from the employee's branch
      if (!branchName && selectedEmployee && selectedEmployee.branch_id) {
        const employeeBranch = branches.find(branch => branch.id === selectedEmployee.branch_id);
        if (employeeBranch) {
          branchName = employeeBranch.name;
        }
      }
      
      if (!employeeName) {
        throw new Error('Could not determine employee name');
      }
      
      // Prepare document data for submission - empty fields will be N/A
      const documentData = {
        employee_id: formData.employee_id,
        employee_name: employeeName, // Add employee name
        branch: branchName, // Add branch name
        status: formData.status,
        country: formData.country || '',
        passport_expiry: formData.passport_expiry || 'N/A',
        brp_expiry: visibleDocuments.brp ? (formData.brp_expiry || 'N/A') : 'N/A',
        right_to_work_expiry: visibleDocuments.right_to_work ? (formData.right_to_work_expiry || 'N/A') : 'N/A',
        other_document_type: visibleDocuments.other ? (formData.other_document_type || null) : null,
        other_document_expiry: visibleDocuments.other ? (formData.other_document_expiry || 'N/A') : 'N/A',
        notes: formData.notes || null
      };
      
      // Save document to the database
      let saveResult;
      if (isEdit && documentId) {
        // If editing, include the document ID
        saveResult = await DocumentService.saveDocument({
          ...documentData,
          id: documentId
        });
      } else {
        // If creating new, don't include ID
        saveResult = await DocumentService.saveDocument(documentData);
      }
      
      if (saveResult.error) {
        throw new Error(`Failed to save document: ${saveResult.error}`);
      }
      
      setIsSaving(false);
      // Show success message
      alert('Document saved successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setIsSaving(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                >
                  <span>{isEdit ? "Edit Document" : "Add New Document"}</span>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </Dialog.Title>
                
                <div className="mt-4">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
                          Employee <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="employee_id"
                          name="employee_id"
                          value={formData.employee_id}
                          onChange={handleChange}
                          disabled={isLoading}
                          required
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="">Select an employee</option>
                          {availableEmployees.length === 0 && !isEdit ? (
                            <option value="" disabled>No available employees - all already have documents</option>
                          ) : (
                            availableEmployees.map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.full_name} ({employee.employee_code})
                              </option>
                            ))
                          )}
                        </select>
                        {availableEmployees.length === 0 && !isEdit && (
                          <p className="mt-1 text-sm text-red-600">All employees already have document records</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                          Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          required
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="">Select status</option>
                          <option value="BRITISH">BRITISH</option>
                          <option value="EU">EU</option>
                          <option value="NON-EU">NON-EU</option>
                          <option value="N/A">N/A</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                          Country
                        </label>
                        <input
                          type="text"
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          placeholder="Country of origin"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Documents</h3>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowDocumentDropdown(!showDocumentDropdown)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <PlusIcon className="h-5 w-5 mr-1" />
                            Add Document
                          </button>
                          
                          {showDocumentDropdown && (
                            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                              <div className="py-1" role="menu" aria-orientation="vertical">
                                {documentTypes.filter(type => !visibleDocuments[type.id as keyof typeof visibleDocuments]).map((type) => (
                                  <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => addDocumentType(type.id)}
                                    className="text-left block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    role="menuitem"
                                  >
                                    {type.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Passport */}
                        {visibleDocuments.passport && (
                          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-base font-medium">Passport</h4>
                              <button
                                type="button"
                                onClick={() => setVisibleDocuments(prev => ({ ...prev, passport: false }))}
                                className="text-gray-400 hover:text-red-500 focus:outline-none"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm text-gray-700">Expiry Date:</label>
                              <input
                                type="date"
                                id="passport_expiry"
                                name="passport_expiry"
                                value={formData.passport_expiry}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* BRP */}
                        {visibleDocuments.brp && (
                          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-base font-medium">BRP</h4>
                              <button
                                type="button"
                                onClick={() => setVisibleDocuments(prev => ({ ...prev, brp: false }))}
                                className="text-gray-400 hover:text-red-500 focus:outline-none"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm text-gray-700">Expiry Date:</label>
                              <input
                                type="date"
                                id="brp_expiry"
                                name="brp_expiry"
                                value={formData.brp_expiry}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Right to Work */}
                        {visibleDocuments.right_to_work && (
                          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-base font-medium">Right to Work</h4>
                              <button
                                type="button"
                                onClick={() => setVisibleDocuments(prev => ({ ...prev, right_to_work: false }))}
                                className="text-gray-400 hover:text-red-500 focus:outline-none"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm text-gray-700">Expiry Date:</label>
                              <input
                                type="date"
                                id="right_to_work_expiry"
                                name="right_to_work_expiry"
                                value={formData.right_to_work_expiry}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Other Document */}
                        {visibleDocuments.other && (
                          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-base font-medium">Other Document</h4>
                              <button
                                type="button"
                                onClick={() => setVisibleDocuments(prev => ({ ...prev, other: false }))}
                                className="text-gray-400 hover:text-red-500 focus:outline-none"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm text-gray-700">Document Type:</label>
                              <input
                                type="text"
                                id="other_document_type"
                                name="other_document_type"
                                value={formData.other_document_type || ''}
                                onChange={handleChange}
                                placeholder="Specify document type"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                              
                              <label className="block text-sm text-gray-700 mt-2">Expiry Date:</label>
                              <input
                                type="date"
                                id="other_document_expiry"
                                name="other_document_expiry"
                                value={formData.other_document_expiry}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Additional notes about the documents"
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 border-t">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSaving}
                        className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {isSaving ? 'Saving...' : (isEdit ? 'Update Document' : 'Save Document')}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
