import { createClient } from '@/lib/supabase/client';
import { Employee, EmployeeFilter, EmployeeFormData, ApiResponse } from '@/types';
import { PaginationParams, createPaginatedResponse } from '@/types/pagination';
import { DataCache } from '@/lib/utils/cache';
import { AuthService } from './auth.service';

export const EmployeeService = {
  // Get all employees with optional filtering
  async getEmployees(filter?: EmployeeFilter, pagination?: PaginationParams): Promise<ApiResponse<Employee[]>> {
    try {
      // Generate cache key based on filter and pagination
      const cacheKey = `employees_${JSON.stringify(filter || {})}_${JSON.stringify(pagination || {})}`;
      
      // Check cache first
      const cachedData = DataCache.get(cacheKey);
      if (cachedData) {
        return { data: cachedData };
      }
      
      const supabase = createClient();
      
      // Start with the base query - optimize field selection
      let query = supabase
        .from('employees')
        .select('id, full_name, employee_code, job_title, branch_id, is_active, created_at, branches(id, name, created_at)');
      
      // Check if user is admin
      const isAdmin = await AuthService.isAdmin();
      if (!isAdmin) {
        const branchId = await AuthService.getUserBranchId();
        if (branchId) {
          query = query.eq('branch_id', branchId);
        }
      }
      
      // Apply filters if provided
      if (filter) {
        if (filter.branch_id) {
          query = query.eq('branch_id', filter.branch_id);
        }
        
        if (filter.search) {
          query = query.ilike('full_name', `%${filter.search}%`);
        }
        
        if (filter.is_active !== undefined) {
          query = query.eq('is_active', filter.is_active);
        }
      }
      
      // Apply pagination if provided
      if (pagination) {
        const { page = 1, pageSize = 10 } = pagination;
        const start = (page - 1) * pageSize;
        query = query.range(start, start + pageSize - 1);
      }
      
      // Execute query
      const { data, error } = await query;
      
      // Get total count in parallel for pagination
      const countQuery = supabase
        .from('employees')
        .select('id', { count: 'exact', head: true });
      
      // Apply the same filters to count query
      if (filter) {
        if (filter.branch_id) {
          countQuery.eq('branch_id', filter.branch_id);
        }
        
        if (filter.search) {
          countQuery.ilike('full_name', `%${filter.search}%`);
        }
        
        if (filter.is_active !== undefined) {
          countQuery.eq('is_active', filter.is_active);
        }
      }
      
      const { count: totalCount, error: countError } = await countQuery;
      
      // Handle errors
      if (error) {
        return { error: error.message };
      }
      
      if (countError) {
        console.warn('Error getting count:', countError.message);
      }
      
      // If no data, return empty array
      if (!data) {
        return { data: [] };
      }
      
      // Map the Supabase response to our Employee type
      const employees: Employee[] = [];
      
      for (const employeeData of data) {
        if (!employeeData) continue;
        
        // Type assertion to handle potential missing fields
        const typedEmployee = employeeData as any;
        
        // Safely extract branch data if it exists
        let branch = null;
        if (typedEmployee.branches) {
          branch = {
            id: typedEmployee.branches.id || '',
            name: typedEmployee.branches.name || '',
            created_at: typedEmployee.branches.created_at || ''
          };
        }
        
        // Create employee object with required fields
        employees.push({
          id: typedEmployee.id || '',
          full_name: typedEmployee.full_name || '',
          employee_code: typedEmployee.employee_code || '',
          job_title: typedEmployee.job_title || null,
          branch_id: typedEmployee.branch_id || '',
          is_active: typeof typedEmployee.is_active === 'boolean' ? typedEmployee.is_active : true,
          created_at: typedEmployee.created_at || '',
          branch
        });
      }
      
      // Cache the result
      DataCache.set(cacheKey, employees);
      
      return {
        data: employees,
        message: `Retrieved ${employees.length} employees`,
        warning: totalCount && totalCount > employees.length
          ? `Showing ${employees.length} of ${totalCount} total employees`
          : undefined
      };
    } catch (err: any) {
      console.error('Error in getEmployees:', err);
      return { error: err.message || 'An unknown error occurred' };
    }
  },
  
  // Get a single employee by ID
  async getEmployee(id: string): Promise<ApiResponse<Employee>> {
    try {
      // Generate cache key
      const cacheKey = `employee_${id}`;
      
      // Check cache first
      const cachedData = DataCache.get(cacheKey);
      if (cachedData) {
        return { data: cachedData };
      }
      
      const supabase = createClient();
      
      // Check if user is admin or belongs to the same branch
      const isAdmin = await AuthService.isAdmin();
      if (!isAdmin) {
        const userBranchId = await AuthService.getUserBranchId();
        
        // Get employee's branch ID first
        const { data: employeeBranch, error: branchError } = await supabase
          .from('employees')
          .select('branch_id')
          .eq('id', id)
          .single();
        
        if (branchError || !employeeBranch) {
          return { error: branchError?.message || 'Employee not found' };
        }
        
        // If user is not from the same branch, deny access
        if (employeeBranch.branch_id !== userBranchId) {
          return { error: 'You do not have permission to view this employee' };
        }
      }
      
      // Fetch employee with branch info
      const { data, error } = await supabase
        .from('employees')
        .select('*, branches(*)')
        .eq('id', id)
        .single();
      
      if (error) {
        return { error: error.message || 'Employee not found' };
      }
      
      if (!data) {
        return { error: 'Employee not found' };
      }
      
      // Create the employee object with proper typing
      // Type assertion to handle potential missing fields
      const typedData = data as any;
      
      // Safely extract branch data if it exists
      let branch = null;
      if (typedData.branches) {
        branch = {
          id: typedData.branches.id || '',
          name: typedData.branches.name || '',
          created_at: typedData.branches.created_at || ''
        };
      }
      
      // Create employee object with required fields
      const employee: Employee = {
        id: typedData.id || '',
        full_name: typedData.full_name || '',
        employee_code: typedData.employee_code || '',
        job_title: typedData.job_title || null,
        branch_id: typedData.branch_id || '',
        is_active: typeof typedData.is_active === 'boolean' ? typedData.is_active : true,
        created_at: typedData.created_at || '',
        branch
      };
      
      // Cache the result
      DataCache.set(cacheKey, employee);
      
      return { data: employee };
    } catch (err: any) {
      console.error('Error in getEmployee:', err);
      return { error: err.message || 'An unknown error occurred' };
    }
  },
  
  // Create a new employee
  async createEmployee(employeeData: EmployeeFormData): Promise<ApiResponse<Employee>> {
    const supabase = createClient();
    
    // Check if user has permission to create employees
    const isAdmin = await AuthService.isAdmin();
    const userBranchId = await AuthService.getUserBranchId();
    
    if (!isAdmin && employeeData.branch_id !== userBranchId) {
      return { error: 'User not authorized to create employees for other branches' };
    }
    
    // Insert the employee
    const { data, error } = await supabase
      .from('employees')
      .insert({
        full_name: employeeData.full_name,
        employee_code: employeeData.employee_code,
        job_title: employeeData.job_title,
        branch_id: employeeData.branch_id,
        is_active: employeeData.is_active !== undefined ? employeeData.is_active : true
      })
      .select('*, branches(*)')
      .single();
    
    if (error) {
      return { error: error.message };
    }
    
    // Clear the employees cache
    DataCache.clear('employees:');
    
    // Map the Supabase response to our Employee type
    const employee = {
      ...data,
      branch: data.branches
    };
    
    return { data: employee };
  },
  
  // Update an employee
  async updateEmployee(id: string, employeeData: Partial<EmployeeFormData>): Promise<ApiResponse<Employee>> {
    const supabase = createClient();
    
    // Check if user has permission to update this employee
    const isAdmin = await AuthService.isAdmin();
    if (!isAdmin) {
      const userBranchId = await AuthService.getUserBranchId();
      
      // Get the employee's current branch
      const { data: employee } = await supabase
        .from('employees')
        .select('branch_id')
        .eq('id', id)
        .single();
      
      if (!employee || employee.branch_id !== userBranchId) {
        return { error: 'User not authorized to update this employee' };
      }
      
      // Non-admin users cannot change branch
      if (employeeData.branch_id && employeeData.branch_id !== userBranchId) {
        return { error: 'User not authorized to change employee branch' };
      }
    }
    
    // Update the employee
    const { data, error } = await supabase
      .from('employees')
      .update(employeeData)
      .eq('id', id)
      .select('*, branches(*)')
      .single();
    
    if (error) {
      return { error: error.message };
    }
    
    // Clear the employee cache
    DataCache.clear(`employee:${id}`);
    DataCache.clear('employees:');
    
    // Map the Supabase response to our Employee type
    const employee = {
      ...data,
      branch: data.branches
    };
    
    return { data: employee };
  },
  
  // Delete an employee
  async deleteEmployee(id: string): Promise<ApiResponse<void>> {
    const supabase = createClient();
    
    // Check if user has permission to delete this employee
    const isAdmin = await AuthService.isAdmin();
    if (!isAdmin) {
      const userBranchId = await AuthService.getUserBranchId();
      
      // Get the employee's current branch
      const { data: employee } = await supabase
        .from('employees')
        .select('branch_id')
        .eq('id', id)
        .single();
      
      if (!employee || employee.branch_id !== userBranchId) {
        return { error: 'User not authorized to delete this employee' };
      }
    }
    
    // Delete the employee
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) {
      return { error: error.message };
    }
    
    // Clear the employee cache
    DataCache.clear(`employee:${id}`);
    DataCache.clear('employees:');
    
    return { data: undefined };
  },
  
  // Get employee count by branch
  async getEmployeeCountByBranch(): Promise<ApiResponse<{ branch_id: string, branch_name: string, count: number }[]>> {
    try {
      // Generate cache key
      const cacheKey = 'employee_count_by_branch';
      
      // Check cache first
      const cachedData = DataCache.get(cacheKey);
      if (cachedData) {
        return { data: cachedData };
      }
      
      const supabase = createClient();
      
      // Check if user is admin
      const isAdmin = await AuthService.isAdmin();
      
      // Get all branches
      const { data: branches, error: branchError } = await supabase
        .from('branches')
        .select('id, name');
        
      if (branchError) {
        return { error: branchError.message };
      }
      
      // For each branch, count employees
      const branchCounts = await Promise.all(
        branches.map(async (branch) => {
          // If not admin, only get count for user's branch
          if (!isAdmin) {
            const userBranchId = await AuthService.getUserBranchId();
            if (branch.id !== userBranchId) {
              return null;
            }
          }
          
          const { count, error } = await supabase
            .from('employees')
            .select('id', { count: 'exact', head: true })
            .eq('branch_id', branch.id);
            
          if (error) {
            console.error(`Error getting count for branch ${branch.id}:`, error);
            return null;
          }
          
          return {
            branch_id: branch.id,
            branch_name: branch.name,
            count: count || 0
          };
        })
      );
      
      // Filter out null values
      const result = branchCounts.filter(Boolean) as { branch_id: string, branch_name: string, count: number }[];
      
      // Cache the result
      DataCache.set(cacheKey, result);
      
      return { data: result };
    } catch (err: any) {
      console.error('Error in getEmployeeCountByBranch:', err);
      return { error: err.message };
    }
  }
};
