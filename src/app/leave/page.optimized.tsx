'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AuthService } from '@/lib/services/auth.service';
import { ExportService } from '@/lib/services/export.service';
import type { LeaveFilter, LeaveType } from '@/types';
import LeaveCalendar from './components/LeaveCalendar';
import LeaveModal from './components/LeaveModal';
import LeaveViewModal from './components/LeaveViewModal';
import LeaveList from './components/LeaveList';
import LeaveFilters from './components/LeaveFilters';

export default function LeavePage() {
  // State for admin status
  const [isAdmin, setIsAdmin] = useState(false);
  
  // State for filters
  const [filter, setFilter] = useState<LeaveFilter>({});
  
  // State for modals
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [currentLeaveId, setCurrentLeaveId] = useState<string | undefined>(undefined);
  const [leaveModalMode, setLeaveModalMode] = useState<'view' | 'edit' | 'add'>('add');
  const [showLeaveViewModal, setShowLeaveViewModal] = useState(false);
  const [currentViewLeaveId, setCurrentViewLeaveId] = useState<string | null>(null);
  
  // State for export
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'report'>('csv');
  
  // State for view mode
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Leave type options
  const leaveTypes: LeaveType[] = ['Annual', 'Sick', 'Unpaid', 'Working'];
  
  // Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      const adminStatus = await AuthService.isAdmin();
      setIsAdmin(adminStatus);
    }
    checkAdmin();
  }, []);
  
  // Handle filter change
  const handleFilterChange = (newFilter: LeaveFilter) => {
    setFilter(newFilter);
  };
  
  // Handle view leave
  const handleViewLeave = (id: string) => {
    setCurrentViewLeaveId(id);
    setShowLeaveViewModal(true);
  };
  
  // Handle edit leave
  const handleEditLeave = (id: string) => {
    setCurrentLeaveId(id);
    setLeaveModalMode('edit');
    setShowLeaveModal(true);
  };
  
  // Handle add leave
  const handleAddLeave = () => {
    setCurrentLeaveId(undefined);
    setLeaveModalMode('add');
    setShowLeaveModal(true);
  };
  
  // Handle export
  const handleExport = async () => {
    try {
      let exportData: string;
      let fileName: string;
      
      if (exportFormat === 'report') {
        // Handle CSV export - cast the return value to string
        const result = await ExportService.generateReport(filter as any);
        exportData = typeof result === 'string' ? result : '';
        fileName = 'leave_report.txt';
      } else if (exportFormat === 'csv') {
        // Handle CSV export - cast the return value to string
        const result = await ExportService.exportLeavesToCSV(filter as any);
        exportData = typeof result === 'string' ? result : '';
        fileName = 'leave_export.csv';
      } else {
        // Handle Excel export - cast the return value to string
        const result = await ExportService.exportLeavesToExcel(filter as any);
        exportData = typeof result === 'string' ? result : '';
        fileName = 'leave_export.xlsx';
      }
      
      // Create a download link
      const blob = new Blob([exportData], { type: exportFormat === 'report' ? 'text/plain' : 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Hide export options
      setShowExportOptions(false);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Leave Management</h1>
          
          <div className="flex space-x-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Calendar
              </button>
            </div>
            
            {/* Add Leave Button */}
            <button
              onClick={handleAddLeave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Leave
            </button>
            
            {/* Export Button */}
            <div className="relative">
              <button
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Export
              </button>
              
              {/* Export Options Dropdown */}
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <div className="p-2">
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Export Format
                      </label>
                      <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="csv">CSV</option>
                        <option value="excel">Excel</option>
                        <option value="report">Report</option>
                      </select>
                    </div>
                    <button
                      onClick={handleExport}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <LeaveFilters
          filter={filter}
          onFilterChange={handleFilterChange}
          leaveTypes={leaveTypes}
          isAdmin={isAdmin}
        />
        
        {/* Main Content */}
        <div className="bg-white rounded-lg shadow">
          {viewMode === 'list' ? (
            <LeaveList
              filter={filter}
              onViewLeave={handleViewLeave}
              onEditLeave={handleEditLeave}
              isAdmin={isAdmin}
            />
          ) : (
            <LeaveCalendar 
              branchId={filter.branch_id} 
              month={new Date()} 
            />
          )}
        </div>
      </div>
      
      {/* Leave Modal */}
      {showLeaveModal && (
        <LeaveModal
          leaveId={currentLeaveId}
          mode={leaveModalMode}
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          onSuccess={() => {
            setShowLeaveModal(false);
            // Refresh data if needed
          }}
        />
      )}
      
      {/* Leave View Modal */}
      {showLeaveViewModal && currentViewLeaveId && (
        <LeaveViewModal
          leaveId={currentViewLeaveId}
          isOpen={showLeaveViewModal}
          onClose={() => setShowLeaveViewModal(false)}
        />
      )}
    </DashboardLayout>
  );
}
