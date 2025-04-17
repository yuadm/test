import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client function to be called at runtime
const initSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key must be provided in environment variables');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

// Define interface for table results
interface TableResult {
  exists: boolean;
  rowCount?: number;
  sample?: any | null;
  error?: string | null;
}

interface TableResults {
  [tableName: string]: TableResult;
}

export async function GET() {
  try {
    // Initialize Supabase client at runtime
    const supabase = initSupabase();
    
    // Get list of tables in the public schema
    const { data: tableList, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tableError) {
      return NextResponse.json({ error: tableError.message }, { status: 500 });
    }

    // Expected tables for the Annual Leave Management System
    const expectedTables = [
      'branches',
      'users',
      'employees',
      'leave_years',
      'leaves',
      'archived_leaves'
    ];

    // Check each expected table
    const tableResults: TableResults = {};
    
    for (const tableName of expectedTables) {
      // Check if table exists in the list
      const tableExists = tableList?.some(t => t.table_name === tableName);
      
      if (tableExists) {
        // Get row count and sample data
        const { data, count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(1);
          
        tableResults[tableName] = {
          exists: true,
          rowCount: count || 0,
          sample: data && data.length > 0 ? data[0] : null,
          error: error ? error.message : null
        };
      } else {
        tableResults[tableName] = {
          exists: false,
          error: 'Table does not exist'
        };
      }
    }
    
    return NextResponse.json({ 
      tables: tableResults,
      allTablesExist: expectedTables.every(table => tableResults[table]?.exists)
    });
  } catch (error) {
    console.error('Error checking database:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
