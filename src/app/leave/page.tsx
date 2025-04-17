'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { LeaveService } from '@/lib/services/leave.service';
import { BranchService } from '@/lib/services/branch.service';
import { EmployeeService } from '@/lib/services/employee.service';
import { AuthService } from '@/lib/services/auth.service';
import { ExportService } from '@/lib/services/export.service';
import type { Leave, Branch, Employee, LeaveFilter, LeaveType } from '@/types';
import LeaveCalendar from './components/LeaveCalendar';
import LeaveModal from './components/LeaveModal';
import LeaveViewModal from './components/LeaveViewModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';

export default function LeavePage() {
  const router = useRouter();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LeaveFilter>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [currentLeaveId, setCurrentLeaveId] = useState<string | undefined>(undefined);
  const [leaveModalMode, setLeaveModalMode] = useState<'view' | 'edit' | 'add'>('add');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [leaveToDelete, setLeaveToDelete] = useState<string | null>(null);
  const [showLeaveViewModal, setShowLeaveViewModal] = useState(false);
  const [currentViewLeaveId, setCurrentViewLeaveId] = useState<string | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'report'>('csv');
  const [selectedLeaves, setSelectedLeaves] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [employeeRemainingDays, setEmployeeRemainingDays] = useState<Record<string, number>>({});
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Leave type options
  const leaveTypes: LeaveType[] = ['Annual', 'Sick', 'Unpaid', 'Working'];

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // Check if user is admin
        const adminStatus = await AuthService.isAdmin();
        setIsAdmin(adminStatus);
        
        // Load branches if admin
        if (adminStatus) {
          const { data: branchData, error: branchError } = await BranchService.getAllBranches();
          if (branchError) {
            throw new Error(branchError);
          }
          setBranches(branchData || []);
        }
        
        // Load employees based on user role
        const { data: employeeData, error: employeeError } = await EmployeeService.getEmployees();
        if (employeeError) {
          throw new Error(employeeError);
        }
        setEmployees(employeeData || []);
        
        // Load leaves with filter
        await loadLeaves();
        
      } catch (err: any) {
        setError(err.message || 'Failed to load leave data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  // Function to load leaves with current filter
  async function loadLeaves() {
    try {
      setIsLoading(true);
      
      const { data, error: leaveError } = await LeaveService.getLeaves(filter);
      if (leaveError) {
        throw new Error(leaveError);
      }
      
      setLeaves(data || []);
      
      // Load remaining days for each employee
      const remainingDaysMap: Record<string, number> = {};
      const employeeIds = new Set((data || []).map(leave => leave.employee_id));
      
      for (const employeeId of employeeIds) {
        const { data: leaveData } = await LeaveService.getRemainingLeaveDays(employeeId);
        if (leaveData) {
          remainingDaysMap[employeeId] = leaveData.daysRemaining;
        }
      }
      
      setEmployeeRemainingDays(remainingDaysMap);
      
    } catch (err: any) {
      setError(err.message || 'Failed to load leave records');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  
  // Handle search input - live search
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchQuery(value);
    // Trigger search after a short delay
    const timeoutId = setTimeout(() => {
      const newFilter = { ...filter } as any;
      if (value) {
        newFilter.search = value;
      } else {
        delete newFilter.search;
      }
      setFilter(newFilter);
      loadLeaves();
    }, 300);
    return () => clearTimeout(timeoutId);
  }

  // Handle filter changes
  function handleFilterChange(name: keyof LeaveFilter, value: string) {
    const newFilter = { ...filter };
    
    if (value === 'all') {
      delete newFilter[name];
    } else {
      if (name === 'leave_type') {
        newFilter[name] = value as LeaveType;
      } else {
        newFilter[name] = value;
      }
    }
    
    setFilter(newFilter);
  }
  
  // Apply filters
  function applyFilters() {
    loadLeaves();
  }
  
  // Reset filters
  function resetFilters() {
    setFilter({});
    loadLeaves();
  }
  
  // Format date to dd/mm/yyyy
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  // Get branch name for display
  function getBranchName(leave: Leave): string {
    // First try to get from employee.branch.name
    if (leave.employee?.branch?.name) {
      return leave.employee.branch.name;
    }
    
    // Then try to get from employees.branch_id and match with branches array
    if (leave.employees && typeof leave.employees === 'object' && 'branch_id' in leave.employees) {
      const branchId = leave.employees.branch_id;
      const branch = branches.find(b => b.id === branchId);
      if (branch) {
        return branch.name;
      }
    }
    
    // Default fallback
    return '-';
  }
  
  // Handle selection of a leave for batch operations
  function handleSelectLeave(id: string, isSelected: boolean) {
    if (isSelected) {
      setSelectedLeaves([...selectedLeaves, id]);
    } else {
      setSelectedLeaves(selectedLeaves.filter(leaveId => leaveId !== id));
    }
  }
  
  // Handle select all leaves
  function handleSelectAll() {
    if (selectAll) {
      setSelectedLeaves([]);
    } else {
      setSelectedLeaves(leaves.map(leave => leave.id));
    }
    setSelectAll(!selectAll);
  }
  
  // Handle view leave
  function handleViewLeave(id: string) {
    setCurrentViewLeaveId(id);
    setShowLeaveViewModal(true);
  }

  // Handle edit leave
  function handleEditLeave(id: string) {
    setCurrentLeaveId(id);
    setLeaveModalMode('edit');
    setShowLeaveModal(true);
  }

  // Handle add leave
  function handleAddLeave() {
    setCurrentLeaveId(undefined);
    setLeaveModalMode('add');
    setShowLeaveModal(true);
  }

  // Handle delete click
  function handleDeleteClick(id: string) {
    setLeaveToDelete(id);
    setShowDeleteConfirm(true);
  }

  // Handle confirming delete
  async function handleConfirmDelete() {
    if (!leaveToDelete) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await LeaveService.deleteLeave(leaveToDelete);
      
      if (error) {
        throw new Error(error);
      }
      
      // Close modal and reload leaves
      setShowDeleteConfirm(false);
      setLeaveToDelete(null);
      await loadLeaves();
      
    } catch (err: any) {
      setError(err.message || 'Failed to delete leave');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle batch delete
  async function handleBatchDelete() {
    if (selectedLeaves.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedLeaves.length} leave record(s)? This action cannot be undone.`)) {
      try {
        setIsLoading(true);
        let hasError = false;
        
        // Delete each selected leave
        for (const leaveId of selectedLeaves) {
          const { error } = await LeaveService.deleteLeave(leaveId);
          if (error) {
            setError(`Failed to delete some leaves: ${error}`);
            hasError = true;
            break;
          }
        }
        
        // Refresh leaves list
        await loadLeaves();
        setSelectedLeaves([]);
        setSelectAll(false);
        
        if (!hasError) {
          alert(`${selectedLeaves.length} leave record(s) deleted successfully`);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete leave records');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  }
  
  // Handle export
  async function handleExport() {
    try {
      setIsLoading(true);
      
      let exportData: string;
      let fileName: string;
      
      if (exportFormat === 'report') {
        exportData = await ExportService.generateReport(filter as any);
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
      
      setShowExportOptions(false);
      
    } catch (err: any) {
      setError(err.message || 'Failed to export leave records');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden w-full">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h1 className="text-2xl font-bold text-white text-left md:text-left">Leave Management</h1>
              <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="inline-flex rounded-md shadow-sm" role="group">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium ${
                      viewMode === 'list'
                        ? 'text-white bg-indigo-700 hover:bg-indigo-800'
                        : 'text-white bg-indigo-500 hover:bg-indigo-600'
                    } border border-transparent rounded-l-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('calendar')}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium ${
                      viewMode === 'calendar'
                        ? 'text-white bg-indigo-700 hover:bg-indigo-800'
                        : 'text-white bg-indigo-500 hover:bg-indigo-600'
                    } border border-transparent rounded-r-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    Calendar
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
              {/* Search */}
              <div className="relative flex-grow max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search employee name"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              
              {/* Branch Filter (Admin only) */}
              {isAdmin && (
                <div className="w-full md:w-48">
                  <label htmlFor="branch-filter" className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <select
                    id="branch-filter"
                    name="branch-filter"
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={filter.branch_id || 'all'}
                    onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                  >
                    <option value="all">All Branches</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Leave Type Filter */}
              <div className="w-full md:w-48">
                <label htmlFor="leave-type-filter" className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select
                  id="leave-type-filter"
                  name="leave-type-filter"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={filter.leave_type || 'all'}
                  onChange={(e) => handleFilterChange('leave_type', e.target.value)}
                >
                  <option value="all">All Types</option>
                  {leaveTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              {/* Filter Action Buttons */}
              <div className="flex items-end space-x-2">
                <button
                  type="button"
                  onClick={applyFilters}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remaining
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaves.length > 0 ? (
                    leaves.map((leave) => (
                      <tr key={leave.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {leave.employee?.full_name || leave.employees?.full_name || '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {leave.employee?.employee_code || leave.employees?.employee_code || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {getBranchName(leave)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            leave.leave_type === 'Annual' ? 'bg-green-100 text-green-800' : 
                            leave.leave_type === 'Sick' ? 'bg-red-100 text-red-800' : 
                            leave.leave_type === 'Unpaid' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {leave.leave_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {leave.duration} {leave.duration === 1 ? 'day' : 'days'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {employeeRemainingDays[leave.employee_id] !== undefined ? 
                              `${employeeRemainingDays[leave.employee_id]} days` : 
                              '-'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Approved
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewLeave(leave.id)}
                              className="inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteClick(leave.id)}
                                className="inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                        No leave records found. Try adjusting your filters or add a new leave record.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              <LeaveCalendar branchId={filter.branch_id} />
            </div>
          )}
        </div>
      </div>
      {/* Leave View Modal */}
      {showLeaveViewModal && currentViewLeaveId && (
        <LeaveViewModal
          leaveId={currentViewLeaveId}
          isOpen={showLeaveViewModal}
          onClose={() => setShowLeaveViewModal(false)}
        />
      )}

      {/* Leave Modal for Add/Edit */}
      {showLeaveModal && (
        <LeaveModal
          isOpen={showLeaveModal}
          onClose={() => setShowLeaveModal(false)}
          mode={leaveModalMode}
          leaveId={currentLeaveId}
          onSuccess={() => {
            setShowLeaveModal(false);
            loadLeaves();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Leave Record"
        message="Are you sure you want to delete this leave record? This action cannot be undone."
        isDeleting={isLoading}
      />
    </DashboardLayout>
  );
}
