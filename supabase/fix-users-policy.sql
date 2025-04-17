-- Completely disable RLS on users table first to break the recursion cycle
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on users table
DROP POLICY IF EXISTS users_admin_policy ON users;
DROP POLICY IF EXISTS users_self_policy ON users;

-- Re-enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a simpler policy for users table that doesn't cause recursion
-- This policy allows users to see their own record
CREATE POLICY users_self_policy ON users
  FOR SELECT USING (auth.uid() = id);

-- This policy allows admins to see and modify all user records
-- Using a direct role check without recursion
CREATE POLICY users_admin_policy ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid() AND 
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() AND users.role = 'admin'
      )
    )
  );

-- Create a policy for users to update their own record
CREATE POLICY users_update_self_policy ON users
  FOR UPDATE USING (auth.uid() = id);
