'use client';

import { useState } from 'react';
import { useLeaves, useDeleteLeave } from '@/lib/hooks/useLeaves';
import { Leave, LeaveFilter } from '@/types';
import { useDebounce } from '@/lib/hooks/useDebounce';
import Pagination from '@/components/Pagination';
import { format } from 'date-fns';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';

interface LeaveListProps {
  filter: LeaveFilter;
  onViewLeave: (id: string) => void;
  onEditLeave: (id: string) => void;
  isAdmin: boolean;
}

export default function LeaveList({ filter, onViewLeave, onEditLeave, isAdmin }: LeaveListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [leaveToDelete, setLeaveToDelete] = useState<string | null>(null);
  
  // Use debounced filter to prevent too many API calls when filter changes rapidly
  const debouncedFilter = useDebounce(filter, 500);
  
  // Fetch leaves with pagination
  const { 
    data: leaves = [], 
    isLoading, 
    error,
    refetch
  } = useLeaves(debouncedFilter, { page: currentPage, pageSize });
  
  // Delete leave mutation
  const deleteLeaveMutation = useDeleteLeave();
  
  // Calculate total pages - this is a placeholder since we need to modify the API to return total count
  const totalPages = Math.ceil((leaves?.length || 0) / pageSize);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle delete confirmation
  const handleDeleteClick = (id: string) => {
    setLeaveToDelete(id);
    setShowDeleteConfirm(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (leaveToDelete) {
      try {
        await deleteLeaveMutation.mutateAsync(leaveToDelete);
        setShowDeleteConfirm(false);
        setLeaveToDelete(null);
      } catch (error) {
        console.error('Error deleting leave:', error);
      }
    }
  };
  
  // Handle delete cancellation
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setLeaveToDelete(null);
  };
  
  if (isLoading) {
    return <div className="flex justify-center p-8">Loading leaves...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 p-4">Error loading leaves: {error.toString()}</div>;
  }
  
  if (leaves.length === 0) {
    return <div className="text-gray-500 p-4">No leaves found matching the criteria.</div>;
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 text-left">Employee</th>
            <th className="py-2 px-4 text-left">Type</th>
            <th className="py-2 px-4 text-left">Start Date</th>
            <th className="py-2 px-4 text-left">End Date</th>
            <th className="py-2 px-4 text-left">Duration</th>
            <th className="py-2 px-4 text-left">Status</th>
            <th className="py-2 px-4 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map((leave) => (
            <tr key={leave.id} className="border-b hover:bg-gray-50">
              <td className="py-2 px-4">{leave.employees?.full_name || 'Unknown'}</td>
              <td className="py-2 px-4">{leave.leave_type}</td>
              <td className="py-2 px-4">{format(new Date(leave.start_date), 'dd/MM/yyyy')}</td>
              <td className="py-2 px-4">{format(new Date(leave.end_date), 'dd/MM/yyyy')}</td>
              <td className="py-2 px-4">{leave.duration} days</td>
              <td className="py-2 px-4">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  leave.status === 'Approved' ? 'bg-green-100 text-green-800' :
                  leave.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  leave.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {leave.status || 'Not Set'}
                </span>
              </td>
              <td className="py-2 px-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onViewLeave(leave.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEditLeave(leave.id)}
                    className="text-green-600 hover:text-green-800"
                  >
                    Edit
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteClick(leave.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        className="mt-4"
      />
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Leave"
          message="Are you sure you want to delete this leave record? This action cannot be undone."
        />
      )}
    </div>
  );
}
