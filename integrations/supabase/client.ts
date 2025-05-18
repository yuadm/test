
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://toxqgarjscliqecfvujs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveHFnYXJqc2NsaXFlY2Z2dWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5NzI0MjQsImV4cCI6MjA2MjU0ODQyNH0.lR-_Ga-bj_Asz-YF4F3zTBhQAZdDZ6U6BIS91b1jZp8";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
