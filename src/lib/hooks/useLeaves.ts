'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LeaveService } from '@/lib/services/leave.service';
import { Leave, LeaveFilter, LeaveFormData } from '@/types';
import { PaginationParams } from '@/types/pagination';

// Key factory for leave queries
const leaveKeys = {
  all: ['leaves'] as const,
  lists: () => [...leaveKeys.all, 'list'] as const,
  list: (filters: LeaveFilter = {}, pagination?: PaginationParams) => 
    [...leaveKeys.lists(), { filters, pagination }] as const,
  details: () => [...leaveKeys.all, 'detail'] as const,
  detail: (id: string) => [...leaveKeys.details(), id] as const,
  summary: () => [...leaveKeys.all, 'summary'] as const,
  summaryByType: (branchId?: string | null) => [...leaveKeys.summary(), 'byType', branchId] as const,
  summaryByMonth: (branchId?: string | null) => [...leaveKeys.summary(), 'byMonth', branchId] as const,
};

// Hook for fetching leaves with optional filtering and pagination
export function useLeaves(filter?: LeaveFilter, pagination?: PaginationParams) {
  return useQuery({
    queryKey: leaveKeys.list(filter, pagination),
    queryFn: () => LeaveService.getLeaves(filter, pagination),
    select: (data) => data.data,
    // Only refetch when component mounts or query is invalidated
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

// Hook for fetching a single leave by ID
export function useLeave(id: string) {
  return useQuery({
    queryKey: leaveKeys.detail(id),
    queryFn: () => LeaveService.getLeaveById(id),
    select: (data) => data.data,
    // Only fetch if ID is provided
    enabled: !!id,
  });
}

// Hook for creating a new leave
export function useCreateLeave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (leaveData: LeaveFormData) => 
      LeaveService.createLeave(leaveData),
    onSuccess: () => {
      // Invalidate leaves list queries to refetch data
      queryClient.invalidateQueries({ queryKey: leaveKeys.lists() });
      // Invalidate summary queries
      queryClient.invalidateQueries({ queryKey: leaveKeys.summary() });
    },
  });
}

// Hook for updating a leave
export function useUpdateLeave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LeaveFormData> }) => 
      LeaveService.updateLeave(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific leave query
      queryClient.invalidateQueries({ queryKey: leaveKeys.detail(variables.id) });
      // Invalidate leaves list queries
      queryClient.invalidateQueries({ queryKey: leaveKeys.lists() });
      // Invalidate summary queries
      queryClient.invalidateQueries({ queryKey: leaveKeys.summary() });
    },
  });
}

// Hook for deleting a leave
export function useDeleteLeave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => LeaveService.deleteLeave(id),
    onSuccess: (_, id) => {
      // Invalidate specific leave query
      queryClient.invalidateQueries({ queryKey: leaveKeys.detail(id) });
      // Invalidate leaves list queries
      queryClient.invalidateQueries({ queryKey: leaveKeys.lists() });
      // Invalidate summary queries
      queryClient.invalidateQueries({ queryKey: leaveKeys.summary() });
    },
  });
}

// Hook for fetching leave summary by type
export function useLeaveSummaryByType(branchId?: string | null) {
  return useQuery({
    queryKey: leaveKeys.summaryByType(branchId),
    queryFn: () => LeaveService.getLeaveSummaryByType(branchId),
    select: (data) => data.data,
  });
}

// Hook for fetching leave summary by month
export function useLeaveSummaryByMonth(branchId?: string | null) {
  return useQuery({
    queryKey: leaveKeys.summaryByMonth(branchId),
    queryFn: () => LeaveService.getLeavesThisMonth(branchId as string),
    select: (data) => data.data,
  });
}

// Hook for fetching employee remaining leave days
export function useEmployeeRemainingLeaveDays(employeeId: string, yearId: string) {
  return useQuery({
    queryKey: [...leaveKeys.all, 'remainingDays', employeeId, yearId],
    queryFn: () => LeaveService.getRemainingLeaveDays(employeeId, yearId),
    select: (data) => data.data,
    enabled: !!employeeId && !!yearId,
  });
}
