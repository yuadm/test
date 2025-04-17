'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { LeaveService } from '@/lib/services/leave.service';
import { BranchService } from '@/lib/services/branch.service';
import { EmployeeService } from '@/lib/services/employee.service';
import { AuthService } from '@/lib/services/auth.service';
import { ExportService } from '@/lib/services/export.service';
import type { Branch, Employee, LeaveFilter } from '@/types';

export default function ReportsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<{ id: string; name: string }[]>([]);
  
  // Selected employees for multi-select
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  
  // Report filter state
  const [filter, setFilter] = useState<LeaveFilter>({
    start_date: '',
    end_date: '',
    branch_id: '',
    employee_id: '',
    leave_type: undefined,
  });
  
  // Report format options
  const [reportFormat, setReportFormat] = useState<'csv' | 'excel'>('csv');
  
  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      const admin = await AuthService.isAdmin();
      setIsAdmin(admin);
      
      // Redirect non-admin users
      if (!admin) {
        alert('Only administrators can access the reports section.');
        router.push('/dashboard');
      }
    };
    
    checkAdmin();
  }, [router]);
  
  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setIsLoading(true);
        
        // Load branches
        const { data: branchData, error: branchError } = await BranchService.getAllBranches();
        if (branchError) throw new Error(branchError);
        setBranches(branchData || []);
        
        // Load employees
        const { data: employeeData, error: employeeError } = await EmployeeService.getEmployees();
        if (employeeError) throw new Error(employeeError);
        setEmployees(employeeData || []);
        
        // Define leave types manually since there's no getLeaveTypes function
        setLeaveTypes([
          { id: 'Annual', name: 'Annual' },
          { id: 'Sick', name: 'Sick' },
          { id: 'Unpaid', name: 'Unpaid' },
          { id: 'Working', name: 'Working' }
        ]);
        
      } catch (err: any) {
        setError(err.message || 'Failed to load filter options');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFilterOptions();
  }, []);
  
  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle employee selection for multi-select
  const handleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };
  
  // Handle report generation
  const generateReport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      // Prepare filter with selected employees if using multi-select
      const exportFilter = { ...filter };
      
      if (selectedEmployees.length > 0) {
        // For multiple employees, we'll generate separate reports
        const reports = [];
        for (const employeeId of selectedEmployees) {
          const employeeFilter = { ...filter, employee_id: employeeId };
          
          // Generate report based on format
          let reportData;
          if (reportFormat === 'excel') {
            reportData = await ExportService.exportLeavesToExcel(employeeFilter);
          } else {
            reportData = await ExportService.exportLeavesToCSV(employeeFilter);
          }
          
          // Find employee name for filename
          const employee = employees.find(e => e.id === employeeId);
          const employeeName = employee ? employee.full_name.replace(/\s+/g, '_') : employeeId;
          
          // Generate filename
          const filename = generateFilename(employeeName, reportFormat === 'excel' ? 'xlsx' : 'csv');
          
          // Create download
          const blob = new Blob([reportData], { 
            type: reportFormat === 'excel' 
              ? 'application/vnd.ms-excel' 
              : 'text/csv;charset=utf-8;' 
          });
          const url = window.URL.createObjectURL(blob);
          
          // Download file
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          
          // Clean up
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          reports.push({ employeeId, employeeName, filename });
        }
        
        setSuccessMessage(`Generated ${reports.length} ${reportFormat.toUpperCase()} reports for selected employees.`);
      } else {
        // Single report for all employees or filtered by one employee
        let reportData;
        if (reportFormat === 'excel') {
          reportData = await ExportService.exportLeavesToExcel(exportFilter);
        } else {
          reportData = await ExportService.exportLeavesToCSV(exportFilter);
        }
        
        // Generate filename
        const filename = generateFilename('leave-summary', reportFormat === 'excel' ? 'xlsx' : 'csv');
        
        // Create download
        const blob = new Blob([reportData], { 
          type: reportFormat === 'excel' 
            ? 'application/vnd.ms-excel' 
            : 'text/csv;charset=utf-8;' 
        });
        const url = window.URL.createObjectURL(blob);
        
        // Download file
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setSuccessMessage(`${reportFormat.toUpperCase()} report generated successfully.`);
      }
    } catch (err: any) {
      console.error('Report generation error:', err);
      setError(err.message || `Failed to generate ${reportFormat.toUpperCase()} report`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for display and filenames
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };
  
  // Generate filename based on report type and date range
  const generateFilename = (reportType: string, extension: string): string => {
    let dateRangePart = '';
    
    if (filter.start_date && filter.end_date) {
      dateRangePart = `_${formatDateForDisplay(filter.start_date).replace(/\//g, '-')}_to_${formatDateForDisplay(filter.end_date).replace(/\//g, '-')}`;
    } else if (filter.start_date) {
      dateRangePart = `_from_${formatDateForDisplay(filter.start_date).replace(/\//g, '-')}`;
    } else if (filter.end_date) {
      dateRangePart = `_until_${formatDateForDisplay(filter.end_date).replace(/\//g, '-')}`;
    } else {
      dateRangePart = `_all_dates`;
    }
    
    // Add branch info if selected
    if (filter.branch_id) {
      const branchName = branches.find(b => b.id === filter.branch_id)?.name || 'unknown-branch';
      dateRangePart += `_${branchName.toLowerCase().replace(/\s+/g, '-')}`;
    }
    
    // Add leave type if selected
    if (filter.leave_type) {
      dateRangePart += `_${filter.leave_type.toLowerCase().replace(/\s+/g, '-')}`;
    }
    
    return `${reportType}${dateRangePart}.${extension}`;
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilter({
      start_date: '',
      end_date: '',
      branch_id: '',
      employee_id: '',
      leave_type: undefined,
    });
    setSelectedEmployees([]);
  };
  
  if (!isAdmin) {
    return null; // Don't render anything while checking admin status
  }
  
  return (
    <DashboardLayout>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden w-full">
          {/* Header */}
          <div className="bg-blue-600 px-6 py-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <h1 className="text-2xl font-bold text-white text-left md:text-left">Leave Reports</h1>
            </div>
          </div>
          
          {/* Filter Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Report Filters</h2>
            
            {(error || successMessage) && (
              <div className={`bg-${error ? 'red' : 'green'}-50 border-l-4 border-${error ? 'red' : 'green'}-400 p-4 mb-4`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className={`h-5 w-5 text-${error ? 'red' : 'green'}-400`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm text-${error ? 'red' : 'green'}-700`}>{error || successMessage}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date Range */}
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={filter.start_date}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={filter.end_date}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              {/* Branch Filter */}
              <div>
                <label htmlFor="branch_id" className="block text-sm font-medium text-gray-700">Branch</label>
                <select
                  id="branch_id"
                  name="branch_id"
                  value={filter.branch_id}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Single Employee Filter (for simple filtering) */}
              <div>
                <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">Single Employee Filter</label>
                <select
                  id="employee_id"
                  name="employee_id"
                  value={filter.employee_id}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Employees</option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>{employee.full_name}</option>
                  ))}
                </select>
              </div>
              
              {/* Leave Type Filter */}
              <div>
                <label htmlFor="leave_type" className="block text-sm font-medium text-gray-700">Leave Type</label>
                <select
                  id="leave_type"
                  name="leave_type"
                  value={filter.leave_type || ''}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Leave Types</option>
                  {leaveTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Multiple Employee Selection */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Multiple Employees for Report
                {selectedEmployees.length > 0 && ` (${selectedEmployees.length} selected)`}
              </label>
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {employees.map(employee => (
                    <div key={employee.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`employee-${employee.id}`}
                        checked={selectedEmployees.includes(employee.id)}
                        onChange={() => handleEmployeeSelection(employee.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`employee-${employee.id}`} className="ml-2 block text-sm text-gray-900 truncate">
                        {employee.full_name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {selectedEmployees.length === 0 
                  ? "No employees selected. Reports will be generated for all employees matching other filters." 
                  : "Reports will be generated for each selected employee individually."}
              </p>
            </div>
            
            {/* Filter Actions */}
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reset Filters
              </button>
            </div>
          </div>
          
          {/* Report Generation */}
          <div className="mt-8 grid grid-cols-1 gap-6">
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-5">
                    <h3 className="text-lg font-medium text-gray-900">Generate Report</h3>
                    <p className="text-sm text-gray-500">Export leave data based on your filters</p>
                  </div>
                </div>
                
                {/* Report Format Selection */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Format</label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio h-4 w-4 text-blue-600"
                        checked={reportFormat === 'csv'}
                        onChange={() => setReportFormat('csv')}
                      />
                      <span className="ml-2 text-sm text-gray-700">CSV</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio h-4 w-4 text-blue-600"
                        checked={reportFormat === 'excel'}
                        onChange={() => setReportFormat('excel')}
                      />
                      <span className="ml-2 text-sm text-gray-700">Excel</span>
                    </label>
                  </div>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={generateReport}
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Generating...' : `Generate ${reportFormat.toUpperCase()} Report`}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Preview of filename */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-700">Sample Filename Preview:</h3>
            <p className="text-sm text-gray-600 mt-1">
              {generateFilename('leave-summary', reportFormat === 'excel' ? 'xlsx' : 'csv')}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Note: When multiple employees are selected, individual files will be generated with employee names appended.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
