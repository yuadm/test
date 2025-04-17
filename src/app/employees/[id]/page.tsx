'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { EmployeeService } from '@/lib/services/employee.service';
import { LeaveService } from '@/lib/services/leave.service';
import { AuthService } from '@/lib/services/auth.service';
import type { Employee, Leave } from '@/types';

export default function EmployeeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
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
        
        // Load employee details
        const { data: employeeData, error: employeeError } = await EmployeeService.getEmployee(employeeId);
        if (employeeError) {
          throw new Error(employeeError);
        }
        setEmployee(employeeData || null);
        
        // Load employee leave records
        const { data: leaveData, error: leaveError } = await LeaveService.getLeaves({ employee_id: employeeId });
        if (leaveError) {
          throw new Error(leaveError);
        }
        setLeaves(leaveData || []);
        
      } catch (err: any) {
        setError(err.message || 'Failed to load employee details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [employeeId]);
  
  // Handle employee deletion
  async function handleDeleteEmployee() {
    try {
      setIsDeleting(true);
      
      const { error: deleteError } = await EmployeeService.deleteEmployee(employeeId);
      
      if (deleteError) {
        throw new Error(deleteError);
      }
      
      // Redirect to employees list on success
      router.push('/employees');
      
    } catch (err: any) {
      setError(err.message || 'Failed to delete employee');
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

  if (!employee) {
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
                {error || 'Employee not found'}
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
          <h1 className="text-2xl font-bold text-gray-900">{employee.full_name}</h1>
          <p className="text-gray-600">Employee Details</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => router.push(`/leave/new?employee=${employeeId}`)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Add Leave
          </button>
          <button
            onClick={() => router.push(`/employees/${employeeId}/edit`)}
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
      
      {/* Employee Details */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Employee Information</h3>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{employee.full_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Employee Code</dt>
              <dd className="mt-1 text-sm text-gray-900">{employee.employee_code}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Job Title</dt>
              <dd className="mt-1 text-sm text-gray-900">{employee.job_title || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Branch</dt>
              <dd className="mt-1 text-sm text-gray-900">{employee.branch?.name || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(employee.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Leave Records */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Leave Records</h3>
          <button
            onClick={() => router.push(`/leave/new?employee=${employeeId}`)}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            + Add Leave
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaves.length > 0 ? (
                leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        leave.leave_type === 'Annual' ? 'bg-blue-100 text-blue-800' :
                        leave.leave_type === 'Sick' ? 'bg-red-100 text-red-800' :
                        leave.leave_type === 'Unpaid' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {leave.leave_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {leave.start_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {leave.end_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {leave.duration} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {leave.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/leave/${leave.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => router.push(`/leave/${leave.id}/edit`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No leave records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete {employee.full_name}? This action cannot be undone.
            </p>
            <p className="text-sm text-red-500 mb-4">
              Note: Employees with leave records cannot be deleted.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEmployee}
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
