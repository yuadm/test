'use client';

import { useState, useEffect } from 'react';
import { EmployeeFormData, Branch, ApiResponse, Employee } from '@/types';
import { EmployeeService } from '@/lib/services/employee.service';
import { BranchService } from '@/lib/services/branch.service';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId?: string;
  isEdit?: boolean;
  onSuccess: () => void;
}

export default function EmployeeModal({ isOpen, onClose, employeeId, isEdit = false, onSuccess }: EmployeeModalProps) {
  const [formData, setFormData] = useState<EmployeeFormData>({
    full_name: '',
    employee_code: '',
    job_title: '',
    branch_id: '',
    is_active: true,
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, employeeId, isEdit]);

  async function loadData() {
    try {
      setIsLoading(true);
      
      // Load branches
      const { data: branchData, error: branchError } = await BranchService.getAllBranches();
      if (branchError) {
        throw new Error(branchError);
      }
      setBranches(branchData || []);
      
      // If editing, load employee data
      if (isEdit && employeeId) {
        const { data: employee, error: employeeError } = await EmployeeService.getEmployee(employeeId);
        if (employeeError) {
          throw new Error(employeeError);
        }
        
        if (employee) {
          setFormData({
            full_name: employee.full_name,
            employee_code: employee.employee_code,
            job_title: employee.job_title || '',
            branch_id: employee.branch_id,
            is_active: employee.is_active !== undefined ? employee.is_active : true,
          });
        }
      } else if (branchData && branchData.length > 0) {
        // Set default branch for new employee
        setFormData(prev => ({ ...prev, branch_id: branchData[0].id }));
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }
  
  // Handle form input changes
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear validation error when field is changed
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }
  
  // Validate form data
  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    
    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }
    
    if (!formData.employee_code.trim()) {
      errors.employee_code = 'Employee code is required';
    }
    
    if (!formData.branch_id) {
      errors.branch_id = 'Branch is required';
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
      
      let response: ApiResponse<Employee>;
      
      if (isEdit && employeeId) {
        response = await EmployeeService.updateEmployee(employeeId, formData);
      } else {
        response = await EmployeeService.createEmployee(formData);
      }
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Close modal and refresh data
      onSuccess();
      onClose();
      
    } catch (err: any) {
      setError(err.message || 'Failed to save employee');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit && !employeeId ? 'View Employee' : isEdit ? 'Edit Employee' : 'Add New Employee'}
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
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                readOnly={isEdit && !employeeId}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  validationErrors.full_name
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : (isEdit && !employeeId) 
                      ? 'bg-gray-100 border-gray-300'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {validationErrors.full_name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.full_name}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="employee_code" className="block text-sm font-medium text-gray-700">
                Employee Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="employee_code"
                name="employee_code"
                value={formData.employee_code}
                onChange={handleChange}
                readOnly={isEdit && !employeeId}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  validationErrors.employee_code
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : (isEdit && !employeeId) 
                      ? 'bg-gray-100 border-gray-300'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
              {validationErrors.employee_code && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.employee_code}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="job_title" className="block text-sm font-medium text-gray-700">
                Job Title
              </label>
              <input
                type="text"
                id="job_title"
                name="job_title"
                value={formData.job_title || ''}
                onChange={handleChange}
                readOnly={isEdit && !employeeId}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  (isEdit && !employeeId) 
                    ? 'bg-gray-100 border-gray-300'
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              />
            </div>
            
            <div>
              <label htmlFor="branch_id" className="block text-sm font-medium text-gray-700">
                Branch <span className="text-red-500">*</span>
              </label>
              <select
                id="branch_id"
                name="branch_id"
                value={formData.branch_id}
                onChange={handleChange}
                disabled={isEdit && !employeeId}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  validationErrors.branch_id
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : (isEdit && !employeeId) 
                      ? 'bg-gray-100 border-gray-300'
                      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
              >
                <option value="">Select a branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {validationErrors.branch_id && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.branch_id}</p>
              )}
            </div>
            
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                disabled={isEdit && !employeeId}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-700">
                Active Employee
              </label>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isEdit && !employeeId ? 'Close' : 'Cancel'}
              </button>
              {!(isEdit && !employeeId) && (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    'Save'
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
