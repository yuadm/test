import { createClient } from '@/lib/supabase/client';
import { Branch, ApiResponse } from '@/types';

export const BranchService = {
  // Get all branches
  async getAllBranches(): Promise<ApiResponse<Branch[]>> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('name');

    if (error) {
      return { error: error.message };
    }

    return { data };
  },

  // Get a branch by ID
  async getBranchById(id: string): Promise<ApiResponse<Branch>> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data };
  },

  // Get branch with employee count
  async getBranchWithEmployeeCount(): Promise<ApiResponse<{ id: string; name: string; employee_count: number }[]>> {
    const supabase = createClient();
    
    // Instead of using RPC, we'll use a direct query
    const branchesResult = await supabase.from('branches').select('*');
    
    if (branchesResult.error) {
      return { error: branchesResult.error.message };
    }
    
    const branches = branchesResult.data;
    const result = [];
    
    for (const branch of branches) {
      const countResult = await supabase
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branch.id);
        
      result.push({
        id: branch.id,
        name: branch.name,
        employee_count: countResult.count || 0
      });
    }
    
    return { data: result };
  }
};
