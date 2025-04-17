-- Create a stored procedure to fix the RLS policies
CREATE OR REPLACE PROCEDURE fix_rls_policies()
LANGUAGE plpgsql
AS $$
BEGIN
  -- Disable RLS on users table temporarily
  ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
  
  -- Drop all existing policies on users table
  DROP POLICY IF EXISTS users_admin_policy ON public.users;
  DROP POLICY IF EXISTS users_self_policy ON public.users;
  DROP POLICY IF EXISTS users_update_self_policy ON public.users;
  
  -- Re-enable RLS
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  
  -- Create a trusted function for admin check that doesn't cause recursion
  CREATE OR REPLACE FUNCTION public.is_admin_safe()
  RETURNS BOOLEAN
  SECURITY DEFINER -- This runs with the privileges of the function creator
  SET search_path = public
  LANGUAGE plpgsql
  AS $$
  BEGIN
    RETURN EXISTS (
      SELECT 1 
      FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    );
  END;
  $$;
  
  -- Create a trusted function to get user's branch
  CREATE OR REPLACE FUNCTION public.get_user_branch_id_safe()
  RETURNS UUID
  SECURITY DEFINER -- This runs with the privileges of the function creator
  SET search_path = public
  LANGUAGE plpgsql
  AS $$
  DECLARE
    branch_id UUID;
  BEGIN
    SELECT users.branch_id INTO branch_id 
    FROM public.users 
    WHERE id = auth.uid();
    
    RETURN branch_id;
  END;
  $$;
  
  -- Create new policies using the safe functions
  -- Self policy for users
  CREATE POLICY users_self_policy ON public.users
    FOR SELECT 
    USING (auth.uid() = id);
  
  -- Admin policy for users
  CREATE POLICY users_admin_policy ON public.users
    FOR ALL 
    USING (public.is_admin_safe());
  
  -- Update policy for users
  CREATE POLICY users_update_self_policy ON public.users
    FOR UPDATE 
    USING (auth.uid() = id);
  
  -- Fix other tables' policies to use the safe functions
  -- Employees policies
  DROP POLICY IF EXISTS employees_admin_policy ON public.employees;
  DROP POLICY IF EXISTS employees_user_branch_policy ON public.employees;
  
  CREATE POLICY employees_admin_policy ON public.employees
    FOR ALL USING (public.is_admin_safe());
  
  CREATE POLICY employees_user_branch_policy ON public.employees
    FOR SELECT USING (
      NOT public.is_admin_safe() AND 
      branch_id = public.get_user_branch_id_safe()
    );
  
  -- Leaves policies
  DROP POLICY IF EXISTS leaves_admin_policy ON public.leaves;
  DROP POLICY IF EXISTS leaves_user_branch_policy ON public.leaves;
  
  CREATE POLICY leaves_admin_policy ON public.leaves
    FOR ALL USING (public.is_admin_safe());
  
  CREATE POLICY leaves_user_branch_policy ON public.leaves
    FOR SELECT USING (
      NOT public.is_admin_safe() AND
      employee_id IN (
        SELECT id FROM public.employees 
        WHERE branch_id = public.get_user_branch_id_safe()
      )
    );
  
  -- Archived leaves policies
  DROP POLICY IF EXISTS archived_leaves_admin_policy ON public.archived_leaves;
  DROP POLICY IF EXISTS archived_leaves_user_branch_policy ON public.archived_leaves;
  
  CREATE POLICY archived_leaves_admin_policy ON public.archived_leaves
    FOR ALL USING (public.is_admin_safe());
  
  CREATE POLICY archived_leaves_user_branch_policy ON public.archived_leaves
    FOR SELECT USING (
      NOT public.is_admin_safe() AND
      employee_id IN (
        SELECT id FROM public.employees 
        WHERE branch_id = public.get_user_branch_id_safe()
      )
    );
END;
$$;

-- Execute the procedure
CALL fix_rls_policies();
