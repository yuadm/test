import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Add type declaration for process.env
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    }
  }
}

// Initialize Supabase client for client components (runs in browser)
export function createClient() {
  // Environment variables must be set
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
  const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`;

  return createSupabaseClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: storageKey,
        storage: {
          getItem: (key: string): string | null => {
            if (typeof window === 'undefined') {
              return null;
            }
            return window.localStorage.getItem(key);
          },
          setItem: (key: string, value: string): void => {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(key, value);
              // Also set as cookie for middleware detection
              document.cookie = `${key}=${value}; path=/; max-age=2592000; SameSite=Lax`;
            }
          },
          removeItem: (key: string): void => {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(key);
              // Also remove cookie
              document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
            }
          },
        },
      },
    }
  );
}
