export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaves_leave_year_id_fkey"
            columns: ["leave_year_id"]
            isOneToOne: false
            referencedRelation: "leave_years"
            referencedColumns: ["id"]
          },
        ]
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
          role: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string | null
          email: string
          id: string
          inactive?: boolean | null
          role: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          inactive?: boolean | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      execute_sql: {
        Args: { sql_query: string }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
