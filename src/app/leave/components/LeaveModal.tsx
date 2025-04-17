'use client';

import { useState, useEffect } from 'react';
import { LeaveFormData, Employee, ApiResponse, Leave, LeaveType } from '@/types';
import { LeaveService } from '@/lib/services/leave.service';
import { EmployeeService } from '@/lib/services/employee.service';
import { AuthService } from '@/lib/services/auth.service';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveId?: string;
  mode: 'view' | 'edit' | 'add';
  onSuccess: () => void;
}

export default function LeaveModal({ isOpen, onClose, leaveId, mode, onSuccess }: LeaveModalProps) {
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
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  
  // Leave type options
  const leaveTypes: LeaveType[] = ['Annual', 'Sick', 'Unpaid', 'Working'];

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, leaveId, mode]);

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
      
      // If viewing or editing, load leave data
      if ((mode === 'view' || mode === 'edit') && leaveId) {
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
          
          // Load employee details
          if (leave.employee_id) {
            const { data: employee } = await EmployeeService.getEmployee(leave.employee_id);
            if (employee) {
              setEmployeeDetails(employee);
            }
          }
        }
      } else if (mode === 'add') {
        // Set default employee for new leave
        if (employeeData && employeeData.length > 0) {
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
        
        // Calculate initial duration
        const duration = calculateBusinessDays(today, tomorrow);
        setFormData(prev => ({ ...prev, duration }));
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  
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
    
    // Load employee details when employee changes
    if (name === 'employee_id') {
      const employee = employees.find(emp => emp.id === value);
      if (employee) {
        setEmployeeDetails(employee);
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
    
    if (mode === 'view') {
      onClose();
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      setOverlappingLeaves([]);
      
      let response: ApiResponse<Leave>;
      
      if (mode === 'edit' && leaveId) {
        response = await LeaveService.updateLeave(leaveId, formData);
      } else {
        response = await LeaveService.createLeave(formData);
      }
      
      if (response.error) {
        // Check if error is due to overlapping leaves
        if (response.data && Array.isArray(response.data)) {
          setOverlappingLeaves(response.data as Leave[]);
          setError('This leave overlaps with existing leave records');
        } else {
          throw new Error(response.error);
        }
        return;
      }
      
      // Close modal and refresh data
      onSuccess();
      onClose();
      
    } catch (err: any) {
      setError(err.message || 'Failed to save leave record');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  // Format date for display
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
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'view' ? 'View Leave' : mode === 'edit' ? 'Edit Leave' : 'Add New Leave'}
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
        
        {overlappingLeaves.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-md">
            <p className="font-medium mb-2">Overlapping leave records:</p>
            <ul className="text-sm space-y-1">
              {overlappingLeaves.map((leave, index) => (
                <li key={index}>
                  {formatDate(leave.start_date)} to {formatDate(leave.end_date)} ({leave.leave_type})
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-6">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
                Employee <span className="text-red-500">*</span>
              </label>
              <select
                id="employee_id"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                disabled={mode === 'view'}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  validationErrors.employee_id
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } ${mode === 'view' ? 'bg-gray-100' : ''}`}
              >
                <option value="">Select an employee</option>
                {employees.map(employee => (
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
                disabled={mode === 'view'}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  validationErrors.leave_type
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } ${mode === 'view' ? 'bg-gray-100' : ''}`}
              >
                {leaveTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {validationErrors.leave_type && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.leave_type}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  disabled={mode === 'view'}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    validationErrors.start_date
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } ${mode === 'view' ? 'bg-gray-100' : ''}`}
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
                  disabled={mode === 'view'}
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    validationErrors.end_date
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } ${mode === 'view' ? 'bg-gray-100' : ''}`}
                />
                {validationErrors.end_date && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.end_date}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                Duration (working days) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                disabled={mode === 'view'}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  validationErrors.duration
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } ${mode === 'view' ? 'bg-gray-100' : ''}`}
              />
              {validationErrors.duration && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.duration}</p>
              )}
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
                disabled={mode === 'view'}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  validationErrors.notes
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } ${mode === 'view' ? 'bg-gray-100' : ''}`}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              
              {mode !== 'view' && (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
