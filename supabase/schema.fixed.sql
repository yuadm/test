-- Create tables for Annual Leave Management System

-- Branches table
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the four branches
INSERT INTO branches (name) VALUES
  ('Islington'),
  ('Haringey'),
  ('Lambeth'),
  ('Southwark')
ON CONFLICT (name) DO NOTHING;

-- Users table (linked with Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  branch_id UUID REFERENCES branches(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT branch_required_for_normal_users CHECK (
    (role = 'admin' AND branch_id IS NULL) OR
    (role = 'user' AND branch_id IS NOT NULL)
  )
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  employee_code TEXT NOT NULL UNIQUE,
  job_title TEXT,
  branch_id UUID NOT NULL REFERENCES branches(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leave years table
CREATE TABLE IF NOT EXISTS leave_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date),
  CONSTRAINT start_date_april_first CHECK (EXTRACT(MONTH FROM start_date) = 4 AND EXTRACT(DAY FROM start_date) = 1),
  CONSTRAINT end_date_march_31 CHECK (EXTRACT(MONTH FROM end_date) = 3 AND EXTRACT(DAY FROM end_date) = 31)
);

-- Create a trigger to ensure only one active leave year
CREATE OR REPLACE FUNCTION ensure_single_current_leave_year()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = TRUE THEN
    UPDATE leave_years SET is_current = FALSE WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER single_current_leave_year
BEFORE INSERT OR UPDATE ON leave_years
FOR EACH ROW
EXECUTE FUNCTION ensure_single_current_leave_year();

-- Leaves table
CREATE TABLE IF NOT EXISTS leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  leave_year_id UUID NOT NULL REFERENCES leave_years(id),
  leave_type TEXT NOT NULL CHECK (leave_type IN ('Annual', 'Sick', 'Unpaid', 'Working')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration INTEGER NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_duration CHECK (duration > 0 AND duration <= 28)
);

-- Archived leaves table (for historical data)
CREATE TABLE IF NOT EXISTS archived_leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  leave_year_id UUID NOT NULL REFERENCES leave_years(id),
  leave_type TEXT NOT NULL CHECK (leave_type IN ('Annual', 'Sick', 'Unpaid', 'Working')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration INTEGER NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create functions for leave validation

-- Function to check if a leave period overlaps with existing leaves
CREATE OR REPLACE FUNCTION check_leave_overlap(
  p_employee_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_leave_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  overlap_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM leaves
    WHERE employee_id = p_employee_id
    AND ((start_date <= p_end_date) AND (end_date >= p_start_date))
    AND (p_leave_id IS NULL OR id != p_leave_id)
  ) INTO overlap_exists;
  
  RETURN overlap_exists;
END;
$$ LANGUAGE plpgsql;

-- Function to check if leave is within the current leave year
CREATE OR REPLACE FUNCTION check_leave_in_current_year(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  current_year_start DATE;
  current_year_end DATE;
BEGIN
  SELECT start_date, end_date INTO current_year_start, current_year_end
  FROM leave_years
  WHERE is_current = TRUE;
  
  RETURN (p_start_date >= current_year_start AND p_end_date <= current_year_end);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total leave days for an employee in a leave year
CREATE OR REPLACE FUNCTION calculate_total_leave_days(
  p_employee_id UUID,
  p_leave_year_id UUID,
  p_exclude_leave_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  total_days INTEGER;
BEGIN
  SELECT COALESCE(SUM(duration), 0) INTO total_days
  FROM leaves
  WHERE employee_id = p_employee_id
  AND leave_year_id = p_leave_year_id
  AND leave_type = 'Annual'
  AND (p_exclude_leave_id IS NULL OR id != p_exclude_leave_id);
  
  RETURN total_days;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate leave entries
CREATE OR REPLACE FUNCTION validate_leave()
RETURNS TRIGGER AS $$
DECLARE
  current_year_id UUID;
  total_days INTEGER;
BEGIN
  -- Check if leave dates are within the current leave year
  IF NOT check_leave_in_current_year(NEW.start_date, NEW.end_date) THEN
    RAISE EXCEPTION 'Leave dates must be within the current leave year';
  END IF;
  
  -- Check for overlapping leave periods
  IF check_leave_overlap(NEW.employee_id, NEW.start_date, NEW.end_date, NEW.id) THEN
    RAISE EXCEPTION 'Leave period overlaps with existing leave for this employee';
  END IF;
  
  -- For Annual leave type, check if total days exceed 28
  IF NEW.leave_type = 'Annual' THEN
    SELECT id INTO current_year_id FROM leave_years WHERE is_current = TRUE;
    
    total_days := calculate_total_leave_days(NEW.employee_id, current_year_id, NEW.id) + NEW.duration;
    
    IF total_days > 28 THEN
      RAISE EXCEPTION 'Employee cannot take more than 28 days of annual leave in a leave year (attempting to use % days)', total_days;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_leave_trigger
BEFORE INSERT OR UPDATE ON leaves
FOR EACH ROW
EXECUTE FUNCTION validate_leave();

-- Create RLS policies

-- Enable RLS on all tables
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_leaves ENABLE ROW LEVEL SECURITY;

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

-- Branches policies
CREATE POLICY branches_select_policy ON branches
  FOR SELECT USING (true);

CREATE POLICY branches_insert_update_delete_policy ON branches
  FOR ALL USING (is_admin());

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

-- Leave years policies
CREATE POLICY leave_years_select_policy ON leave_years
  FOR SELECT USING (true);

CREATE POLICY leave_years_admin_policy ON leave_years
  FOR ALL USING (is_admin());

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

-- Initialize current leave year if not exists
DO $$
DECLARE
  current_year INTEGER;
  next_year INTEGER;
  start_date DATE;
  end_date DATE;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Adjust year based on current month
  IF EXTRACT(MONTH FROM CURRENT_DATE) < 4 THEN
    -- We're in Jan-Mar, so the leave year started last calendar year
    start_date := make_date(current_year - 1, 4, 1);
    end_date := make_date(current_year, 3, 31);
  ELSE
    -- We're in Apr-Dec, so the leave year started this calendar year
    start_date := make_date(current_year, 4, 1);
    end_date := make_date(current_year + 1, 3, 31);
  END IF;
  
  -- Insert current leave year if not exists
  INSERT INTO leave_years (start_date, end_date, is_current)
  SELECT start_date, end_date, TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM leave_years WHERE is_current = TRUE
  );
END;
$$;
