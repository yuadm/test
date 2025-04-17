'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { EmployeeService } from '@/lib/services/employee.service';
import { BranchService } from '@/lib/services/branch.service';
import { AuthService } from '@/lib/services/auth.service';
import { ExportService } from '@/lib/services/export.service';
import { LeaveService } from '@/lib/services/leave.service';
import EmployeeModal from './components/EmployeeModal';
import EmployeeViewModal from './components/EmployeeViewModal';
import ImportModal from './components/ImportModal';
import AddLeaveModal from './components/AddLeaveModal';
import type { Employee, Branch, EmployeeFilter } from '@/types';

import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [filter, setFilter] = useState<EmployeeFilter>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [deleteProgress, setDeleteProgress] = useState<{ current: number; total: number } | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [leaveEmployeeId, setLeaveEmployeeId] = useState<string>('');
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | undefined>(undefined);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);
  
  async function loadData() {
    try {
      setIsLoading(true);
      
      // Check if user is admin
      const adminStatus = await AuthService.isAdmin();
      setIsAdmin(adminStatus);
      
      // Load branches
      const { data: branchData, error: branchError } = await BranchService.getAllBranches();
      if (branchError) {
        throw new Error(branchError);
      }
      setBranches(branchData || []);
      
      // Load employees with filter
      await loadEmployees();
      
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  
  // Function to load employees with current filter
  async function loadEmployees() {
    try {
      setIsLoading(true);
      
      // Apply search query to filter if it exists
      const currentFilter: EmployeeFilter = { ...filter };
      if (searchQuery) {
        currentFilter.search = searchQuery;
      }
      
      const { data, error: employeeError } = await EmployeeService.getEmployees(currentFilter);
      if (employeeError) {
        throw new Error(employeeError);
      }
      
      // Get the current leave year
      const { data: leaveYear, error: leaveYearError } = await LeaveService.getCurrentLeaveYear();
      if (leaveYearError) {
        throw new Error(leaveYearError);
      }
      
      // Load leave data for each employee
      if (data && data.length > 0 && leaveYear) {
        const employeesWithLeaveData = await Promise.all(
          data.map(async (employee) => {
            // Only calculate days taken and remaining if they're not already set in the database
            if (employee.days_taken === undefined || employee.days_remaining === undefined) {
              // Get days taken and remaining for this employee
              const { data: leaveData } = await LeaveService.getRemainingLeaveDays(employee.id, leaveYear.id);
              
              // Calculate days taken as 28 - days remaining
              const daysRemaining = leaveData?.daysRemaining || 28;
              const daysTaken = 28 - daysRemaining;
              
              return {
                ...employee,
                days_taken: daysTaken,
                days_remaining: daysRemaining
              };
            }
            
            // Use the values from the database
            return employee;
          })
        );
        
        setEmployees(employeesWithLeaveData);
      } else {
        setEmployees(data || []);
      }
      
      setSelectedEmployees([]);
      setSelectAll(false);
      
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  
  // Handle branch filter change
  function handleBranchFilterChange(branchId: string) {
    const newFilter = { ...filter };
    
    if (branchId === 'all') {
      delete newFilter.branch_id;
    } else {
      newFilter.branch_id = branchId;
    }
    
    setFilter(newFilter);
    // We need to call loadEmployees after updating the filter
    // Use setTimeout to ensure the state is updated before loading employees
    setTimeout(() => {
      loadEmployees();
    }, 0);
  }
  
  // Handle search input - immediate live search
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchQuery(value);
    // Trigger search immediately
    // If search query is empty, show all employees
    loadEmployees();
  }
  
  // Handle select all checkbox
  function handleSelectAll() {
    if (selectAll) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.id));
    }
    setSelectAll(!selectAll);
  }
  
  // Handle individual employee selection
  function handleSelectEmployee(id: string) {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter(empId => empId !== id));
      setSelectAll(false);
    } else {
      setSelectedEmployees([...selectedEmployees, id]);
      if (selectedEmployees.length + 1 === employees.length) {
        setSelectAll(true);
      }
    }
  }
  
  // Handle delete confirmation
  function handleDeleteClick(employeeId: string) {
    setEmployeeToDelete(employeeId);
    setShowDeleteConfirm(true);
  }

  // Handle confirming delete of a single employee
  async function handleConfirmDelete() {
    if (!employeeToDelete) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await EmployeeService.deleteEmployee(employeeToDelete);
      
      if (error) {
        throw new Error(error);
      }
      
      // Close modal and reload employees
      setShowDeleteConfirm(false);
      setEmployeeToDelete(null);
      await loadEmployees();
      
    } catch (err: any) {
      setError(err.message || 'Failed to delete employee');
      console.error(err);
    } finally {
      setIsLoading(false);
      setDeleteProgress(null);
    }
  }
  
  // Handle batch delete
  async function handleBatchDelete() {
    if (selectedEmployees.length === 0) return;
    
    try {
      setIsLoading(true);
      
      // Initialize progress tracking
      setDeleteProgress({ current: 0, total: selectedEmployees.length });
      
      // Process each employee one by one to track progress
      let deleted = 0;
      let failed = 0;
      
      for (let i = 0; i < selectedEmployees.length; i++) {
        const id = selectedEmployees[i];
        
        // Delete employee leaves first
        const { error: leaveError } = await LeaveService.deleteEmployeeLeaves(id);
        if (leaveError) {
          failed++;
          setDeleteProgress({ current: i + 1, total: selectedEmployees.length });
          continue;
        }
        
        // Then delete the employee
        const { error } = await EmployeeService.deleteEmployee(id);
        
        if (error) {
          failed++;
        } else {
          deleted++;
        }
        
        // Update progress
        setDeleteProgress({ current: i + 1, total: selectedEmployees.length });
      }
      
      // Show results
      if (failed > 0) {
        setError(`Deleted ${deleted} employees, but failed to delete ${failed} employees.`);
      } else {
        setError(null);
      }
      
      // Close modal and reload employees
      setShowDeleteConfirm(false);
      await loadEmployees();
      
    } catch (err: any) {
      setError(err.message || 'Failed to delete employees');
      console.error(err);
    } finally {
      setIsLoading(false);
      setDeleteProgress(null);
    }
  }
  
  // Handle export
  async function handleExport() {
    try {
      setIsLoading(true);
      setShowExportOptions(false);
      
      // Get employees with current filter
      const currentFilter: EmployeeFilter = { ...filter };
      if (searchQuery) {
        currentFilter.search = searchQuery;
      }
      
      // Export data based on the filter, not the actual employee data
      if (exportFormat === 'csv') {
        await ExportService.exportEmployeesToCSV(currentFilter);
      } else {
        await ExportService.exportEmployeesToExcel(currentFilter);
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to export employees');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle opening the add employee modal
  function handleAddEmployee() {
    setCurrentEmployeeId(undefined);
    setIsEditMode(false);
    setShowEmployeeModal(true);
  }

  // Handle opening the edit employee modal
  function handleEditEmployee(id: string) {
    setCurrentEmployeeId(id);
    setIsEditMode(true);
    setShowEmployeeModal(true);
  }

  // Handle deleting a single employee
  function handleDeleteEmployee(id: string) {
    // Set the employee to delete and show the confirmation modal
    setEmployeeToDelete(id);
    setShowDeleteConfirm(true);
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Employees</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all employees in your organization.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex sm:items-center sm:space-x-4">
            {/* Search box - moved to the left for better alignment */}
            <div className="relative w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search employees..."
                className="pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full transition-all duration-200 bg-gray-50 hover:bg-white"
                value={searchQuery}
                onChange={handleSearchChange}
                autoFocus
              />
              {searchQuery && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      loadEmployees();
                    }}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    title="Clear search"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Branch Filter - moved next to search for better alignment */}
            {isAdmin && (
              <div className="w-48">
                <select
                  id="branch-filter"
                  name="branch-filter"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={filter.branch_id || 'all'}
                  onChange={(e) => handleBranchFilterChange(e.target.value)}
                >
                  <option value="all">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex space-x-2">
              {isAdmin && (
                <>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Import
                  </button>
                  <button
                    onClick={() => setShowExportOptions(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Export
                  </button>
                  {selectedEmployees.length > 0 && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete Selected
                    </button>
                  )}
                </>
              )}
              <button
                onClick={handleAddEmployee}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Employee
              </button>
            </div>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {error}
                </h3>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setError(null)}
                    className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Table */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-white">
                    <tr className="bg-white">
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          checked={selectAll}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days Taken
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days Remaining
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-left">
                          <div className="flex justify-left">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                          </div>
                        </td>
                      </tr>
                    ) : employees.length > 0 ? (
                      employees.map((employee) => (
                        <tr key={employee.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                checked={selectedEmployees.includes(employee.id)}
                                onChange={() => handleSelectEmployee(employee.id)}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-left">
                            {employee.full_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">
                            {employee.employee_code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">
                            {employee.job_title || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">
                            {employee.branch?.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">
                            {employee.days_taken !== undefined ? employee.days_taken : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-left">
                            {employee.days_remaining !== undefined ? (
                              <span className={employee.days_remaining < 5 ? 'text-red-600 font-medium' : ''}>
                                {employee.days_remaining}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  // Open the view modal to show employee details and leaves
                                  setCurrentEmployeeId(employee.id);
                                  setShowViewModal(true);
                                }}
                                className="inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                title="View employee details"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setCurrentEmployeeId(employee.id);
                                  setIsEditMode(true);
                                  setShowEmployeeModal(true);
                                }}
                                className="inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                title="Edit employee"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  // Open the add leave modal for this employee
                                  setLeaveEmployeeId(employee.id);
                                  setShowAddLeaveModal(true);
                                }}
                                className="inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                title="Add leave for this employee"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Leave
                              </button>
                              <button
                                onClick={() => handleDeleteClick(employee.id)}
                                className="inline-flex items-center justify-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                title="Delete employee"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-left">
                          No employees found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteProgress(null);
        }}
        onConfirm={employeeToDelete ? handleConfirmDelete : handleBatchDelete}
        title={employeeToDelete ? 'Delete Employee' : 'Delete Selected Employees'}
        message={employeeToDelete ? 'Are you sure you want to delete this employee? This action cannot be undone.' : `Are you sure you want to delete ${selectedEmployees.length} employees? This action cannot be undone.`}
        isDeleting={isLoading}
        progress={deleteProgress || undefined}
      />
      
      {/* Add Leave Modal */}
      {showAddLeaveModal && leaveEmployeeId && (
        <AddLeaveModal
          isOpen={showAddLeaveModal}
          onClose={() => setShowAddLeaveModal(false)}
          employeeId={leaveEmployeeId}
          onSuccess={() => {
            // Reload employees to update days taken and remaining days
            loadEmployees();
          }}
        />
      )}
      
      {/* Employee View Modal */}
      {currentEmployeeId && (
        <EmployeeViewModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          employeeId={currentEmployeeId}
        />
      )}
      
      {/* Export Options Modal */}
      {showExportOptions && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Export Options</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    id="format-csv"
                    name="format"
                    type="radio"
                    checked={exportFormat === 'csv'}
                    onChange={() => setExportFormat('csv')}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <label htmlFor="format-csv" className="ml-3 block text-sm font-medium text-gray-700">
                    CSV
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="format-excel"
                    name="format"
                    type="radio"
                    checked={exportFormat === 'excel'}
                    onChange={() => setExportFormat('excel')}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                  <label htmlFor="format-excel" className="ml-3 block text-sm font-medium text-gray-700">
                    Excel
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowExportOptions(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      <EmployeeModal 
        isOpen={showEmployeeModal}
        onClose={() => setShowEmployeeModal(false)}
        employeeId={currentEmployeeId}
        isEdit={isEditMode}
        onSuccess={loadEmployees}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={loadEmployees}
      />
    </DashboardLayout>
  );
}
