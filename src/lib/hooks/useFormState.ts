'use client';

import { useState, useCallback } from 'react';
import { useDebounce } from './useDebounce';

/**
 * Custom hook for managing form state with debounced validation
 * @param initialState Initial form state
 * @param validate Validation function
 * @param debounceMs Debounce time in milliseconds
 */
export function useFormState<T extends Record<string, any>>(
  initialState: T,
  validate?: (values: T) => Record<string, string>,
  debounceMs = 300
) {
  // Form values state
  const [values, setValues] = useState<T>(initialState);
  
  // Form errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form touched state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Debounced values for validation
  const debouncedValues = useDebounce(values, debounceMs);
  
  // Validate form when debounced values change
  useState(() => {
    if (validate) {
      const validationErrors = validate(debouncedValues);
      setErrors(validationErrors);
    }
  });
  
  // Handle input change
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }));
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  }, []);
  
  // Handle blur event
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate immediately on blur if validation function exists
    if (validate) {
      const validationErrors = validate(values);
      setErrors(validationErrors);
    }
  }, [values, validate]);
  
  // Set a specific field value
  const setFieldValue = useCallback((name: string, value: any) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  }, []);
  
  // Reset form to initial state
  const resetForm = useCallback(() => {
    setValues(initialState);
    setErrors({});
    setTouched({});
  }, [initialState]);
  
  // Check if form is valid
  const isValid = Object.keys(errors).length === 0;
  
  // Check if form is dirty (has changes)
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialState);
  
  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    resetForm,
    isValid,
    isDirty
  };
}
