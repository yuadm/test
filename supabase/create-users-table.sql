-- Create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  branch_id UUID REFERENCES public.branches(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT branch_required_for_normal_users CHECK (
    (role = 'admin' AND branch_id IS NULL) OR
    (role = 'user' AND branch_id IS NOT NULL)
  )
);

-- Enable RLS on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS users_temp_policy ON public.users;

-- Create a simple policy that allows all operations for authenticated users
CREATE POLICY users_temp_policy ON public.users
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Insert admin user if not exists
INSERT INTO public.users (id, email, role, created_at)
SELECT 
  id, 
  email, 
  'admin', 
  NOW()
FROM 
  auth.users
WHERE 
  email = 'admin@example.com'
  AND NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@example.com')
ON CONFLICT (id) DO NOTHING;

-- Insert regular user if not exists
INSERT INTO public.users (id, email, role, branch_id, created_at)
SELECT 
  auth.users.id, 
  auth.users.email, 
  'user', 
  (SELECT id FROM public.branches WHERE name = 'Islington' LIMIT 1),
  NOW()
FROM 
  auth.users
WHERE 
  email = 'user@example.com'
  AND NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'user@example.com')
ON CONFLICT (id) DO NOTHING;
