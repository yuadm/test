// Types for Annual Leave Management System

// User types
export interface User {
  id: string;
  email: string;
  role: UserRole;
  branch_id: string | null;
  branch?: Branch;
  created_at?: string;
  updated_at?: string;
}

// Profile types
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export type UserRole = 'admin' | 'user';

// Branch types
export interface Branch {
  id: string;
  name: string;
  location?: string;
  created_at: string;
}

// Employee types
export interface Employee {
  id: string;
  full_name: string;
  employee_code: string;
  job_title?: string | null;
  branch_id: string;
  created_at: string;
  branch?: Branch | null; // For joined data
  is_active?: boolean; // Whether the employee is active
  days_taken?: number; // Days of annual leave taken in current year
  days_remaining?: number; // Days of annual leave remaining in current year
}

// Leave year types
export interface LeaveYear {
  id: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
}

// Leave types
export type LeaveType = 'Annual' | 'Sick' | 'Unpaid' | 'Working';

export interface Leave {
  id: string;
  employee_id: string;
  leave_year_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  duration: number;
  notes?: string;
  created_by: string;
  created_at: string;
  status?: 'Approved' | 'Pending' | 'Rejected'; // Leave approval status
  employee?: Employee; // For joined data
  employees?: {
    full_name: string;
    employee_code: string;
    branch_id: string;
  }; // For Supabase joined data
}

// Dashboard types
export interface DashboardSummary {
  totalEmployees: number;
  leaveToday: number;
  leaveThisMonth: number;
  sickLeaveCount: number;
  leaveSummary: LeaveSummary;
  recentLeaves: {
    id: string;
    employeeId: string;
    employeeName: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    duration: number;
  }[];
  upcomingLeave: {
    id: string;
    employeeId: string;
    employeeName: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    duration: number;
  }[];
}

export interface LeaveSummary {
  annual: number;
  sick: number;
  unpaid: number;
  working: number;
}

export interface BranchSummary {
  id: string;
  name: string;
  location?: string;
  employeeCount: number;
  leaveSummary: LeaveSummary;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  warning?: string;
}

// Form state types
export interface EmployeeFormData {
  full_name: string;
  employee_code: string;
  job_title?: string;
  branch_id: string;
  is_active?: boolean;
}

export interface LeaveFormData {
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  duration: number;
  notes?: string;
}

export interface UserFormData {
  email: string;
  password: string;
  role: UserRole;
  branch_id?: string | null;
}

// Filter types
export interface LeaveFilter {
  branch_id?: string;
  employee_id?: string;
  leave_type?: LeaveType;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface EmployeeFilter {
  branch_id?: string;
  search?: string;
  is_active?: boolean;
}

// Settings types
export interface Settings {
  id: string;
  company_name: string;
  fiscal_year_start: string; // Format: MM-DD
  default_leave_allocation: string;
  sick_leave_allocation: string;
  email_notifications: string;
  created_at: string;
  updated_at: string;
}

// Import/Export types
export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}
