import { createClient } from '@/lib/supabase/client';
import { User, UserFormData, ApiResponse, UserRole } from '@/types';
import { AuthService } from './auth.service';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const UserService = {
  // Get all users (admin only)
  async getUsers(): Promise<ApiResponse<User[]>> {
    const supabase = createClient();
    
    // Only admins can view all users
    const isAdmin = await AuthService.isAdmin();
    if (!isAdmin) {
      return { error: 'Only administrators can view user list' };
    }
    
    // Get all users with their branch information
    const { data, error } = await supabase
      .from('users')
      .select('*, branches(*)')
      .order('email');
    
    if (error) {
      return { error: error.message };
    }
    
    // Transform the data to ensure role is properly typed
    const typedData = data?.map(user => ({
      ...user,
      role: user.role as UserRole,
      branch: user.branches || undefined
    }));
    
    return { data: typedData };
  },
  
  // Get user by ID (admin only)
  async getUserById(id: string): Promise<ApiResponse<User>> {
    const supabase = createClient();
    
    // Only admins can view user details
    const isAdmin = await AuthService.isAdmin();
    if (!isAdmin) {
      return { error: 'Only administrators can view user details' };
    }
    
    // Get user with branch information
    const { data, error } = await supabase
      .from('users')
      .select('*, branches(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      return { error: error.message };
    }
    
    // Transform to ensure role is properly typed
    if (data) {
      const typedUser: User = {
        ...data,
        role: data.role as UserRole,
        branch: data.branches || undefined
      };
      return { data: typedUser };
    }
    
    return { error: 'User not found' };
  },
  
  // Create a new user (admin only)
  async createUser(userData: UserFormData): Promise<ApiResponse<User>> {
    // Only admins can create users
    const isAdmin = await AuthService.isAdmin();
    if (!isAdmin) {
      return { error: 'Only administrators can create users' };
    }
    
    try {
      const supabase = createClient();
      
      // First check if the branch exists if a branch_id is provided
      if (userData.role === 'user' && userData.branch_id) {
        const { data: branchData, error: branchError } = await supabase
          .from('branches')
          .select('id')
          .eq('id', userData.branch_id)
          .single();
          
        if (branchError || !branchData) {
          return { error: 'The selected branch does not exist' };
        }
      }
      
      // First, check if the user already exists in auth
      const { data: existingUsers, error: lookupError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .maybeSingle();
      
      if (lookupError) {
        console.error('Error checking for existing user:', lookupError);
      }
      
      // If user already exists, return an error
      if (existingUsers) {
        return { error: 'A user with this email already exists' };
      }
      
      // Create the auth user using the signUp method
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: undefined
        }
      });
      
      if (authError || !authData.user) {
        return { error: authError?.message || 'Failed to create user' };
      }
      
      // Return a success message with the user data we have
      const typedUser: User = {
        id: authData.user.id,
        email: userData.email,
        role: userData.role as UserRole,
        branch_id: userData.role === 'user' ? (userData.branch_id || null) : null,
        branch: undefined
      };
      
      return { 
        data: typedUser,
        message: 'User created successfully. The user will need to confirm their email before they can log in.' 
      };
    } catch (error: any) {
      console.error('Error in createUser:', error);
      return { error: error.message || 'Failed to create user' };
    }
  },
  
  // Update a user (admin only)
  async updateUser(id: string, userData: Partial<UserFormData>): Promise<ApiResponse<User>> {
    // Only admins can update users
    const isAdmin = await AuthService.isAdmin();
    if (!isAdmin) {
      return { error: 'Only administrators can update users' };
    }
    
    const supabase = createClient();
    
    // Update user profile
    const updateData: any = {};
    
    // Only include fields that are provided
    if (userData.email) updateData.email = userData.email;
    if (userData.role) {
      updateData.role = userData.role;
      // If role is changed to admin, remove branch_id
      if (userData.role === 'admin') {
        updateData.branch_id = null;
      }
      // If role is changed to user, branch_id is required
      else if (userData.role === 'user' && !userData.branch_id) {
        return { error: 'Branch is required for normal users' };
      }
    }
    if (userData.branch_id) updateData.branch_id = userData.branch_id;
    
    // Remove is_disabled handling since the field doesn't exist in the schema
    
    // Update the user profile
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('*, branches(*)')
      .single();
    
    if (error) {
      return { error: error.message };
    }
    
    // Transform to ensure role is properly typed
    const typedUser: User = {
      ...data,
      role: data.role as UserRole,
      branch: data.branches || undefined
    };
    
    // Update email in auth if provided
    // Note: Without service role key, we can't update email directly
    // This functionality will be limited
    
    // Update password if provided
    // Note: Without service role key, we can't update password directly
    // This functionality will be limited
    
    return { data: typedUser };
  },
  
  // Delete a user (admin only)
  async deleteUser(id: string): Promise<ApiResponse<void>> {
    // Only admins can delete users
    const isAdmin = await AuthService.isAdmin();
    if (!isAdmin) {
      return { error: 'Only administrators can delete users' };
    }
    
    // Check if user is trying to delete themselves
    const currentUser = await AuthService.getCurrentUser();
    if (currentUser?.id === id) {
      return { error: 'You cannot delete your own account' };
    }
    
    try {
      const supabase = createClient();
      
      // Without service role key, we can only delete the user profile
      // The auth user will remain but won't be usable without a profile
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) {
        return { error: error.message };
      }
      
      return { data: undefined };
    } catch (error: any) {
      return { error: error.message || 'Failed to delete user' };
    }
  },
  
  // Reset a user's password (admin only)
  async resetPassword(id: string, newPassword: string): Promise<ApiResponse<void>> {
    // Only admins can reset passwords
    const isAdmin = await AuthService.isAdmin();
    if (!isAdmin) {
      return { error: 'Only administrators can reset passwords' };
    }
    
    try {
      const supabase = createClient();
      
      // Get the user email first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', id)
        .single();
      
      if (userError || !userData) {
        return { error: userError?.message || 'User not found' };
      }
      
      // Use the service role client to update the password directly
      try {
        const adminClient = createServiceRoleClient();
        
        // Use the admin API to update the user's password directly
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
          id,
          { password: newPassword }
        );
        
        if (updateError) {
          console.error('Error updating password with admin API:', updateError);
          throw new Error(updateError.message);
        }
        
        return { data: undefined, message: 'Password reset successfully' };
      } catch (adminError: any) {
        console.error('Admin password reset failed:', adminError);
        
        // Fallback to email reset if admin update fails
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          userData.email,
          {
            redirectTo: `${window.location.origin}/auth/update-password`,
          }
        );
        
        if (resetError) {
          return { error: resetError.message || 'Failed to reset password' };
        }
        
        return { 
          data: undefined, 
          message: 'Password reset email sent to the user. They will need to click the link to set a new password.' 
        };
      }
    } catch (error: any) {
      console.error('Error in resetPassword:', error);
      return { error: error.message || 'Failed to reset password' };
    }
  }
};
