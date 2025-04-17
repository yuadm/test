# Setting Up Your Supabase Project

Follow these steps to set up your Supabase project for the Annual Leave Management System:

## 1. Create Tables and Initial Data

1. Go to your Supabase dashboard: https://app.supabase.io/projects
2. Navigate to the "SQL Editor" section in the left sidebar
3. Click "New Query"
4. Copy and paste the entire contents of the `supabase.schema.sql` file into the SQL editor
5. Click "Run" to execute the SQL and create all the necessary tables, policies, and initial data

## 2. Create Demo Users

1. Go to the "Authentication" section in the left sidebar
2. Click on "Users" tab
3. Click "Add User" button
4. Create the admin user:
   - Email: admin@example.com
   - Password: password123
5. Click "Create User"
6. Repeat to create the regular user:
   - Email: user@example.com
   - Password: password123

## 3. Test Your Application

After completing the above steps:

1. Return to your application
2. Try logging in with:
   - Admin: admin@example.com / password123
   - User: user@example.com / password123

The login should now work correctly, and you should be able to access the dashboard.

## Database Schema Overview

The schema creates the following tables:
- `branches`: Office branches
- `users`: System users linked to auth.users
- `employees`: Employee records
- `leave_years`: Annual leave periods
- `leaves`: Leave records
- `archived_leaves`: Historical leave data

Row Level Security (RLS) policies are set up to ensure:
- Admins can access everything
- Branch users can only access data related to their branch
- All authenticated users can view reference data

## Sample Data

The schema includes:
- 4 branches (Head Office, North, South, East)
- 8 sample employees (2 per branch)
- Current leave year (Apr 2025 - Mar 2026)
