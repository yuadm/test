'use client';

import { useState } from 'react';
import { useEmployees, useDeleteEmployee } from '@/lib/hooks/useEmployees';
import { Employee, EmployeeFilter } from '@/types';
import { useDebounce } from '@/lib/hooks/useDebounce';
import VirtualizedList from '@/components/VirtualizedList';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';

interface VirtualizedEmployeeListProps {
  filter: EmployeeFilter;
  onViewEmployee: (id: string) => void;
  onEditEmployee: (id: string) => void;
  isAdmin: boolean;
}

export default function VirtualizedEmployeeList({ 
  filter, 
  onViewEmployee, 
  onEditEmployee, 
  isAdmin 
}: VirtualizedEmployeeListProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  
  // Use debounced filter to prevent too many API calls when filter changes rapidly
  const debouncedFilter = useDebounce(filter, 500);
  
  // Fetch employees
  const { 
    data: employees = [], 
    isLoading, 
    error 
  } = useEmployees(debouncedFilter);
  
  // Delete employee mutation
  const deleteEmployeeMutation = useDeleteEmployee();
  
  // Handle delete confirmation
  const handleDeleteClick = (id: string) => {
    setEmployeeToDelete(id);
    setShowDeleteConfirm(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (employeeToDelete) {
      try {
        await deleteEmployeeMutation.mutateAsync(employeeToDelete);
        setShowDeleteConfirm(false);
        setEmployeeToDelete(null);
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };
  
  // Handle delete cancellation
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setEmployeeToDelete(null);
  };
  
  // Render each employee row
  const renderEmployee = (employee: Employee, index: number, style: React.CSSProperties) => (
    <div 
      key={employee.id} 
      style={style} 
      className={`flex items-center p-4 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b`}
    >
      <div className="flex-1">{employee.full_name}</div>
      <div className="flex-1">{employee.employee_code}</div>
      <div className="flex-1">{employee.job_title || 'N/A'}</div>
      <div className="flex-1">{employee.branch?.name || 'Unknown'}</div>
      <div className="flex-1">
        <div className="flex space-x-2">
          <button
            onClick={() => onViewEmployee(employee.id)}
            className="text-blue-600 hover:text-blue-800"
          >
            View
          </button>
          <button
            onClick={() => onEditEmployee(employee.id)}
            className="text-green-600 hover:text-green-800"
          >
            Edit
          </button>
          {isAdmin && (
            <button
              onClick={() => handleDeleteClick(employee.id)}
              className="text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
  
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading employees...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 p-4">Error loading employees: {error.toString()}</div>;
  }
  
  if (employees.length === 0) {
    return <div className="text-gray-500 p-4">No employees found matching the criteria.</div>;
  }
  
  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center p-4 bg-gray-100 font-semibold">
        <div className="flex-1">Name</div>
        <div className="flex-1">Employee Code</div>
        <div className="flex-1">Position</div>
        <div className="flex-1">Branch</div>
        <div className="flex-1">Actions</div>
      </div>
      
      {/* Virtualized List */}
      <VirtualizedList
        items={employees}
        height={600}
        itemSize={60}
        renderItem={renderEmployee}
        className="border-t"
      />
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Employee"
          message="Are you sure you want to delete this employee? This action cannot be undone."
        />
      )}
    </div>
  );
}
