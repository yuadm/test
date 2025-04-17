// Script to fix the infinite recursion issue in Supabase RLS policies
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase URL or service role key in environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixRecursionIssue() {
  console.log('Starting to fix infinite recursion issue in RLS policies...');

  try {
    // Drop existing policies that cause recursion
    console.log('Dropping existing problematic policies...');
    
    const dropPoliciesQuery = `
      -- Drop existing policies
      DROP POLICY IF EXISTS users_admin_policy ON users;
      DROP POLICY IF EXISTS employees_admin_policy ON employees;
      DROP POLICY IF EXISTS employees_user_branch_policy ON employees;
      DROP POLICY IF EXISTS leaves_admin_policy ON leaves;
      DROP POLICY IF EXISTS leaves_user_branch_policy ON leaves;
      DROP POLICY IF EXISTS archived_leaves_admin_policy ON archived_leaves;
      DROP POLICY IF EXISTS archived_leaves_user_branch_policy ON archived_leaves;
    `;
    
    const { error: dropError } = await supabase.rpc('pgexecute', { query: dropPoliciesQuery });
    if (dropError) {
      console.error('Error dropping policies:', dropError);
      return;
    }
    
    // Create helper functions
    console.log('Creating helper functions...');
    
    const helperFunctionsQuery = `
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
    `;
    
    const { error: functionsError } = await supabase.rpc('pgexecute', { query: helperFunctionsQuery });
    if (functionsError) {
      console.error('Error creating helper functions:', functionsError);
      return;
    }
    
    // Create new fixed policies
    console.log('Creating new fixed policies...');
    
    const newPoliciesQuery = `
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
    `;
    
    const { error: policiesError } = await supabase.rpc('pgexecute', { query: newPoliciesQuery });
    if (policiesError) {
      console.error('Error creating new policies:', policiesError);
      return;
    }
    
    console.log('Successfully fixed infinite recursion issue in RLS policies!');
    console.log('Please refresh your application to see the changes.');
    
  } catch (error) {
    console.error('Error fixing recursion issue:', error);
  }
}

// Run the fix
fixRecursionIssue();
