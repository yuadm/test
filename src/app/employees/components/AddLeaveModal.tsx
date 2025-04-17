'use client';

import { useState, useEffect } from 'react';
import { LeaveFormData, Employee, ApiResponse, Leave, LeaveType } from '@/types';
import { LeaveService } from '@/lib/services/leave.service';
import { EmployeeService } from '@/lib/services/employee.service';

interface AddLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  onSuccess: () => void;
}

export default function AddLeaveModal({ isOpen, onClose, employeeId, onSuccess }: AddLeaveModalProps) {
  const [formData, setFormData] = useState<LeaveFormData>({
    employee_id: employeeId,
    leave_type: 'Annual',
    start_date: '',
    end_date: '',
    duration: 0,
    notes: '',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [overlappingLeaves, setOverlappingLeaves] = useState<Leave[]>([]);
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  
  // Leave type options
  const leaveTypes: LeaveType[] = ['Annual', 'Sick', 'Unpaid', 'Working'];

  useEffect(() => {
    if (isOpen && employeeId) {
      setIsLoading(true);
      
      // Reset form data
      setFormData({
        employee_id: employeeId,
        leave_type: 'Annual',
        start_date: '',
        end_date: '',
        duration: 0,
        notes: ''
      });
      
      setValidationErrors({});
      setError(null);
      setOverlappingLeaves([]);
      setIsSaving(false);
      
      // Load employee details and remaining leave days
      const loadEmployee = async () => {
        try {
          const { data: employee, error } = await EmployeeService.getEmployee(employeeId);
          
          if (error || !employee) {
            console.error('Error loading employee:', error);
            setIsLoading(false);
            return;
          }
          
          setEmployeeDetails(employee || null);
          
          // Get remaining leave days
          const { data: remainingDaysData } = await LeaveService.getRemainingLeaveDays(employeeId);
          if (remainingDaysData) {
            setRemainingDays(remainingDaysData.daysRemaining);
          }
          
          // Set default dates to today and tomorrow
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          // Format in YYYY-MM-DD for internal storage (required by backend)
          const todayStr = today.getFullYear() + '-' + 
                          String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(today.getDate()).padStart(2, '0');
          
          const tomorrowStr = tomorrow.getFullYear() + '-' + 
                              String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(tomorrow.getDate()).padStart(2, '0');
          
          setFormData({
            ...formData,
            employee_id: employeeId,
            start_date: todayStr,
            end_date: tomorrowStr,
          });
          
          // Calculate duration
          const startDate = new Date(todayStr);
          const endDate = new Date(tomorrowStr);
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          
          setFormData(prevState => ({
            ...prevState,
            employee_id: employeeId,
            start_date: todayStr,
            end_date: tomorrowStr,
            duration: diffDays
          }));
          
          setIsLoading(false);
        } catch (err) {
          console.error('Error in loadEmployee:', err);
          setIsLoading(false);
        }
      };
      
      loadEmployee();
    }
  }, [isOpen, employeeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Update form data with the new value
    const updatedFormData = {
      ...formData,
      [name]: value,
    };
    
    setFormData(updatedFormData);
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: '',
      });
    }
    
    // Calculate duration when dates change
    if (name === 'start_date' || name === 'end_date') {
      // Use the updated values for calculation
      const startDate = name === 'start_date' ? value : updatedFormData.start_date;
      const endDate = name === 'end_date' ? value : updatedFormData.end_date;
      
      if (startDate && endDate) {
        calculateDurationWithDates(startDate, endDate, updatedFormData);
      }
    }
  };

  // Helper function to calculate days between two dates (including all days)
  const calculateDaysBetween = (startDate: Date, endDate: Date): number => {
    // Calculate the difference in milliseconds
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    // Convert to days and add 1 to include both start and end dates
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // New function that takes specific dates and form data
  const calculateDurationWithDates = (startDateStr: string, endDateStr: string, currentFormData: LeaveFormData) => {
    try {
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      
      if (startDate > endDate) {
        setValidationErrors({
          ...validationErrors,
          end_date: 'End date must be after start date',
        });
        return;
      }
      
      // Calculate total calendar days between dates (including all days)
      const days = calculateDaysBetween(startDate, endDate);
      
      setFormData({
        ...currentFormData,
        duration: days,
      });
      
    } catch (err) {
      console.error('Error calculating duration:', err);
    }
  };
  
  // Keep the original function for backward compatibility
  const calculateDuration = () => {
    calculateDurationWithDates(formData.start_date, formData.end_date, formData);
  };

  const validateForm = (): boolean => {
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
    
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (startDate > endDate) {
      errors.end_date = 'End date must be after start date';
    }
    
    setValidationErrors(errors);
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Check if this leave would exceed the employee's remaining days
    let proceedWithExcessLeave = true;
    if (formData.leave_type === 'Annual' && remainingDays !== null && formData.duration > remainingDays) {
      proceedWithExcessLeave = window.confirm(
        `Warning: This leave exceeds the employee's remaining annual leave days (${remainingDays} days remaining, ${formData.duration} days requested). Do you want to proceed anyway?`
      );
      
      if (!proceedWithExcessLeave) {
        return;
      }
    }
    
    try {
      setIsSaving(true);
      setError(null);
      setOverlappingLeaves([]);
      
      // Create the leave
      const { data, error: saveError, overlappingLeaves: overlapping } = await LeaveService.createLeave(formData);
      
      if (saveError) {
        setError(saveError);
        if (overlapping && overlapping.length > 0) {
          setOverlappingLeaves(overlapping);
        }
        return;
      }
      
      // Log a warning if we're exceeding available days
      if (formData.leave_type === 'Annual' && remainingDays !== null && formData.duration > remainingDays) {
        console.warn(`Leave exceeds available days: ${remainingDays} days remaining, ${formData.duration} days requested`);
      }
      
      // Success
      onSuccess();
      onClose();
      
    } catch (err: any) {
      setError(err.message || 'Failed to save leave');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Add Leave for {employeeDetails?.full_name || 'Employee'}
                </h3>
                
                {isLoading ? (
                  <div className="mt-4 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-4">
                    {error && (
                      <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
                        <p>{error}</p>
                        
                        {overlappingLeaves.length > 0 && (
                          <div className="mt-2">
                            <p className="font-semibold">Overlapping leaves:</p>
                            <ul className="list-disc pl-5 mt-1">
                              {overlappingLeaves.map((leave, index) => (
                                <li key={index}>
                                  {leave.start_date} to {leave.end_date} ({leave.leave_type})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Leave Type
                      </label>
                      <select
                        name="leave_type"
                        value={formData.leave_type}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          name="start_date"
                          value={formData.start_date}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          data-testid="start-date-input"
                        />
                        {validationErrors.start_date && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.start_date}</p>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          name="end_date"
                          value={formData.end_date}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          data-testid="end-date-input"
                        />
                        {validationErrors.end_date && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.end_date}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (Calendar Days)
                      </label>
                      <input
                        type="number"
                        name="duration"
                        value={formData.duration}
                        readOnly
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 sm:text-sm"
                      />
                      {formData.leave_type === 'Annual' && remainingDays !== null && (
                        <div className={`mt-1 text-sm ${formData.duration > remainingDays ? 'text-red-600' : 'text-green-600'}`}>
                          {formData.duration > remainingDays 
                            ? `Warning: Exceeds available days (${remainingDays} remaining)` 
                            : `${remainingDays} days remaining`}
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes || ''}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Optional notes about this leave"
                      ></textarea>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving || isLoading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
