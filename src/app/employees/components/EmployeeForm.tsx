'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EmployeeFormData, Branch, ApiResponse, Employee } from '@/types';
import { EmployeeService } from '@/lib/services/employee.service';
import { BranchService } from '@/lib/services/branch.service';

interface EmployeeFormProps {
  employeeId?: string;
  isEdit?: boolean;
}

export default function EmployeeForm({ employeeId, isEdit = false }: EmployeeFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<EmployeeFormData>({
    full_name: '',
    employee_code: '',
    job_title: '',
    branch_id: '',
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
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
    
    loadData();
  }, [employeeId, isEdit]);
  
  // Handle form input changes
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
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
      
      // Redirect to employees list on success
      router.push('/employees');
      
    } catch (err: any) {
      setError(err.message || 'Failed to save employee');
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
          {isEdit ? 'Edit Employee' : 'Add New Employee'}
        </h3>
      </div>
      
      {error && (
        <div className="px-6 py-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
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
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
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
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              validationErrors.full_name
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
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
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              validationErrors.employee_code
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
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
            value={formData.job_title}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
              validationErrors.branch_id
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
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
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push('/employees')}
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
              'Save Employee'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
