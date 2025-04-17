-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS users_admin_policy ON users;
DROP POLICY IF EXISTS users_self_policy ON users;
DROP POLICY IF EXISTS employees_admin_policy ON employees;
DROP POLICY IF EXISTS employees_user_branch_policy ON employees;
DROP POLICY IF EXISTS leaves_admin_policy ON leaves;
DROP POLICY IF EXISTS leaves_user_branch_policy ON leaves;
DROP POLICY IF EXISTS archived_leaves_admin_policy ON archived_leaves;
DROP POLICY IF EXISTS archived_leaves_user_branch_policy ON archived_leaves;

-- Create helper functions
-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- Create a function to get user's branch_id
CREATE OR REPLACE FUNCTION get_user_branch_id()
RETURNS UUID AS $$
DECLARE
  branch UUID;
BEGIN
  SELECT branch_id INTO branch FROM users WHERE id = auth.uid();
  RETURN branch;
END;
$$ LANGUAGE plpgsql;

-- Users policies - FIX for infinite recursion
CREATE POLICY users_admin_policy ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid() AND 
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    )
  );

CREATE POLICY users_self_policy ON users
  FOR SELECT USING (
    auth.uid() = id
  );

-- Employees policies
CREATE POLICY employees_admin_policy ON employees
  FOR ALL USING (is_admin());

CREATE POLICY employees_user_branch_policy ON employees
  FOR SELECT USING (
    NOT is_admin() AND branch_id = get_user_branch_id()
  );

-- Leaves policies
CREATE POLICY leaves_admin_policy ON leaves
  FOR ALL USING (is_admin());

CREATE POLICY leaves_user_branch_policy ON leaves
  FOR SELECT USING (
    NOT is_admin() AND
    employee_id IN (
      SELECT id FROM employees 
      WHERE branch_id = get_user_branch_id()
    )
  );

-- Archived leaves policies
CREATE POLICY archived_leaves_admin_policy ON archived_leaves
  FOR ALL USING (is_admin());

CREATE POLICY archived_leaves_user_branch_policy ON archived_leaves
  FOR SELECT USING (
    NOT is_admin() AND
    employee_id IN (
      SELECT id FROM employees 
      WHERE branch_id = get_user_branch_id()
    )
  );
