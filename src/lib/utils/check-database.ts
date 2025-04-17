import { createClient } from '@/lib/supabase/client';

/**
 * Utility function to check the database structure
 * This will query the Supabase database and return information about tables and their columns
 */
export async function checkDatabaseStructure() {
  const supabase = createClient();
  
  try {
    // Use a more direct approach with any type to bypass TypeScript checking
    const { data: tables, error: tablesError } = await (supabase as any)
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return { error: tablesError.message };
    }
    
    if (!tables || tables.length === 0) {
      return { error: 'No tables found in the public schema.' };
    }
    
    // For each table, get its columns and structure
    const tableStructures = [];
    
    for (const table of tables) {
      const tableName = table.tablename;
      
      // Get columns for this table
      const { data: columns, error: columnsError } = await (supabase as any)
        .rpc('get_table_columns', { table_name: tableName });
      
      if (columnsError) {
        console.error(`Error fetching columns for table ${tableName}:`, columnsError);
        tableStructures.push({
          name: tableName,
          error: columnsError.message
        });
        continue;
      }
      
      // Get row count for this table
      const { count, error: countError } = await (supabase as any)
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      tableStructures.push({
        name: tableName,
        columns: columns || [],
        rowCount: count || 0,
        error: countError ? countError.message : null
      });
    }
    
    return { tables: tableStructures };
  } catch (error) {
    console.error('Error checking database structure:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Alternative function to check database using a simpler approach
 * This will just try to select data from each expected table
 */
export async function checkExpectedTables() {
  const supabase = createClient();
  const expectedTables = [
    'branches',
    'users',
    'employees',
    'leave_years',
    'leaves',
    'archived_leaves'
  ];
  
  // Create a results object to store the status of each table
  const results: any = {};
  
  for (const tableName of expectedTables) {
    try {
      // Special handling for users table to avoid infinite recursion
      if (tableName === 'users') {
        // Check if the table exists without triggering RLS
        const { data: tableExists } = await (supabase as any).rpc('table_exists', { table_name: 'users' });
        
        if (tableExists) {
          results[tableName] = {
            exists: true,
            rowCount: 0,
            error: null,
            sample: null
          };
        } else {
          results[tableName] = {
            exists: false,
            error: 'Table does not exist'
          };
        }
        continue;
      }
      
      // For other tables, try to get a single row
      const { data, error, count } = await (supabase as any)
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(1);
      
      results[tableName] = {
        exists: !error,
        rowCount: count || 0,
        error: error ? error.message : null,
        sample: data && data.length > 0 ? data[0] : null
      };
    } catch (error) {
      results[tableName] = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  return results;
}
