'use client';

import { useState, useEffect } from 'react';
import { Employee, Leave, Branch } from '@/types';
import { EmployeeService } from '@/lib/services/employee.service';
import { LeaveService } from '@/lib/services/leave.service';

interface EmployeeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
}

export default function EmployeeViewModal({ isOpen, onClose, employeeId }: EmployeeViewModalProps) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && employeeId) {
      loadEmployeeData();
    }
  }, [isOpen, employeeId]);

  async function loadEmployeeData() {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load employee details
      const { data: employeeData, error: employeeError } = await EmployeeService.getEmployee(employeeId);
      
      if (employeeError) {
        throw new Error(employeeError);
      }
      
      if (employeeData) {
        setEmployee(employeeData);
        
        // Load employee's leave records
        const { data: leavesData, error: leavesError } = await LeaveService.getLeaves({ employee_id: employeeId });
        
        if (leavesError) {
          throw new Error(leavesError);
        }
        
        setLeaves(leavesData || []);
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to load employee data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  
  // Format date to readable format
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Employee Details
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-6">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : employee ? (
          <div className="space-y-6">
            {/* Employee Details Card */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {employee.full_name}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Employee Code: {employee.employee_code}
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Job Title</dt>
                    <dd className="mt-1 text-sm text-gray-900">{employee.job_title || 'Not specified'}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Branch</dt>
                    <dd className="mt-1 text-sm text-gray-900">{employee.branch?.name || 'Not assigned'}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Leave Balance</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {employee.days_remaining !== undefined ? (
                        <span className={employee.days_remaining < 5 ? 'text-red-600 font-medium' : ''}>
                          {employee.days_remaining} days remaining
                        </span>
                      ) : 'Not available'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {/* Leave Records */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Leave Records
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  All leave records for this employee
                </p>
              </div>
              <div className="overflow-x-auto">
                {leaves.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
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
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaves.map((leave) => (
                        <tr key={leave.id} className="hover:bg-gray-50">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {leave.duration} {leave.duration === 1 ? 'day' : 'days'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Approved
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {leave.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-8 text-center text-sm text-gray-500">
                    No leave records found for this employee.
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-500">
            Employee not found.
          </div>
        )}
      </div>
    </div>
  );
}
