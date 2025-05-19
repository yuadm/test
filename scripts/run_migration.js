
// This script will help execute the SQL migration manually
// Since we're having issues with the standard SQL commands

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables or provide defaults
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service role key for admin access

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

// Create Supabase client with service role (admin) permissions
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250519_fix_user_sync.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the migration into separate SQL statements
    const statements = migrationSQL.split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement separately
    for (const [index, statement] of statements.entries()) {
      console.log(`Executing statement ${index + 1}/${statements.length}...`);
      
      const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        console.error(`Error executing statement ${index + 1}:`, error);
      } else {
        console.log(`Statement ${index + 1} executed successfully`);
      }
    }

    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();
