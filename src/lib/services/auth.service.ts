import { createClient } from '@/lib/supabase/client';
import { User, Branch } from '@/types';

export const AuthService = {
  // Sign in with email and password
  async signIn(email: string, password: string) {
    const supabase = createClient();
    
    // Clear any existing session first to avoid conflicts
    await supabase.auth.signOut();
    
    // Sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Manually set the cookie for middleware detection
    if (typeof window !== 'undefined' && data.session) {
      const token = data.session.access_token;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || '';
      const cookieName = `sb-${projectRef}-auth-token`;
      document.cookie = `${cookieName}=${token}; path=/; max-age=2592000; SameSite=Lax`;
    }
    
    return data;
  },

  // Sign out the current user
  async signOut() {
    const supabase = createClient();
    
    // Clear the auth cookie before signing out
    if (typeof window !== 'undefined') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || '';
      const cookieName = `sb-${projectRef}-auth-token`;
      document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax`;
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get the current user with profile data
  async getCurrentUser(): Promise<User | null> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    // Get user profile data from the users table
    const { data, error } = await supabase
      .from('users')
      .select('*, branches(*)')
      .eq('id', user.id)
      .single();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      email: data.email,
      role: data.role as 'admin' | 'user',
      branch_id: data.branch_id,
      created_at: data.created_at,
      branch: data.branches as Branch | undefined,
    };
  },

  // Check if the current user is an admin
  async isAdmin(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.role === 'admin';
  },

  // Get the current user's branch ID (for normal users)
  async getUserBranchId(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user?.branch_id || null;
  },

  // Ensure user has a branch association (either direct or as admin)
  async ensureBranchAccess(): Promise<string | null> {
    const user = await this.getCurrentUser();
    
    if (!user) return null;
    
    // Admin users can access all branches
    if (user.role === 'admin') {
      // If admin doesn't have a branch, get the first branch
      if (!user.branch_id) {
        const supabase = createClient();
        const { data } = await supabase
          .from('branches')
          .select('id')
          .order('name')
          .limit(1)
          .single();
          
        return data?.id || null;
      }
      return user.branch_id;
    }
    
    // Regular users must have a branch
    return user.branch_id;
  }
};
