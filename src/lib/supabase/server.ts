import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Initialize Supabase client that can be used in any context
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, return a dummy client that will be replaced at runtime
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
      console.warn('Supabase URL and Anon Key not available during build time');
      // Return a dummy client that won't be used during build
      return createSupabaseClient<Database>(
        'https://placeholder-url.supabase.co',
        'placeholder-key',
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
    }
    throw new Error('Supabase URL and Anon Key must be provided in environment variables');
  }
  
  return createSupabaseClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

// Service role client for admin operations that bypass RLS
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    // During build time, return a dummy client that will be replaced at runtime
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
      console.warn('Supabase URL and Service Role Key not available during build time');
      // Return a dummy client that won't be used during build
      return createSupabaseClient<Database>(
        'https://placeholder-url.supabase.co',
        'placeholder-key',
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
    }
    throw new Error('Supabase URL and Service Role Key must be provided in environment variables');
  }
  
  return createSupabaseClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    { 
      auth: { 
        autoRefreshToken: false, 
        persistSession: false 
      } 
    }
  );
}
