import { useState, useEffect } from 'react';
import { User, Branch, UserFormData, UserRole } from '@/types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: UserFormData) => void;
  mode: 'create' | 'edit' | 'password';
  user: User | null;
  branches: Branch[];
}

export default function UserModal({ isOpen, onClose, onSave, mode, user, branches }: UserModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    role: 'user',
    branch_id: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Reset form when modal opens or mode/user changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'create') {
        setFormData({
          email: '',
          password: '',
          role: 'user',
          branch_id: branches.length > 0 ? branches[0].id : ''
        });
      } else if (mode === 'edit' && user) {
        setFormData({
          email: user.email,
          password: '', // Don't include password when editing
          role: user.role,
          branch_id: user.branch_id || ''
        });
      } else if (mode === 'password') {
        setFormData({
          email: user?.email || '',
          password: '',
          role: user?.role || 'user',
          branch_id: user?.branch_id || ''
        });
      }
      
      setErrors({});
    }
  }, [isOpen, mode, user, branches]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Email validation
    if (mode !== 'password') {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    }
    
    // Password validation
    if (mode === 'create' || mode === 'password') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
    }
    
    // Branch validation for normal users
    if (formData.role === 'user' && !formData.branch_id) {
      newErrors.branch_id = 'Branch is required for normal users';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // For password reset, only include necessary fields
      if (mode === 'password') {
        onSave({
          email: user?.email || '',
          password: formData.password,
          role: user?.role || 'user',
          branch_id: user?.branch_id || undefined
        });
      } else {
        onSave(formData);
      }
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900">
            {mode === 'create' ? 'Create New User' : mode === 'edit' ? 'Edit User' : 'Reset Password'}
          </h3>
          
          <form onSubmit={handleSubmit} className="mt-4">
            {/* Email field - only show for create/edit */}
            {mode !== 'password' && (
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.email ? 'border-red-300' : ''
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            )}
            
            {/* Password field - show for create and password reset */}
            {(mode === 'create' || mode === 'password') && (
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {mode === 'create' ? 'Password' : 'New Password'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.password ? 'border-red-300' : ''
                  }`}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            )}
            
            {/* Role selection - only show for create/edit */}
            {mode !== 'password' && (
              <div className="mb-4">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="admin">Administrator</option>
                  <option value="user">Normal User</option>
                </select>
              </div>
            )}
            
            {/* Branch selection - only show for normal users on create/edit */}
            {mode !== 'password' && formData.role === 'user' && (
              <div className="mb-4">
                <label htmlFor="branch_id" className="block text-sm font-medium text-gray-700">
                  Branch
                </label>
                <select
                  id="branch_id"
                  name="branch_id"
                  value={formData.branch_id || ''}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.branch_id ? 'border-red-300' : ''
                  }`}
                >
                  <option value="">Select a branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {errors.branch_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.branch_id}</p>
                )}
              </div>
            )}
            
            {/* Action buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {mode === 'create' ? 'Create' : mode === 'edit' ? 'Save Changes' : 'Reset Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
