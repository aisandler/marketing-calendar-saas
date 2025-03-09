import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: Supabase URL and service role key are required.');
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file.');
  console.error('You can find this in your Supabase dashboard under Project Settings > API > service_role key');
  process.exit(1);
}

// Create Supabase client with service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Function to run SQL file
async function runSqlFile(filePath) {
  try {
    console.log(`Reading SQL file: ${filePath}`);
    
    // Read the SQL file
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    console.log('Executing SQL...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });
    
    if (error) {
      throw error;
    }
    
    console.log('SQL executed successfully!');
    console.log('Result:', data);
    
    return data;
  } catch (error) {
    console.error('Error executing SQL:', error);
    
    // Check if the exec_sql function doesn't exist
    if (error.message && error.message.includes('function "exec_sql" does not exist')) {
      console.log('The exec_sql function does not exist. Creating it...');
      
      // Create the exec_sql function
      const createFunctionSql = fs.readFileSync(path.resolve(process.cwd(), 'create_exec_sql_function.sql'), 'utf8');
      
      // Execute the SQL to create the function
      const { error: createFunctionError } = await supabase.rpc('exec_sql', { sql_query: createFunctionSql });
      
      if (createFunctionError) {
        console.error('Error creating exec_sql function:', createFunctionError);
        process.exit(1);
      }
      
      console.log('exec_sql function created successfully! Retrying the original SQL...');
      
      // Retry the original SQL
      return runSqlFile(filePath);
    }
    
    process.exit(1);
  }
}

// Check if a file path was provided
if (process.argv.length < 3) {
  console.error('Error: Please provide a SQL file path.');
  console.error('Usage: node runSql.js <sql_file_path>');
  process.exit(1);
}

// Get the SQL file path from command line arguments
const sqlFilePath = process.argv[2];

// Run the SQL file
runSqlFile(sqlFilePath); 