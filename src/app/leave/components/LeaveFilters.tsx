'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BranchService } from '@/lib/services/branch.service';
import { EmployeeService } from '@/lib/services/employee.service';
import { LeaveFilter, LeaveType, Branch, Employee } from '@/types';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface LeaveFiltersProps {
  filter: LeaveFilter;
  onFilterChange: (filter: LeaveFilter) => void;
  leaveTypes: LeaveType[];
  isAdmin: boolean;
}

export default function LeaveFilters({ 
  filter, 
  onFilterChange, 
  leaveTypes,
  isAdmin 
}: LeaveFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Fetch branches
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data } = await BranchService.getAllBranches();
      return data || [];
    }
  });
  
  // Fetch employees
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', filter.branch_id],
    queryFn: async () => {
      const { data } = await EmployeeService.getEmployees(
        filter.branch_id ? { branch_id: filter.branch_id } : undefined
      );
      return data || [];
    },
    enabled: isAdmin // Only fetch all employees if admin
  });
  
  // Update filter when search query changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      onFilterChange({ ...filter, search: debouncedSearchQuery });
    } else if (filter.search) {
      const newFilter = { ...filter };
      delete newFilter.search;
      onFilterChange(newFilter);
    }
  }, [debouncedSearchQuery]);
  
  // Handle branch change
  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({ 
      ...filter, 
      branch_id: value === '' ? undefined : value 
    });
  };
  
  // Handle employee change
  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFilterChange({ 
      ...filter, 
      employee_id: value === '' ? undefined : value 
    });
  };
  
  // Handle leave type change
  const handleLeaveTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as LeaveType | '';
    onFilterChange({ 
      ...filter, 
      leave_type: value === '' ? undefined : value as LeaveType 
    });
  };
  
  // Handle date range change
  const handleDateChange = (field: 'start_date' | 'end_date', value: string) => {
    onFilterChange({ 
      ...filter, 
      [field]: value === '' ? undefined : value 
    });
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h2 className="text-lg font-semibold mb-4">Filter Leaves</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        {/* Branch Filter (Admin only) */}
        {isAdmin && (
          <div>
            <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              id="branch"
              value={filter.branch_id || ''}
              onChange={handleBranchChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Employee Filter */}
        <div>
          <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">
            Employee
          </label>
          <select
            id="employee"
            value={filter.employee_id || ''}
            onChange={handleEmployeeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Employees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Leave Type Filter */}
        <div>
          <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">
            Leave Type
          </label>
          <select
            id="leaveType"
            value={filter.leave_type || ''}
            onChange={handleLeaveTypeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Types</option>
            {leaveTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        
        {/* Date Range Filters */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <input
            type="date"
            id="startDate"
            value={filter.start_date || ''}
            onChange={(e) => handleDateChange('start_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <input
            type="date"
            id="endDate"
            value={filter.end_date || ''}
            onChange={(e) => handleDateChange('end_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>
    </div>
  );
}
