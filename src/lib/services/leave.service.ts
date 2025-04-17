import { createClient } from '@/lib/supabase/client';
import { Leave, LeaveFormData, ApiResponse, LeaveFilter, Employee, LeaveType, Settings } from '@/types';
import { PaginationParams, createPaginatedResponse } from '@/types/pagination';
import { DataCache } from '@/lib/utils/cache';
import { AuthService } from './auth.service';

// Helper function to calculate business days between two dates (excluding weekends)
function calculateBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const curDate = new Date(startDate.getTime());
  
  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
    curDate.setDate(curDate.getDate() + 1);
  }
  
  return count;
}

export const LeaveService = {
  // Helper function to convert database leave to typed Leave
  convertDbLeaveToTyped(dbLeave: any): Leave {
    return {
      ...dbLeave,
      leave_type: dbLeave.leave_type as LeaveType,
      notes: dbLeave.notes ?? undefined
    };
  },

  // Get all leaves with optional filtering and pagination
  async getLeaves(filter?: LeaveFilter, pagination?: PaginationParams): Promise<ApiResponse<Leave[]>> {
    try {
      // Generate cache key based on filter and pagination
      const cacheKey = `leaves:${JSON.stringify(filter || {})}:${JSON.stringify(pagination || {})}`;
      
      // Check cache first
      const cachedData = DataCache.get(cacheKey);
      if (cachedData) {
        return { data: cachedData };
      }
      
      const supabase = createClient();
      
      // Check user permissions
      const isAdmin = await AuthService.isAdmin();
      
      // Build query with optimized field selection
      let query = supabase
        .from('leaves')
        .select('id, employee_id, start_date, end_date, duration, leave_type, notes, created_at, created_by, leave_year_id, employees(id, full_name, employee_code, branch_id)');
      
      // Apply filters
      if (filter) {
        if (filter.employee_id) {
          query = query.eq('employee_id', filter.employee_id);
        }
        
        if (filter.leave_type) {
          query = query.eq('leave_type', filter.leave_type);
        }
        
        if (filter.start_date) {
          query = query.gte('start_date', filter.start_date);
        }
        
        if (filter.end_date) {
          query = query.lte('end_date', filter.end_date);
        }
      }
      
      // If not admin, filter by user's branch
      if (!isAdmin && !filter?.branch_id) {
        const branchId = await AuthService.getUserBranchId();
        if (branchId) {
          query = query.eq('employees.branch_id', branchId);
        }
      } else if (filter?.branch_id) {
        query = query.eq('employees.branch_id', filter.branch_id);
      }
      
      // Execute query
      const { data, error } = await query.order('start_date', { ascending: false });
      
      if (error) {
        return { error: error.message };
      }
      
      // Convert to typed Leave objects
      const typedLeaves = data?.map(leave => this.convertDbLeaveToTyped(leave)) || [];
      
      return { data: typedLeaves };
    } catch (error: any) {
      return { error: error.message || 'Failed to get leaves' };
    }
  },
  
  // Get leave by ID
  async getLeaveById(id: string): Promise<ApiResponse<Leave>> {
    try {
      // Generate cache key
      const cacheKey = `leave:${id}`;
      
      // Check cache first
      const cachedData = DataCache.get(cacheKey);
      if (cachedData) {
        return { data: cachedData };
      }
      
      const supabase = createClient();
      
      // Optimize query to select only needed fields
      const { data, error } = await supabase
        .from('leaves')
        .select('id, employee_id, start_date, end_date, duration, leave_type, notes, created_at, created_by, leave_year_id, employees(id, full_name, employee_code, branch_id)')
        .eq('id', id)
        .single();
      
      if (error) {
        return { error: error.message };
      }
      
      if (!data) {
        return { error: 'Leave not found' };
      }
      
      const processedData = this.convertDbLeaveToTyped(data);
      
      // Cache the result
      DataCache.set(cacheKey, processedData);
      
      return { data: processedData };
    } catch (error: any) {
      return { error: error.message || 'Failed to get leave' };
    }
  },

  // Delete a leave record
  async deleteLeave(id: string): Promise<ApiResponse<void>> {
    try {
      const supabase = createClient();
      
      // Check if user is admin
      const isAdmin = await AuthService.isAdmin();
      if (!isAdmin) {
        return { error: 'Only administrators can delete leave records' };
      }
      
      // Delete the leave record
      const { error } = await supabase
        .from('leaves')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting leave:', error);
        return { error: error.message };
      }
      
      return { data: undefined };
    } catch (err: any) {
      console.error('Error in deleteLeave:', err);
      return { error: err.message };
    }
  },

  // Delete all leaves for an employee
  async deleteEmployeeLeaves(employeeId: string): Promise<ApiResponse<void>> {
    try {
      const supabase = createClient();
      
      // Check if user is admin
      const isAdmin = await AuthService.isAdmin();
      if (!isAdmin) {
        return { error: 'Only administrators can delete leave records' };
      }
      
      // Delete all leave records for the employee
      const { error } = await supabase
        .from('leaves')
        .delete()
        .eq('employee_id', employeeId);
      
      if (error) {
        console.error('Error deleting employee leaves:', error);
        return { error: error.message };
      }
      
      return { data: undefined };
    } catch (err: any) {
      console.error('Error in deleteEmployeeLeaves:', err);
      return { error: err.message };
    }
  },
  
  // Create a new leave record
  async createLeave(leaveData: LeaveFormData): Promise<ApiResponse<Leave> & { overlappingLeaves?: Leave[] }> {
    const supabase = createClient();
    
    // Get current user for created_by field
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return { error: 'User not authenticated' };
    }
    
    // Check if user has permission to create leave for this employee
    const isAdmin = await AuthService.isAdmin();
    if (!isAdmin) {
      const branchId = await AuthService.getUserBranchId();
      
      // Get employee's branch
      const { data: employee } = await supabase
        .from('employees')
        .select('branch_id')
        .eq('id', leaveData.employee_id)
        .single();
      
      if (!employee || employee.branch_id !== branchId) {
        return { error: 'You do not have permission to create leave for this employee' };
      }
    }
    
    // Get current leave year
    const { data: leaveYear, error: yearError } = await supabase
      .from('leave_years')
      .select('id')
      .eq('is_current', true)
      .single();
    
    if (yearError || !leaveYear) {
      return { error: 'No active leave year found' };
    }
    
    // Check if there are overlapping leaves for this employee
    const startDate = new Date(leaveData.start_date);
    const endDate = new Date(leaveData.end_date);
    
    // Validate date range
    if (startDate > endDate) {
      return { error: 'Start date must be before end date' };
    }
    
    // Calculate business days
    const duration = calculateBusinessDays(startDate, endDate);
    
    // Check for overlapping leaves
    const { data: overlappingLeaves, error: overlapError } = await supabase
      .from('leaves')
      .select('*')
      .eq('employee_id', leaveData.employee_id)
      .or(`and(start_date.gte.${leaveData.start_date},start_date.lte.${leaveData.end_date}),and(end_date.gte.${leaveData.start_date},end_date.lte.${leaveData.end_date}),and(start_date.lte.${leaveData.start_date},end_date.gte.${leaveData.start_date})`);
    
    if (overlapError) {
      return { error: overlapError.message };
    }
    
    if (overlappingLeaves && overlappingLeaves.length > 0) {
      return { 
        error: 'There are overlapping leave records for this employee',
        overlappingLeaves: overlappingLeaves.map(leave => this.convertDbLeaveToTyped(leave))
      };
    }
    
    // Get employee's remaining days and check if they have enough for this leave
    let warningMessage = null;
    if (leaveData.leave_type === 'Annual') {
      // Get employee's current leave status
      const remainingDaysResponse = await this.getRemainingLeaveDays(leaveData.employee_id, leaveYear.id);
      
      if (remainingDaysResponse.error) {
        return { error: remainingDaysResponse.error };
      }
      
      if (remainingDaysResponse.data) {
        const { daysTaken, daysRemaining } = remainingDaysResponse.data;
        
        // Check if this leave would exceed the employee's remaining days
        if (duration > daysRemaining) {
          // Instead of blocking, just add a warning
          warningMessage = `Warning: This leave exceeds the employee's remaining annual leave days (${daysRemaining} days remaining, ${duration} days requested).`;
        }
      }
    }
    
    // Create leave record
    const { data, error } = await supabase
      .from('leaves')
      .insert({
        employee_id: leaveData.employee_id,
        leave_type: leaveData.leave_type,
        start_date: leaveData.start_date,
        end_date: leaveData.end_date,
        duration: duration,
        notes: leaveData.notes || null,
        created_by: user.id,
        leave_year_id: leaveYear.id
      })
      .select('*')
      .single();
    
    if (error) {
      return { error: error.message };
    }
    
    // Update days_taken and days_remaining in the employees table
    if (leaveData.leave_type === 'Annual' && data && typeof leaveData.employee_id === 'string' && typeof data.leave_year_id === 'string') {
      const employeeId = leaveData.employee_id;
      const leaveYearId = data.leave_year_id;
      await this.updateEmployeeLeaveDays(employeeId, leaveYearId);
    }
    
    return { data: this.convertDbLeaveToTyped(data) };
  },
  
  // Update an existing leave record
  async updateLeave(id: string, leaveData: Partial<LeaveFormData>): Promise<ApiResponse<Leave> & { overlappingLeaves?: Leave[] }> {
    const supabase = createClient();
    
    // Get current user for audit
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return { error: 'User not authenticated' };
    }
    
    // Get existing leave record
    const { data: existingLeave, error: fetchError } = await supabase
      .from('leaves')
      .select('*, employees(branch_id)')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingLeave) {
      return { error: fetchError?.message || 'Leave record not found' };
    }
    
    // Check if user has permission to update this leave
    const isAdmin = await AuthService.isAdmin();
    if (!isAdmin) {
      const branchId = await AuthService.getUserBranchId();
      
      if (existingLeave.employees.branch_id !== branchId) {
        return { error: 'You do not have permission to update leave for this employee' };
      }
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (leaveData.employee_id) {
      updateData.employee_id = leaveData.employee_id;
    }
    
    if (leaveData.leave_type) {
      updateData.leave_type = leaveData.leave_type;
    }
    
    if (leaveData.start_date) {
      updateData.start_date = leaveData.start_date;
    }
    
    if (leaveData.end_date) {
      updateData.end_date = leaveData.end_date;
    }
    
    if (leaveData.notes !== undefined) {
      updateData.notes = leaveData.notes || null;
    }
    
    // If dates are being updated, recalculate duration
    if (leaveData.start_date || leaveData.end_date) {
      const startDate = new Date(leaveData.start_date || existingLeave.start_date);
      const endDate = new Date(leaveData.end_date || existingLeave.end_date);
      
      // Validate date range
      if (startDate > endDate) {
        return { error: 'Start date must be before end date' };
      }
      
      // Calculate business days
      updateData.duration = calculateBusinessDays(startDate, endDate);
      
      // Check for overlapping leaves
      const { data: overlappingLeaves, error: overlapError } = await supabase
        .from('leaves')
        .select('*')
        .eq('employee_id', leaveData.employee_id || existingLeave.employee_id)
        .neq('id', id) // Exclude current leave
        .or(`and(start_date.gte.${updateData.start_date || existingLeave.start_date},start_date.lte.${updateData.end_date || existingLeave.end_date}),and(end_date.gte.${updateData.start_date || existingLeave.start_date},end_date.lte.${updateData.end_date || existingLeave.end_date}),and(start_date.lte.${updateData.start_date || existingLeave.start_date},end_date.gte.${updateData.start_date || existingLeave.start_date})`);
      
      if (overlapError) {
        return { error: overlapError.message };
      }
      
      if (overlappingLeaves && overlappingLeaves.length > 0) {
        return { 
          error: 'There are overlapping leave records for this employee',
          overlappingLeaves: overlappingLeaves.map(leave => this.convertDbLeaveToTyped(leave))
        };
      }
      
      // Check if employee has already taken 28 days of annual leave in the current leave year
      if ((leaveData.leave_type === 'Annual' || (!leaveData.leave_type && existingLeave.leave_type === 'Annual'))) {
        // Get current leave year
        const { data: leaveYear, error: yearError } = await supabase
          .from('leave_years')
          .select('id')
          .eq('is_current', true)
          .single();
        
        if (yearError || !leaveYear) {
          return { error: 'No active leave year found' };
        }
        
        const { data: existingLeaves, error: existingLeavesError } = await supabase
          .from('leaves')
          .select('duration')
          .eq('employee_id', leaveData.employee_id || existingLeave.employee_id)
          .eq('leave_type', 'Annual')
          .eq('leave_year_id', leaveYear.id)
          .neq('id', id); // Exclude current leave
        
        if (existingLeavesError) {
          return { error: existingLeavesError.message };
        }
        
        const totalDaysTaken = existingLeaves ? existingLeaves.reduce((sum, leave) => sum + leave.duration, 0) : 0;
        
        // Allow negative balance but add a warning message
        if (totalDaysTaken + updateData.duration > 28) {
          console.log(`Warning: Employee is exceeding their 28-day annual leave allowance. Current total: ${totalDaysTaken}, Adding: ${updateData.duration}, New total will be: ${totalDaysTaken + updateData.duration}`);
          // Continue with the update instead of blocking
        }
      }
    }
    
    // Update leave record
    const { data, error } = await supabase
      .from('leaves')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      return { error: error.message };
    }
    
    // Update days_taken and days_remaining if the leave type is Annual
    // Use the employee_id from the original record (existingLeave) and the leave_year_id from the updated record (data)
    if (data && data.leave_type === 'Annual' && typeof existingLeave.employee_id === 'string' && typeof data.leave_year_id === 'string') {
      const employeeId = existingLeave.employee_id; // Guaranteed string from fetch
      const leaveYearId = data.leave_year_id;     // Checked as string
      await this.updateEmployeeLeaveDays(employeeId, leaveYearId);
    }
    
    return { data: this.convertDbLeaveToTyped(data) };
  },
  
  // Get leave summary by type
  async getLeaveSummaryByType(branchId?: string | null): Promise<ApiResponse<Record<LeaveType, number>>> {
    try {
      const supabase = createClient();
      
      // Get current leave year
      const { data: leaveYear, error: leaveYearError } = await supabase
        .from('leave_years')
        .select('id')
        .eq('is_current', true)
        .single();
      
      if (leaveYearError || !leaveYear) {
        return { error: 'No active leave year found' };
      }
      
      // Check user permissions
      const isAdmin = await AuthService.isAdmin();
      if (!isAdmin && !branchId) {
        const userBranchId = await AuthService.getUserBranchId();
        branchId = userBranchId ?? undefined;
      }
      
      // Build the query
      let query = supabase
        .from('leaves')
        .select('leave_type, duration, employees!inner(branch_id)')
        .eq('leave_year_id', leaveYear.id);
      
      if (branchId) {
        query = query.eq('employees.branch_id', branchId);
      }
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        return { error: error.message };
      }
      
      // Calculate summary
      const summary: Record<LeaveType, number> = {
        Annual: 0,
        Sick: 0,
        Unpaid: 0,
        Working: 0
      };
      
      data.forEach(leave => {
        summary[leave.leave_type as LeaveType] += leave.duration;
      });
      
      return { data: summary };
    } catch (error: any) {
      return { error: error.message || 'Failed to get leave summary' };
    }
  },
  
  // Get upcoming leaves
  async getUpcomingLeaves(days: number = 7): Promise<ApiResponse<Leave[]>> {
    try {
      const supabase = createClient();
      
      // Calculate date range
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + days);
      
      // Format dates for query
      const todayStr = today.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Check user permissions
      const isAdmin = await AuthService.isAdmin();
      let branchId: string | undefined;
      
      if (!isAdmin) {
        const userBranchId = await AuthService.getUserBranchId();
        branchId = userBranchId ?? undefined;
        
        if (!branchId) {
          return { error: 'User not associated with a branch' };
        }
      }
      
      // Build query
      let query = supabase
        .from('leaves')
        .select('*, employees(full_name, employee_code, branch_id)')
        .gte('start_date', todayStr)
        .lte('start_date', endDateStr)
        .order('start_date');
      
      if (branchId) {
        query = query.eq('employees.branch_id', branchId);
      }
      
      // Execute query
      const { data, error } = await query;
      
      if (error) {
        return { error: error.message };
      }
      
      // Convert to typed Leave objects
      const typedLeaves = data?.map(leave => this.convertDbLeaveToTyped(leave)) || [];
      
      return { data: typedLeaves };
    } catch (error: any) {
      return { error: error.message || 'Failed to get upcoming leaves' };
    }
  },
  
  // Get recent leaves
  async getRecentLeaves(limit: number = 5): Promise<ApiResponse<Leave[]>> {
    try {
      const supabase = createClient();
      
      // Check user permissions
      const isAdmin = await AuthService.isAdmin();
      
      // Build query
      let query = supabase
        .from('leaves')
        .select('*, employees(full_name, employee_code, branch_id)')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      // If not admin, filter by user's branch
      if (!isAdmin) {
        const branchId = await AuthService.getUserBranchId();
        if (branchId) {
          query = query.eq('employees.branch_id', branchId);
        } else {
          return { error: 'User not associated with a branch' };
        }
      }
      
      // Execute query
      const { data, error } = await query;
      
      if (error) {
        return { error: error.message };
      }
      
      // Convert to typed Leave objects and format for dashboard
      const typedLeaves = data?.map(leave => {
        const typedLeave = this.convertDbLeaveToTyped(leave);
        return {
          ...typedLeave
        };
      }) || [];
      return { data: typedLeaves };
    } catch (error: any) {
      return { error: error.message || 'Failed to get recent leaves' };
    }
  },
  
  // Get leaves for current month
  async getLeavesThisMonth(branchId?: string): Promise<ApiResponse<Leave[]>> {
    try {
      const supabase = createClient();
      
      // Get current month date range
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const firstDayStr = firstDay.toISOString().split('T')[0];
      const lastDayStr = lastDay.toISOString().split('T')[0];
      
      // Check user permissions
      const isAdmin = await AuthService.isAdmin();
      if (!isAdmin && !branchId) {
        const userBranchId = await AuthService.getUserBranchId();
        branchId = userBranchId ?? undefined;
      }
      
      // Build the query
      let query = supabase
        .from('leaves')
        .select('*, employees(*, branches(*))')
        .or(`and(start_date.gte.${firstDayStr},start_date.lte.${lastDayStr}),and(end_date.gte.${firstDayStr},end_date.lte.${lastDayStr}),and(start_date.lte.${firstDayStr},end_date.gte.${lastDayStr})`);
      
      if (branchId) {
        query = query.eq('employees.branch_id', branchId);
      }
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        return { error: error.message };
      }
      
      // Convert to typed Leave objects
      const typedLeaves = data?.map(leave => this.convertDbLeaveToTyped(leave)) || [];
      
      return { data: typedLeaves };
    } catch (error: any) {
      return { error: error.message || 'Failed to get leaves for this month' };
    }
  },
  
  // Get current leave year
  async getCurrentLeaveYear(): Promise<ApiResponse<{id: string, start_date: string, end_date: string}>> {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('leave_years')
        .select('id, start_date, end_date')
        .eq('is_current', true)
        .single();
      
      if (error) {
        return { error: error.message };
      }
      
      return { data };
    } catch (error: any) {
      return { error: error.message || 'Failed to get current leave year' };
    }
  },
  
  // Get remaining annual leave days for an employee
  async getRemainingLeaveDays(employeeId: string, leaveYearId?: string): Promise<ApiResponse<{daysTaken: number, daysRemaining: number}>> {
    try {
      // First, check if we need to reset leave balances (on fiscal year start date)
      // Get current leave year if not provided
      let yearId = leaveYearId;
      if (!yearId) {
        const supabase = createClient();
        const { data: leaveYear, error: yearError } = await supabase
          .from('leave_years')
          .select('id')
          .eq('is_current', true)
          .single();
          
        if (yearError || !leaveYear) {
          return { error: 'No active leave year found' };
        }
        
        yearId = leaveYear.id;
      }
      
      // Get all annual leave for this employee in the current year
      const { data: leaves, error: leavesError } = await supabase
        .from('leaves')
        .select('duration')
        .eq('employee_id', employeeId)
        .eq('leave_type', 'Annual')
        .eq('leave_year_id', yearId);
      
      if (leavesError) {
        return { error: leavesError.message };
      }
      
      // Calculate total days taken
      const daysTaken = leaves ? leaves.reduce((sum, leave) => sum + leave.duration, 0) : 0;
      
      // Maximum annual leave days is 28
      const daysRemaining = 28 - daysTaken;
      
      return { 
        data: {
          daysTaken,
          daysRemaining // Allow negative values to show when employee has taken more than allowed
        }
      };
    } catch (error: any) {
      return { error: error.message || 'Failed to get remaining leave days' };
    },
  // Archive leaves from previous year (admin only)
  async archivePreviousYearLeaves(): Promise<ApiResponse<{ archived: number }>> {
    const supabase = createClient();
    
    // Only admins can archive leaves
    const isAdmin = await AuthService.isAdmin();
    if (!isAdmin) {
      return { error: 'Only administrators can archive leave records' };
    }
    
    // Get previous leave year
    const { data: previousYear, error: yearError } = await supabase
      .from('leave_years')
      .select('id')
      .eq('is_current', false)
      .order('end_date', { ascending: false })
      .limit(1)
      .single();
    
    if (yearError || !previousYear) {
      return { error: 'No previous leave year found' };
    }
    
    // Get leaves from previous year
    const { data: leaves, error: leavesError } = await supabase
      .from('leaves')
      .select('*')
      .eq('leave_year_id', previousYear.id);
    
    if (leavesError) {
      return { error: leavesError.message };
    }
    
    if (!leaves.length) {
      return { data: { archived: 0 } };
    }
    
    // Insert leaves into archived_leaves
    const { error: archiveError } = await supabase
      .from('archived_leaves')
      .insert(leaves.map(leave => ({
        ...leave,
        id: undefined // Let the database generate a new ID
      })));
    
    if (archiveError) {
      return { error: archiveError.message };
    }
    
    // Delete leaves from leaves table
    const { error: deleteError } = await supabase
      .from('leaves')
      .delete()
      .eq('leave_year_id', previousYear.id);
    
    if (deleteError) {
      return { error: deleteError.message };
    }
    
    // Calculate new leave year dates (typically April 1 to March 31 of next year)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const newStartDate = new Date(currentYear, 3, 1); // April 1st of current year
    const newEndDate = new Date(currentYear + 1, 2, 31); // March 31st of next year
    
    // Format dates for insert
    const newStartDateStr = newStartDate.toISOString().split('T')[0];
    const newEndDateStr = newEndDate.toISOString().split('T')[0];
    
    // Create new leave year
    const { data, error } = await supabase
      .from('leave_years')
      .insert({
        start_date: newStartDateStr,
        end_date: newEndDateStr,
        is_current: true
      })
      .select()
      .single();
    
    if (error) {
      return { error: error.message };
    }
    
    return { data: { archived: leaves.length } };
  },

  // Helper function to update an employee's days taken and days remaining based on their leaves
  async updateEmployeeLeaveDays(employeeId: string, leaveYearId: string): Promise<void> {
    console.log(`Updating leave days for employee ${employeeId} in year ${leaveYearId}...`);
    try {
      const supabase = createClient();
      
      // First, get the employee's current days_remaining from import (if any)
      // Explicitly type the expected return or error
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('days_remaining, days_taken')
        .eq('id', employeeId)
        .single<{
          days_remaining: number | null;
          days_taken: number | null;
        }>();
      
      // Add robust check for error or missing employee data
      if (employeeError || !employee) {
        console.error('Error fetching employee data or employee not found:', employeeError?.message || 'Employee not found');
        return;
      }
      
      // Get all annual leaves for this employee in the specified leave year
      const { data: leaves, error: leavesError } = await supabase
        .from('leaves')
        .select('duration')
        .eq('employee_id', employeeId)
        .eq('leave_type', 'Annual')
        .eq('leave_year_id', leaveYearId);
      
      if (leavesError) {
        console.error('Error fetching leaves for employee:', leavesError.message);
        return;
      }
      
      // Calculate total days taken from leaves
      const leaveDaysTaken = leaves ? leaves.reduce((sum, leave) => sum + leave.duration, 0) : 0;
      console.log(`Employee ${employeeId} has taken ${leaveDaysTaken} days of annual leave this year.`);
      
      // Always update the employee's leave days, whether they were imported or not
      // This ensures consistent tracking across the application
      // Simpler calculation that's more reliable
      // Standard annual leave allowance is 28 days
      const totalDaysTaken = leaveDaysTaken;
      const daysRemaining = 28 - totalDaysTaken; // Allow negative values to show when employee has taken more than allowed
      
      console.log('Employee leave calculation:', {
        employeeId,
        leaveDaysTaken,
        totalDaysTaken,
        daysRemaining
      });
      
      // Update the employee record with the calculated values
      // Explicitly cast the update object to Partial<Employee>
      const { error: updateError } = await supabase
        .from('employees')
        .update({
          days_taken: totalDaysTaken,
          days_remaining: daysRemaining
        } as Partial<Employee>)
        .eq('id', employeeId);
      
      if (updateError) {
        console.error('Error updating employee leave days:', updateError.message);
      }
    } catch (error: any) {
      console.error('Error in updateEmployeeLeaveDays:', error.message);
    }
  },

  // Set remaining days for an employee
  async setRemainingDays(employeeId: string, leaveYearId: string, remainingDays: number): Promise<ApiResponse<void>> {
    try {
      const supabase = createClient();
      
      // Update the employee record with the specified remaining days
      const daysTaken = Math.max(0, 28 - remainingDays);
      
      // Explicitly cast the update object to Partial<Employee>
      const { error: updateError } = await supabase
        .from('employees')
        .update({
          days_taken: daysTaken,
          days_remaining: remainingDays
        } as Partial<Employee>)
        .eq('id', employeeId);
      
      if (updateError) {
        return { error: updateError.message };
      }
      
      return { data: undefined };
    } catch (error: any) {
      return { error: error.message || 'Failed to set remaining days' };
        .rpc('execute_sql', {
          query_text: 'SELECT * FROM settings LIMIT 1'
        });
      
      if (error) {
        console.error('Error fetching settings:', error);
        return null;
      return null;
    } catch (error: any) {
      console.error('Error in checkAndResetLeaveBalances:', error);
      return null;
    }
  },
  
  /**
   * Reset leave balances for all active employees
   * @param defaultLeaveAllocation - The default leave allocation from settings
   * @returns A success message or error
   */
  async resetAllLeaveBalances(defaultLeaveAllocation: number = 28): Promise<ApiResponse<{message: string, resetCount: number}>> {
    try {
      const supabase = createClient();
      
      // Get all active employees
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id')
        .eq('is_active', true);

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        return {
          error: 'Failed to fetch employees: ' + employeesError.message
        };
      }

      if (!employees || employees.length === 0) {
        return {
          error: 'No active employees found'
        };
      }

      // Reset leave balances for all active employees
      const { error: updateError } = await supabase
        .from('employees')
        .update({
          days_taken: 0,
          days_remaining: defaultLeaveAllocation,
          updated_at: new Date().toISOString()
        } as Partial<Employee>)
        .eq('is_active', true);

      if (updateError) {
        console.error('Error resetting leave balances:', updateError);
        return {
          error: 'Failed to reset leave balances: ' + updateError.message
        };
      }

      // Log the action
      console.log('ANNUAL_LEAVE_RESET_AUTOMATIC', {
        description: `Annual leave balances automatically reset for ${employees.length} employees`,
        timestamp: new Date().toISOString()
      });

      return {
        data: {
          message: `Successfully reset leave balances for ${employees.length} employees`,
          resetCount: employees.length
        }
      };
    } catch (error: any) {
      console.error('Error in resetAllLeaveBalances:', error);
      return {
        error: 'An unexpected error occurred while resetting leave balances: ' + error.message
    }
    
    // Log the action
    await supabase
      .from('admin_logs')
      .insert({
        action: 'reset_leave_balances',
        performed_by: userId,
        details: `Reset ${resetCount} employee leave balances`,
        timestamp: new Date().toISOString()
      });
    
    return { 
      data: {
        message: `Successfully reset leave balances for ${resetCount} employees`,
        resetCount
      }
    };
  } catch (error: any) {
    return { error: error.message || 'Failed to reset leave balances' };
  }
}
