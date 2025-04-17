'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeService } from '@/lib/services/employee.service';
import { Employee, EmployeeFilter, EmployeeFormData } from '@/types';
import { PaginationParams } from '@/types/pagination';

// Key factory for employee queries
const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters: EmployeeFilter = {}, pagination?: PaginationParams) => 
    [...employeeKeys.lists(), { filters, pagination }] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
};

// Hook for fetching employees with optional filtering and pagination
export function useEmployees(filter?: EmployeeFilter, pagination?: PaginationParams) {
  return useQuery({
    queryKey: employeeKeys.list(filter, pagination),
    queryFn: () => EmployeeService.getEmployees(filter, pagination),
    select: (data) => data.data,
    // Only refetch when component mounts or query is invalidated
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching a single employee by ID
export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => EmployeeService.getEmployee(id),
    select: (data) => data.data,
    // Only fetch if ID is provided
    enabled: !!id,
  });
}

// Hook for creating a new employee
export function useCreateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (employeeData: EmployeeFormData) => 
      EmployeeService.createEmployee(employeeData),
    onSuccess: () => {
      // Invalidate employees list queries to refetch data
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

// Hook for updating an employee
export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmployeeFormData> }) => 
      EmployeeService.updateEmployee(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific employee query
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.id) });
      // Invalidate employees list queries
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

// Hook for deleting an employee
export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => EmployeeService.deleteEmployee(id),
    onSuccess: (_, id) => {
      // Invalidate specific employee query
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) });
      // Invalidate employees list queries
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}
