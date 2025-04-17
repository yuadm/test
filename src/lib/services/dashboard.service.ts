import { createClient } from '@/lib/supabase/client';
import { AuthService } from './auth.service';
import type { ApiResponse, BranchSummary, DashboardSummary, LeaveType, LeaveSummary, Branch } from '@/types';

export const DashboardService = {
  // Get dashboard summary for the current user
  async getDashboardSummary(branchId?: string): Promise<ApiResponse<DashboardSummary>> {
    try {
      const supabase = createClient();
      
      // Check user permissions
      const isAdmin = await AuthService.isAdmin();
      
      // If no branch ID is provided, get the user's branch ID
      if (!branchId) {
        const accessBranchId = await AuthService.ensureBranchAccess();
        if (accessBranchId) {
          branchId = accessBranchId;
        } else if (!isAdmin) {
          return { error: 'User not associated with a branch' };
        }
      }
      
      // Get total employees
      let employeeQuery = supabase.from('employees').select('id', { count: 'exact' });
      if (branchId) {
        employeeQuery = employeeQuery.eq('branch_id', branchId);
      }
      const { count: totalEmployees, error: employeeError } = await employeeQuery;
      
      if (employeeError) {
        return { error: employeeError.message };
      }
      
      // Get today's date
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Get month start and end
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const monthStartStr = monthStart.toISOString().split('T')[0];
      const monthEndStr = monthEnd.toISOString().split('T')[0];
      
      // Get employees on leave today
      let leaveTodayQuery = supabase
        .from('leaves')
        .select('id, employees!inner(branch_id)', { count: 'exact' })
        .lte('start_date', todayStr)
        .gte('end_date', todayStr);
      
      if (branchId) {
        leaveTodayQuery = leaveTodayQuery.eq('employees.branch_id', branchId);
      }
      
      const { count: leaveToday, error: leaveTodayError } = await leaveTodayQuery;
      
      if (leaveTodayError) {
        return { error: leaveTodayError.message };
      }
      
      // Get total leave days this month
      let leaveThisMonthQuery = supabase
        .from('leaves')
        .select('duration, employees!inner(branch_id)')
        .or(`and(start_date.gte.${monthStartStr},start_date.lte.${monthEndStr}),and(end_date.gte.${monthStartStr},end_date.lte.${monthEndStr}),and(start_date.lte.${monthStartStr},end_date.gte.${monthEndStr})`);
      
      if (branchId) {
        leaveThisMonthQuery = leaveThisMonthQuery.eq('employees.branch_id', branchId);
      }
      
      const { data: leaveThisMonthData, error: leaveThisMonthError } = await leaveThisMonthQuery;
      
      if (leaveThisMonthError) {
        return { error: leaveThisMonthError.message };
      }
      
      const leaveThisMonth = leaveThisMonthData?.reduce((total, leave) => total + leave.duration, 0) || 0;
      
      // Get sick leave count
      let sickLeaveQuery = supabase
        .from('leaves')
        .select('duration, employees!inner(branch_id)')
        .eq('leave_type', 'Sick');
      
      if (branchId) {
        sickLeaveQuery = sickLeaveQuery.eq('employees.branch_id', branchId);
      }
      
      const { data: sickLeaveData, error: sickLeaveError } = await sickLeaveQuery;
      
      if (sickLeaveError) {
        return { error: sickLeaveError.message };
      }
      
      const sickLeaveCount = sickLeaveData?.reduce((total, leave) => total + leave.duration, 0) || 0;
      
      // Get leave summary by type
      let leaveSummaryQuery = supabase
        .from('leaves')
        .select('leave_type, duration, employees!inner(branch_id)');
      
      if (branchId) {
        leaveSummaryQuery = leaveSummaryQuery.eq('employees.branch_id', branchId);
      }
      
      const { data: leaveSummaryData, error: leaveSummaryError } = await leaveSummaryQuery;
      
      if (leaveSummaryError) {
        return { error: leaveSummaryError.message };
      }
      
      // Create leave summary by type
      const leaveSummary: LeaveSummary = {
        annual: 0,
        sick: 0,
        unpaid: 0,
        working: 0
      };
      
      leaveSummaryData?.forEach(leave => {
        const leaveType = leave.leave_type.toLowerCase() as Lowercase<LeaveType>;
        if (leaveType === 'annual') {
          leaveSummary.annual += leave.duration;
        } else if (leaveType === 'sick') {
          leaveSummary.sick += leave.duration;
        } else if (leaveType === 'unpaid') {
          leaveSummary.unpaid += leave.duration;
        } else if (leaveType === 'working') {
          leaveSummary.working += leave.duration;
        }
      });
      
      // Get recent leave records
      let recentLeavesQuery = supabase
        .from('leaves')
        .select(`
          id,
          leave_type,
          start_date,
          end_date,
          duration,
          employees!inner(id, full_name, branch_id)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (branchId) {
        recentLeavesQuery = recentLeavesQuery.eq('employees.branch_id', branchId);
      }
      
      const { data: recentLeavesData, error: recentLeavesError } = await recentLeavesQuery;
      
      if (recentLeavesError) {
        return { error: recentLeavesError.message };
      }
      
      // Format recent leaves
      const recentLeaves = recentLeavesData?.map(leave => ({
        id: leave.id,
        employeeId: leave.employees.id,
        employeeName: leave.employees.full_name,
        leaveType: leave.leave_type as LeaveType,
        startDate: leave.start_date,
        endDate: leave.end_date,
        duration: leave.duration
      })) || [];
      
      // Get upcoming leave
      let upcomingLeaveQuery = supabase
        .from('leaves')
        .select(`
          id,
          leave_type,
          start_date,
          end_date,
          duration,
          employees!inner(id, full_name, branch_id)
        `)
        .gt('start_date', todayStr)
        .order('start_date', { ascending: true })
        .limit(5);
      
      if (branchId) {
        upcomingLeaveQuery = upcomingLeaveQuery.eq('employees.branch_id', branchId);
      }
      
      const { data: upcomingLeaveData, error: upcomingLeaveError } = await upcomingLeaveQuery;
      
      if (upcomingLeaveError) {
        return { error: upcomingLeaveError.message };
      }
      
      // Format upcoming leave
      const upcomingLeave = upcomingLeaveData?.map(leave => ({
        id: leave.id,
        employeeId: leave.employees.id,
        employeeName: leave.employees.full_name,
        leaveType: leave.leave_type as LeaveType,
        startDate: leave.start_date,
        endDate: leave.end_date,
        duration: leave.duration
      })) || [];
      
      return {
        data: {
          totalEmployees: totalEmployees || 0,
          leaveToday: leaveToday || 0,
          leaveThisMonth,
          sickLeaveCount,
          recentLeaves,
          upcomingLeave,
          leaveSummary
        }
      };
    } catch (error: any) {
      return { error: error.message || 'Failed to get dashboard summary' };
    }
  },

  // Get branch summary for a specific branch
  async getBranchSummary(branchId?: string): Promise<ApiResponse<BranchSummary>> {
    try {
      const supabase = createClient();
      
      // If no branch ID is provided, get the user's branch ID
      if (!branchId) {
        const accessBranchId = await AuthService.ensureBranchAccess();
        if (accessBranchId) {
          branchId = accessBranchId;
        } else {
          return { error: 'Branch ID is required' };
        }
      }
      
      // Get branch details
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .eq('id', branchId)
        .single();
      
      if (branchError || !branch) {
        return { error: branchError?.message || 'Branch not found' };
      }
      
      // Get employee count
      const { count: employeeCount, error: employeeError } = await supabase
        .from('employees')
        .select('id', { count: 'exact' })
        .eq('branch_id', branchId);
      
      if (employeeError) {
        return { error: employeeError.message };
      }
      
      // Get leave summary by type
      const { data: leaveSummaryData, error: leaveSummaryError } = await supabase
        .from('leaves')
        .select('leave_type, duration, employees!inner(branch_id)')
        .eq('employees.branch_id', branchId);
      
      if (leaveSummaryError) {
        return { error: leaveSummaryError.message };
      }
      
      // Create leave summary by type
      const leaveSummary: LeaveSummary = {
        annual: 0,
        sick: 0,
        unpaid: 0,
        working: 0
      };
      
      leaveSummaryData?.forEach(leave => {
        const leaveType = leave.leave_type.toLowerCase() as Lowercase<LeaveType>;
        if (leaveType === 'annual') {
          leaveSummary.annual += leave.duration;
        } else if (leaveType === 'sick') {
          leaveSummary.sick += leave.duration;
        } else if (leaveType === 'unpaid') {
          leaveSummary.unpaid += leave.duration;
        } else if (leaveType === 'working') {
          leaveSummary.working += leave.duration;
        }
      });
      
      return {
        data: {
          id: branch.id,
          name: branch.name,
          employeeCount: employeeCount || 0,
          leaveSummary
        }
      };
    } catch (error: any) {
      return { error: error.message || 'Failed to get branch summary' };
    }
  },
  
  // Get summaries for all branches (admin only)
  async getBranchSummaries(): Promise<ApiResponse<any[]>> {
    try {
      const supabase = createClient();
      
      // Check if user is admin
      const isAdmin = await AuthService.isAdmin();
      if (!isAdmin) {
        return { error: 'Unauthorized: Admin access required' };
      }
      
      // Create a default response with empty data to avoid errors
      const defaultResponse = [
        {
          id: '1',
          name: 'All Branches',
          employee_count: 0,
          leave_count: 0,
          leave_days: 0
        }
      ];
      
      try {
        // Get all branches
        const { data: branches, error: branchError } = await supabase.from('branches').select('*');
        
        console.log('Branches data:', branches);
        
        if (branchError || !branches || branches.length === 0) {
          console.error('Error fetching branches or no branches found:', branchError);
          return { data: defaultResponse };
        }
        
        // Get all employees in a single query
        const { data: allEmployees, error: employeeError } = await supabase
          .from('employees')
          .select('id, branch_id');
        
        console.log('Employees data:', allEmployees);
        
        if (employeeError) {
          console.error('Error fetching employees:', employeeError);
          return { data: defaultResponse };
        }
        
        // Get all leaves in a single query
        const { data: allLeaves, error: leaveError } = await supabase
          .from('leaves')
          .select('leave_type, duration, employee_id');
        
        console.log('Leaves data:', allLeaves);
        
        if (leaveError) {
          console.error('Error fetching leaves:', leaveError);
          // Continue with employee data only
        }
        
        console.log('Starting to create branch summaries...');
        
        // Create branch summaries
        const branchSummaries = branches.map(branch => {
          // Count employees for this branch
          const branchEmployees = allEmployees?.filter(emp => 
            emp.branch_id === branch.id
          ) || [];
          
          console.log(`Branch ${branch.name} has ${branchEmployees.length} employees`);
          
          // Get employee IDs for this branch
          const employeeIds = branchEmployees.map(emp => emp.id);
          console.log(`Branch ${branch.name} employee IDs:`, employeeIds);
          
          // Initialize leave summary
          const leaveSummary: LeaveSummary = {
            annual: 0,
            sick: 0,
            unpaid: 0,
            working: 0
          };
          
          // Calculate leave summary if we have leave data
          if (allLeaves) {
            // Filter leaves for this branch's employees
            const branchLeaves = allLeaves.filter(leave => 
              employeeIds.includes(leave.employee_id)
            );
            
            console.log(`Branch ${branch.name} has ${branchLeaves.length} leave records`);
            
            // Summarize leave data
            branchLeaves.forEach(leave => {
              const leaveType = leave.leave_type.toLowerCase() as Lowercase<LeaveType>;
              if (leaveType === 'annual') {
                leaveSummary.annual += leave.duration;
              } else if (leaveType === 'sick') {
                leaveSummary.sick += leave.duration;
              } else if (leaveType === 'unpaid') {
                leaveSummary.unpaid += leave.duration;
              } else if (leaveType === 'working') {
                leaveSummary.working += leave.duration;
              }
            });
          }
          
          return {
            id: branch.id,
            name: branch.name,
            employee_count: branchEmployees.length,
            leave_count: leaveSummary.annual,
            leave_days: leaveSummary.sick,
            employeeCount: branchEmployees.length,
            leaveSummary: leaveSummary
          };
        });
        
        console.log('Final branch summaries:', branchSummaries);
        return { data: branchSummaries.length > 0 ? (branchSummaries as any) : defaultResponse };
      } catch (innerError: any) {
        console.error('Error processing branch data:', innerError);
        return { data: defaultResponse };
      }
    } catch (error: any) {
      console.error('Unexpected error in getBranchSummaries:', error);
      return { 
        data: [{
          id: '1',
          name: 'All Branches',
          employee_count: 0,
          leave_count: 0,
          leave_days: 0
        }] 
      };
    }
  }
};
