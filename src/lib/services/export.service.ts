import { Employee, Leave, LeaveFilter, EmployeeFilter } from '@/types';
import { EmployeeService } from './employee.service';
import { LeaveService } from './leave.service';
import { AuthService } from './auth.service';
import { BranchService } from './branch.service';
import { createClient } from '@/lib/supabase/client';

export const ExportService = {
  // Helper function to trigger file download
  triggerDownload(content: string, filename: string) {
    // Create a Blob with the content
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    
    // Add the link to the document, click it, and remove it
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  },
  
  // Export employees to CSV
  async exportEmployeesToCSV(filter?: EmployeeFilter): Promise<void> {
    try {
      // Get employees data
      const { data: employees, error } = await EmployeeService.getEmployees(filter);
      
      if (error || !employees) {
        throw new Error(error || 'Failed to fetch employees');
      }
      
      // Define CSV headers
      const headers = [
        'Full Name', 
        'Employee Code', 
        'Job Title', 
        'Branch',
        'Days Taken',
        'Days Remaining'
      ];
      
      // Get the current leave year
      const { data: leaveYear } = await LeaveService.getCurrentLeaveYear();
      
      // Map employees to CSV rows
      const rows = await Promise.all(employees.map(async employee => {
        // Get days taken and remaining for this employee
        const { data: leaveData } = await LeaveService.getRemainingLeaveDays(
          employee.id, 
          leaveYear?.id
        );
        
        return [
          `"${employee.full_name}"`,
          `"${employee.employee_code}"`,
          `"${employee.job_title || ''}"`,
          `"${employee.branch?.name || ''}"`,
          leaveData?.daysTaken || 0,
          leaveData?.daysRemaining || 28
        ];
      }));
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `employees_export_${date}.csv`;
      
      // Trigger download
      this.triggerDownload(csvContent, filename);
    } catch (error) {
      console.error('Error exporting employees to CSV:', error);
      throw new Error('Failed to export employees to CSV');
    }
  },
  
  // Export employees to Excel format (CSV with Excel compatibility)
  async exportEmployeesToExcel(filter?: EmployeeFilter): Promise<void> {
    try {
      // Get employees data
      const { data: employees, error } = await EmployeeService.getEmployees(filter);
      
      if (error || !employees) {
        throw new Error(error || 'Failed to fetch employees');
      }
      
      // Define CSV headers
      const headers = [
        'Full Name', 
        'Employee Code', 
        'Job Title', 
        'Branch',
        'Days Taken',
        'Days Remaining'
      ];
      
      // Get the current leave year
      const { data: leaveYear } = await LeaveService.getCurrentLeaveYear();
      
      // Map employees to CSV rows
      const rows = await Promise.all(employees.map(async employee => {
        // Get days taken and remaining for this employee
        const { data: leaveData } = await LeaveService.getRemainingLeaveDays(
          employee.id, 
          leaveYear?.id
        );
        
        return [
          `"${employee.full_name}"`,
          `"${employee.employee_code}"`,
          `"${employee.job_title || ''}"`,
          `"${employee.branch?.name || ''}"`,
          leaveData?.daysTaken || 0,
          leaveData?.daysRemaining || 28
        ];
      }));
      
      // Combine headers and rows with BOM character for Excel
      const csvContent = '\ufeff' + [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `employees_export_${date}.xlsx`;
      
      // Trigger download
      this.triggerDownload(csvContent, filename);
    } catch (error) {
      console.error('Error exporting employees to Excel:', error);
      throw new Error('Failed to export employees to Excel');
    }
  },
  
  // Export leaves to CSV
  async exportLeavesToCSV(filter?: LeaveFilter): Promise<string> {
    try {
      // Get leaves data
      const { data: leaves, error } = await LeaveService.getLeaves(filter);
      
      if (error || !leaves) {
        throw new Error(error || 'Failed to fetch leaves');
      }
      
      // Helper function to format date
      const formatDate = (dateString: string): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      };
      
      // Get all users to resolve creator names
      const supabase = createClient();
      const { data: users } = await supabase.from('users').select('id, email');
      const userMap = new Map();
      if (users) {
        users.forEach((user: { id: string, email: string }) => userMap.set(user.id, user.email));
      }
      
      // Define CSV headers
      const headers = [
        'Employee Name', 
        'Employee Code', 
        'Job Title',
        'Branch', 
        'Leave Type', 
        'Start Date', 
        'End Date', 
        'Duration (Days)',
        'Days Remaining', 
        'Created By',
        'Notes'
      ];
      
      // Get the current leave year
      const { data: leaveYear } = await LeaveService.getCurrentLeaveYear();
      
      // Get remaining days for each employee
      const remainingDaysMap: Record<string, number> = {};
      const employeeIds = new Set(leaves.map(leave => leave.employee_id));
      
      for (const employeeId of employeeIds) {
        const { data: leaveData } = await LeaveService.getRemainingLeaveDays(employeeId, leaveYear?.id);
        if (leaveData) {
          remainingDaysMap[employeeId] = leaveData.daysRemaining;
        }
      }
      
      // Map leaves to CSV rows
      const rows = leaves.map(leave => {
        // Get employee name and code from either employee or employees property
        const employeeName = leave.employee?.full_name || leave.employees?.full_name || '';
        const employeeCode = leave.employee?.employee_code || leave.employees?.employee_code || '';
        const jobTitle = leave.employee?.job_title || (leave.employees as any)?.job_title || '';
        
        // Get branch name
        let branchName = '';
        if (leave.employee?.branch?.name) {
          branchName = leave.employee.branch.name;
        } else if (leave.employees && 'branch_id' in leave.employees) {
          // Need to look up branch name from branch_id
          branchName = ''; // Will be filled in later if possible
        }
        
        // Get remaining days
        const remainingDays = leave.leave_type === 'Annual' ? 
          (remainingDaysMap[leave.employee_id] !== undefined ? remainingDaysMap[leave.employee_id] : 28) : 'N/A';
        
        // Get creator name instead of UUID
        const createdBy = userMap.get(leave.created_by) || leave.created_by || '';
        
        return [
          `"${employeeName}"`,
          `"${employeeCode}"`,
          `"${jobTitle}"`,
          `"${branchName}"`,
          `"${leave.leave_type}"`,
          `"${formatDate(leave.start_date)}"`,
          `"${formatDate(leave.end_date)}"`,
          leave.duration,
          remainingDays,
          `"${createdBy}"`,
          `"${leave.notes || ''}"`,
        ];
      });
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `leaves_export_${date}.csv`;
      
      // Return the CSV content
      return csvContent;
    } catch (error) {
      console.error('Error exporting leaves to CSV:', error);
      throw new Error('Failed to export leaves to CSV');
    }
  },
  
  // Export leaves to Excel format (CSV with Excel compatibility)
  async exportLeavesToExcel(filter?: LeaveFilter): Promise<string> {
    try {
      // Get leaves data
      const { data: leaves, error } = await LeaveService.getLeaves(filter);
      
      if (error || !leaves) {
        throw new Error(error || 'Failed to fetch leaves');
      }
      
      // Helper function to format date
      const formatDate = (dateString: string): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      };
      
      // Get all users to resolve creator names
      const supabase = createClient();
      const { data: users } = await supabase.from('users').select('id, email');
      const userMap = new Map();
      if (users) {
        users.forEach((user: { id: string, email: string }) => userMap.set(user.id, user.email));
      }
      
      // Define CSV headers
      const headers = [
        'Employee Name', 
        'Employee Code', 
        'Job Title',
        'Branch', 
        'Leave Type', 
        'Start Date', 
        'End Date', 
        'Duration (Days)',
        'Days Remaining', 
        'Created By',
        'Notes'
      ];
      
      // Get the current leave year
      const { data: leaveYear } = await LeaveService.getCurrentLeaveYear();
      
      // Get remaining days for each employee
      const remainingDaysMap: Record<string, number> = {};
      const employeeIds = new Set(leaves.map(leave => leave.employee_id));
      
      for (const employeeId of employeeIds) {
        const { data: leaveData } = await LeaveService.getRemainingLeaveDays(employeeId, leaveYear?.id);
        if (leaveData) {
          remainingDaysMap[employeeId] = leaveData.daysRemaining;
        }
      }
      
      // Map leaves to CSV rows
      const rows = leaves.map(leave => {
        // Get employee name and code from either employee or employees property
        const employeeName = leave.employee?.full_name || leave.employees?.full_name || '';
        const employeeCode = leave.employee?.employee_code || leave.employees?.employee_code || '';
        const jobTitle = leave.employee?.job_title || (leave.employees as any)?.job_title || '';
        
        // Get branch name
        let branchName = '';
        if (leave.employee?.branch?.name) {
          branchName = leave.employee.branch.name;
        } else if (leave.employees && 'branch_id' in leave.employees) {
          // Need to look up branch name from branch_id
          branchName = ''; // Will be filled in later if possible
        }
        
        // Get remaining days
        const remainingDays = leave.leave_type === 'Annual' ? 
          (remainingDaysMap[leave.employee_id] !== undefined ? remainingDaysMap[leave.employee_id] : 28) : 'N/A';
        
        // Get creator name instead of UUID
        const createdBy = userMap.get(leave.created_by) || leave.created_by || '';
        
        return [
          `"${employeeName}"`,
          `"${employeeCode}"`,
          `"${jobTitle}"`,
          `"${branchName}"`,
          `"${leave.leave_type}"`,
          `"${formatDate(leave.start_date)}"`,
          `"${formatDate(leave.end_date)}"`,
          leave.duration,
          remainingDays,
          `"${createdBy}"`,
          `"${leave.notes || ''}"`,
        ];
      });
      
      // Combine headers and rows with BOM character for Excel
      const csvContent = '\ufeff' + [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `leaves_export_${date}.xlsx`;
      
      // Return the Excel content
      return csvContent;
    } catch (error) {
      console.error('Error exporting leaves to Excel:', error);
      throw new Error('Failed to export leaves to Excel');
    }
  },
  
  // Generate a report based on filters
  async generateReport(filter: LeaveFilter): Promise<string> {
    // Get leaves data
    const { data: leaves, error } = await LeaveService.getLeaves(filter);
    
    if (error || !leaves) {
      throw new Error(error || 'Failed to fetch leaves');
    }
    
    // Get user info for report header
    const user = await AuthService.getCurrentUser();
    const isAdmin = await AuthService.isAdmin();
    
    // Calculate report summary
    const totalLeaves = leaves.length;
    const totalDays = leaves.reduce((sum, leave) => sum + leave.duration, 0);
    
    // Group by leave type
    const leaveTypeCount: Record<string, { count: number, days: number }> = {};
    leaves.forEach(leave => {
      if (!leaveTypeCount[leave.leave_type]) {
        leaveTypeCount[leave.leave_type] = { count: 0, days: 0 };
      }
      leaveTypeCount[leave.leave_type].count++;
      leaveTypeCount[leave.leave_type].days += leave.duration;
    });
    
    // Group by branch (for admin reports)
    const branchCount: Record<string, { count: number, days: number }> = {};
    if (isAdmin) {
      leaves.forEach(leave => {
        const branchName = leave.employee?.branch?.name || 'Unknown';
        if (!branchCount[branchName]) {
          branchCount[branchName] = { count: 0, days: 0 };
        }
        branchCount[branchName].count++;
        branchCount[branchName].days += leave.duration;
      });
    }
    
    // Format date range for report title
    let dateRange = '';
    if (filter.start_date && filter.end_date) {
      dateRange = `${filter.start_date} to ${filter.end_date}`;
    } else if (filter.start_date) {
      dateRange = `From ${filter.start_date}`;
    } else if (filter.end_date) {
      dateRange = `Until ${filter.end_date}`;
    } else {
      dateRange = 'All dates';
    }
    
    // Build report content
    let report = '';
    
    // Report header
    report += 'ANNUAL LEAVE MANAGEMENT SYSTEM - LEAVE REPORT\n';
    report += '==============================================\n\n';
    report += `Generated by: ${user?.email || 'Unknown'}\n`;
    report += `Date: ${new Date().toISOString().split('T')[0]}\n`;
    report += `Filters: ${dateRange}`;
    
    if (filter.branch_id) {
      const { data: branch } = await EmployeeService.getEmployee(filter.branch_id);
      report += `, Branch: ${branch?.branch?.name || 'Unknown'}`;
    }
    
    if (filter.employee_id) {
      const { data: employee } = await EmployeeService.getEmployee(filter.employee_id);
      report += `, Employee: ${employee?.full_name || 'Unknown'}`;
    }
    
    if (filter.leave_type) {
      report += `, Leave Type: ${filter.leave_type}`;
    }
    
    report += '\n\n';
    
    // Report summary
    report += 'SUMMARY\n';
    report += '-------\n';
    report += `Total Leave Records: ${totalLeaves}\n`;
    report += `Total Leave Days: ${totalDays}\n\n`;
    
    // Leave type breakdown
    report += 'LEAVE TYPE BREAKDOWN\n';
    report += '-------------------\n';
    Object.entries(leaveTypeCount).forEach(([type, data]) => {
      report += `${type}: ${data.count} records (${data.days} days)\n`;
    });
    report += '\n';
    
    // Branch breakdown (admin only)
    if (isAdmin && Object.keys(branchCount).length > 0) {
      report += 'BRANCH BREAKDOWN\n';
      report += '----------------\n';
      Object.entries(branchCount).forEach(([branch, data]) => {
        report += `${branch}: ${data.count} records (${data.days} days)\n`;
      });
      report += '\n';
    }
    
    // Detailed records
    report += 'DETAILED RECORDS\n';
    report += '----------------\n';
    leaves.forEach((leave, index) => {
      report += `${index + 1}. Employee: ${leave.employee?.full_name} (${leave.employee?.employee_code})\n`;
      report += `   Branch: ${leave.employee?.branch?.name}\n`;
      report += `   Leave Type: ${leave.leave_type}\n`;
      report += `   Period: ${leave.start_date} to ${leave.end_date} (${leave.duration} days)\n`;
      if (leave.notes) {
        report += `   Notes: ${leave.notes}\n`;
      }
      report += '\n';
    });
    
    return report;
  },
  
  // Format date to dd/mm/yyyy
  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  },
};
