'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LeaveFormData, Employee, ApiResponse, Leave, LeaveType } from '@/types';
import { LeaveService } from '@/lib/services/leave.service';
import { EmployeeService } from '@/lib/services/employee.service';
import { AuthService } from '@/lib/services/auth.service';

interface LeaveFormProps {
  leaveId?: string;
  isEdit?: boolean;
}

export default function LeaveForm({ leaveId, isEdit = false }: LeaveFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [formData, setFormData] = useState<LeaveFormData>({
    employee_id: '',
    leave_type: 'Annual',
    start_date: '',
    end_date: '',
    duration: 0,
    notes: '',
  });
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [overlappingLeaves, setOverlappingLeaves] = useState<Leave[]>([]);
  
  // Leave type options
  const leaveTypes: LeaveType[] = ['Annual', 'Sick', 'Unpaid', 'Working'];

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // Check if user is admin
        const adminStatus = await AuthService.isAdmin();
        setIsAdmin(adminStatus);
        
        // Load employees
        const { data: employeeData, error: employeeError } = await EmployeeService.getEmployees();
        if (employeeError) {
          throw new Error(employeeError);
        }
        setEmployees(employeeData || []);
        
        // If editing, load leave data
        if (isEdit && leaveId) {
          const { data: leave, error: leaveError } = await LeaveService.getLeaveById(leaveId);
          if (leaveError) {
            throw new Error(leaveError);
          }
          
          if (leave) {
            setFormData({
              employee_id: leave.employee_id,
              leave_type: leave.leave_type,
              start_date: leave.start_date,
              end_date: leave.end_date,
              duration: leave.duration,
              notes: leave.notes || '',
            });
          }
        } else {
          // Check if employee ID is provided in URL
          const employeeId = searchParams.get('employee');
          if (employeeId) {
            setFormData(prev => ({ ...prev, employee_id: employeeId }));
          } else if (employeeData && employeeData.length > 0) {
            // Set default employee for new leave
            setFormData(prev => ({ ...prev, employee_id: employeeData[0].id }));
          }
          
          // Set default dates
          const today = new Date();
          const formattedToday = today.toISOString().split('T')[0];
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const formattedTomorrow = tomorrow.toISOString().split('T')[0];
          
          setFormData(prev => ({
            ...prev,
            start_date: formattedToday,
            end_date: formattedTomorrow,
          }));
        }
        
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [leaveId, isEdit, searchParams]);
  
  // Handle form input changes
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when field is changed
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Calculate duration when dates change
    if (name === 'start_date' || name === 'end_date') {
      if (formData.start_date && formData.end_date) {
        const start = new Date(name === 'start_date' ? value : formData.start_date);
        const end = new Date(name === 'end_date' ? value : formData.end_date);
        
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          // Calculate business days between dates
          const duration = calculateBusinessDays(start, end);
          setFormData(prev => ({ ...prev, duration }));
        }
      }
    }
  }
  
  // Calculate business days between two dates
  function calculateBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    
    while (curDate <= endDate) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    
    return count;
  }
  
  // Validate form data
  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    
    if (!formData.employee_id) {
      errors.employee_id = 'Employee is required';
    }
    
    if (!formData.leave_type) {
      errors.leave_type = 'Leave type is required';
    }
    
    if (!formData.start_date) {
      errors.start_date = 'Start date is required';
    }
    
    if (!formData.end_date) {
      errors.end_date = 'End date is required';
    }
    
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      
      if (start > end) {
        errors.end_date = 'End date must be after start date';
      }
    }
    
    if (formData.duration <= 0) {
      errors.duration = 'Duration must be greater than 0';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }
  
  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      setOverlappingLeaves([]);
      
      let response: ApiResponse<Leave> & { overlappingLeaves?: Leave[] };
      
      if (isEdit && leaveId) {
        response = await LeaveService.updateLeave(leaveId, formData);
      } else {
        response = await LeaveService.createLeave(formData);
      }
      
      console.log('Leave submission response:', response);
      
      if (response.error) {
        // If there are overlapping leaves, display them
        if (response.overlappingLeaves && response.overlappingLeaves.length > 0) {
          console.log('Overlapping leaves found:', response.overlappingLeaves);
          setOverlappingLeaves(response.overlappingLeaves);
        }
        throw new Error(response.error);
      }
      
      // Redirect to leave list on success
      router.push('/leave');
      
    } catch (err: any) {
      setError(err.message || 'Failed to save leave record');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {isEdit ? 'Edit Leave Record' : 'Add New Leave Record'}
        </h3>
      </div>
      
      {error && (
        <div className="px-6 py-4">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
          
          {overlappingLeaves.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm font-medium text-red-700 mb-2">Overlapping leave periods:</p>
              <ul className="text-sm text-red-700 list-disc pl-5">
                {overlappingLeaves.map(leave => (
                  <li key={leave.id} className="mb-1">
                    {leave.leave_type} leave: {new Date(leave.start_date).toLocaleDateString()} to {new Date(leave.end_date).toLocaleDateString()} ({leave.duration} days)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
        <div>
          <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
            Employee <span className="text-red-500">*</span>
          </label>
          <select
            id="employee_id"
            name="employee_id"
            value={formData.employee_id}
            onChange={handleChange}
            disabled={isEdit && !isAdmin}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              validationErrors.employee_id
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          >
            <option value="">Select an employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.full_name} ({employee.employee_code})
              </option>
            ))}
          </select>
          {validationErrors.employee_id && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.employee_id}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="leave_type" className="block text-sm font-medium text-gray-700">
            Leave Type <span className="text-red-500">*</span>
          </label>
          <select
            id="leave_type"
            name="leave_type"
            value={formData.leave_type}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              validationErrors.leave_type
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          >
            {leaveTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {validationErrors.leave_type && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.leave_type}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                validationErrors.start_date
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {validationErrors.start_date && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.start_date}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                validationErrors.end_date
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {validationErrors.end_date && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.end_date}</p>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            Duration (Working Days) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            min="1"
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              validationErrors.duration
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
          {validationErrors.duration && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.duration}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Duration is automatically calculated based on start and end dates (excluding weekends).
          </p>
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push('/leave')}
            className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Leave Record'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
