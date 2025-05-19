
-- Create a trigger function to sync Auth users with the public users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, permissions)
  VALUES (
    new.id, 
    new.email,
    'admin', -- Default role for the first user, others will be regular users
    jsonb_build_object(
      'users', ARRAY['view', 'create', 'edit', 'delete']::text[],
      'branches', ARRAY['view', 'create', 'edit', 'delete']::text[],
      'employees', ARRAY['view', 'create', 'edit', 'delete']::text[],
      'settings', ARRAY['view', 'edit']::text[]
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add the trigger to sync new auth users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to check admin status without recursive RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Drop and recreate policies one by one
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
CREATE POLICY "Users can read their own data" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
CREATE POLICY "Users can update their own data" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all user data" ON public.users;
CREATE POLICY "Admins can read all user data" 
ON public.users 
FOR SELECT 
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all user data" ON public.users;
CREATE POLICY "Admins can update all user data" 
ON public.users 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert user data" ON public.users;
CREATE POLICY "Admins can insert user data" 
ON public.users 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete user data" ON public.users;
CREATE POLICY "Admins can delete user data" 
ON public.users 
FOR DELETE 
USING (public.is_admin(auth.uid()));
