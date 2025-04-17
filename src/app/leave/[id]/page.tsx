'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { LeaveService } from '@/lib/services/leave.service';
import { AuthService } from '@/lib/services/auth.service';
import type { Leave } from '@/types';

export default function LeaveDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const leaveId = params.id as string;
  
  const [leave, setLeave] = useState<Leave | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // Check if user is admin
        const adminStatus = await AuthService.isAdmin();
        setIsAdmin(adminStatus);
        
        // Load leave details
        const { data: leaveData, error: leaveError } = await LeaveService.getLeaveById(leaveId);
        if (leaveError) {
          throw new Error(leaveError);
        }
        setLeave(leaveData || null);
        
      } catch (err: any) {
        setError(err.message || 'Failed to load leave details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [leaveId]);
  
  // Handle leave deletion
  async function handleDeleteLeave() {
    try {
      setIsDeleting(true);
      
      const { error: deleteError } = await LeaveService.deleteLeave(leaveId);
      
      if (deleteError) {
        throw new Error(deleteError);
      }
      
      // Redirect to leave list on success
      router.push('/leave');
      
    } catch (err: any) {
      setError(err.message || 'Failed to delete leave record');
      setShowDeleteConfirm(false);
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!leave) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || 'Leave record not found'}
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Details</h1>
          <p className="text-gray-600">{leave.employee?.full_name} - {leave.leave_type} Leave</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => router.push(`/leave/${leaveId}/edit`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Delete
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Leave Status Card */}
      <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Leave Status</h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            leave.leave_type === 'Annual' ? 'bg-blue-100 text-blue-800' :
            leave.leave_type === 'Sick' ? 'bg-red-100 text-red-800' :
            leave.leave_type === 'Unpaid' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {leave.leave_type} Leave
          </span>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Start Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{leave.start_date}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">End Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{leave.end_date}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Duration</dt>
              <dd className="mt-1 text-sm text-gray-900">{leave.duration} working days</dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Employee Details */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Employee Information</h3>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <button 
                  onClick={() => router.push(`/employees/${leave.employee_id}`)}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {leave.employee?.full_name}
                </button>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Employee Code</dt>
              <dd className="mt-1 text-sm text-gray-900">{leave.employee?.employee_code}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Job Title</dt>
              <dd className="mt-1 text-sm text-gray-900">{leave.employee?.job_title || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Branch</dt>
              <dd className="mt-1 text-sm text-gray-900">{leave.employee?.branch?.name || '-'}</dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Leave Notes */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Notes</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-700 whitespace-pre-line">
            {leave.notes || 'No notes provided for this leave record.'}
          </p>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this leave record? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLeave}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
