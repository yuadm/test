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
      branches: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          role: string
          branch_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role: string
          branch_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          branch_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_branch_id_fkey"
            columns: ["branch_id"]
            referencedRelation: "branches"
            referencedColumns: ["id"]
          }
        ]
      }
      employees: {
        Row: {
          id: string
          full_name: string
          employee_code: string
          job_title: string | null
          branch_id: string
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          employee_code: string
          job_title?: string | null
          branch_id: string
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          employee_code?: string
          job_title?: string | null
          branch_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            referencedRelation: "branches"
            referencedColumns: ["id"]
          }
        ]
      }
      leave_years: {
        Row: {
          id: string
          start_date: string
          end_date: string
          is_current: boolean
          created_at: string
        }
        Insert: {
          id?: string
          start_date: string
          end_date: string
          is_current?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          start_date?: string
          end_date?: string
          is_current?: boolean
          created_at?: string
        }
        Relationships: []
      }
      leaves: {
        Row: {
          id: string
          employee_id: string
          leave_year_id: string
          leave_type: string
          start_date: string
          end_date: string
          duration: number
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          leave_year_id: string
          leave_type: string
          start_date: string
          end_date: string
          duration: number
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          leave_year_id?: string
          leave_type?: string
          start_date?: string
          end_date?: string
          duration?: number
          notes?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaves_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_leave_year_id_fkey"
            columns: ["leave_year_id"]
            referencedRelation: "leave_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      archived_leaves: {
        Row: {
          id: string
          employee_id: string
          leave_year_id: string
          leave_type: string
          start_date: string
          end_date: string
          duration: number
          notes: string | null
          created_by: string
          created_at: string
          archived_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          leave_year_id: string
          leave_type: string
          start_date: string
          end_date: string
          duration: number
          notes?: string | null
          created_by: string
          created_at?: string
          archived_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          leave_year_id?: string
          leave_type?: string
          start_date?: string
          end_date?: string
          duration?: number
          notes?: string | null
          created_by?: string
          created_at?: string
          archived_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "archived_leaves_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archived_leaves_leave_year_id_fkey"
            columns: ["leave_year_id"]
            referencedRelation: "leave_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archived_leaves_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      document_tracker: {
        Row: {
          id: string
          employee_id: string
          status: string
          country: string
          passport_expiry: string | null
          brp_expiry: string | null
          right_to_work_expiry: string | null
          other_document_type: string | null
          other_document_expiry: string | null
          notes: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          status: string
          country?: string
          passport_expiry?: string | null
          brp_expiry?: string | null
          right_to_work_expiry?: string | null
          other_document_type?: string | null
          other_document_expiry?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          status?: string
          country?: string
          passport_expiry?: string | null
          brp_expiry?: string | null
          right_to_work_expiry?: string | null
          other_document_type?: string | null
          other_document_expiry?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_tracker_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_total_leave_days: {
        Args: {
          p_employee_id: string
          p_leave_year_id: string
          p_exclude_leave_id?: string
        }
        Returns: number
      }
      check_leave_in_current_year: {
        Args: {
          p_start_date: string
          p_end_date: string
        }
        Returns: boolean
      }
      check_leave_overlap: {
        Args: {
          p_employee_id: string
          p_start_date: string
          p_end_date: string
          p_leave_id?: string
        }
        Returns: boolean
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
