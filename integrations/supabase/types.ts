
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      archived_leaves: {
        Row: {
          archived_at: string | null
          created_at: string | null
          created_by: string
          duration: number
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          leave_year_id: string
          notes: string | null
          start_date: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          created_by: string
          duration: number
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          leave_year_id: string
          notes?: string | null
          start_date: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          created_by?: string
          duration?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          leave_year_id?: string
          notes?: string | null
          start_date?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      document_tracker: {
        Row: {
          branch: string | null
          brp_expiry: string | null
          check_interval_days: number | null
          country: string | null
          created_at: string | null
          employee_id: string
          employee_name: string
          id: string
          is_sponsored: boolean | null
          last_checked: string | null
          notes: string | null
          other_document_expiry: string | null
          other_document_type: string | null
          passport_expiry: string | null
          right_to_work_expiry: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          branch?: string | null
          brp_expiry?: string | null
          check_interval_days?: number | null
          country?: string | null
          created_at?: string | null
          employee_id: string
          employee_name: string
          id?: string
          is_sponsored?: boolean | null
          last_checked?: string | null
          notes?: string | null
          other_document_expiry?: string | null
          other_document_type?: string | null
          passport_expiry?: string | null
          right_to_work_expiry?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          branch?: string | null
          brp_expiry?: string | null
          check_interval_days?: number | null
          country?: string | null
          created_at?: string | null
          employee_id?: string
          employee_name?: string
          id?: string
          is_sponsored?: boolean | null
          last_checked?: string | null
          notes?: string | null
          other_document_expiry?: string | null
          other_document_type?: string | null
          passport_expiry?: string | null
          right_to_work_expiry?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          branch_id: string | null
          created_at: string | null
          days_remaining: number | null
          days_taken: number | null
          employee_code: string | null
          full_name: string
          id: string
          is_active: boolean | null
          job_title: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          days_remaining?: number | null
          days_taken?: number | null
          employee_code?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          job_title?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          days_remaining?: number | null
          days_taken?: number | null
          employee_code?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          job_title?: string | null
        }
        Relationships: []
      }
      leave_types: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      leave_years: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_current: boolean | null
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_current?: boolean | null
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_current?: boolean | null
          start_date?: string
        }
        Relationships: []
      }
      leaves: {
        Row: {
          created_at: string | null
          created_by: string
          duration: number
          employee_id: string | null
          end_date: string
          id: string
          leave_type: string
          leave_year_id: string | null
          notes: string | null
          start_date: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          duration: number
          employee_id?: string | null
          end_date: string
          id?: string
          leave_type: string
          leave_year_id?: string | null
          notes?: string | null
          start_date: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          duration?: number
          employee_id?: string | null
          end_date?: string
          id?: string
          leave_type?: string
          leave_year_id?: string | null
          notes?: string | null
          start_date?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          company_name: string
          created_at: string | null
          default_leave_allocation: number
          email_notifications: boolean | null
          fiscal_year_start: string
          id: string
          sick_leave_allocation: number
          updated_at: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          default_leave_allocation: number
          email_notifications?: boolean | null
          fiscal_year_start: string
          id?: string
          sick_leave_allocation: number
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          default_leave_allocation?: number
          email_notifications?: boolean | null
          fiscal_year_start?: string
          id?: string
          sick_leave_allocation?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_branches: {
        Row: {
          branch_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          branch_id: string | null
          created_at: string | null
          email: string
          id: string
          inactive: boolean | null
          permissions: Json | null
          role: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          email: string
          id: string
          inactive?: boolean | null
          permissions?: Json | null
          role: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          inactive?: boolean | null
          permissions?: Json | null
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_sql: {
        Args: {
          sql_query: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
