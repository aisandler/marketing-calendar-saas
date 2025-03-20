// Fix for the history table mismatch issue
// This script updates the history handling in the Supabase database

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or service role key');
  console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
  process.exit(1);
}

console.log('Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixHistoryTables() {
  console.log('Starting history table fix...');
  
  try {
    // First check if the exec_sql function exists
    let rpcError = null;
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: 'SELECT 1;' 
      });
      rpcError = error;
    } catch (e) {
      rpcError = e;
    }
    
    if (rpcError) {
      console.log('The exec_sql RPC function is not available. Trying direct SQL execution...');
      console.log('RPC error:', rpcError);
      
      // Since we can't use RPC or direct SQL execution, provide manual instructions
      console.log('\n\n----------------------------------------------------');
      console.log('MANUAL FIX INSTRUCTIONS:');
      console.log('----------------------------------------------------');
      console.log('1. Go to the Supabase dashboard for your project');
      console.log('2. Navigate to the SQL Editor');
      console.log('3. Create a new query and paste the following SQL:');
      console.log(`
CREATE OR REPLACE FUNCTION handle_brief_history()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Try to get the current user ID from auth.uid()
        BEGIN
            -- First attempt to get from auth.uid()
            SELECT auth.uid() INTO current_user_id;
        EXCEPTION WHEN OTHERS THEN
            -- Fall back to the brief's creator
            current_user_id := NULL;
        END;
        
        -- If we couldn't get the auth.uid(), use the creator of the brief
        IF current_user_id IS NULL THEN
            current_user_id := NEW.created_by;
            
            -- If we still don't have a valid user, use the approver_id if available
            IF current_user_id IS NULL AND NEW.approver_id IS NOT NULL THEN
                current_user_id := NEW.approver_id;
            END IF;
        END IF;
        
        -- Insert into the 'history' table that the application is using
        IF current_user_id IS NOT NULL THEN
            INSERT INTO public.history (
                brief_id,
                changed_by,
                previous_state,
                new_state,
                created_at
            ) VALUES (
                NEW.id,
                current_user_id,
                row_to_json(OLD),
                row_to_json(NEW),
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure there's a correct trigger on the briefs table
DROP TRIGGER IF EXISTS brief_history_trigger ON public.briefs;

CREATE TRIGGER brief_history_trigger
    AFTER UPDATE ON public.briefs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_brief_history();
      `);
      console.log('4. Run the query');
      console.log('----------------------------------------------------');
      return;
    } else {
      // Execute our SQL directly using the rpc function
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: `
          -- Update the trigger function to use the 'history' table instead of 'brief_history'
          CREATE OR REPLACE FUNCTION handle_brief_history()
          RETURNS TRIGGER AS $$
          DECLARE
              current_user_id UUID;
          BEGIN
              IF TG_OP = 'UPDATE' THEN
                  -- Try to get the current user ID from auth.uid()
                  BEGIN
                      -- First attempt to get from auth.uid()
                      SELECT auth.uid() INTO current_user_id;
                  EXCEPTION WHEN OTHERS THEN
                      -- Fall back to the brief's creator
                      current_user_id := NULL;
                  END;
                  
                  -- If we couldn't get the auth.uid(), use the creator of the brief
                  IF current_user_id IS NULL THEN
                      current_user_id := NEW.created_by;
                      
                      -- If we still don't have a valid user, use the approver_id if available
                      IF current_user_id IS NULL AND NEW.approver_id IS NOT NULL THEN
                          current_user_id := NEW.approver_id;
                      END IF;
                  END IF;
                  
                  -- Insert into the 'history' table that the application is using
                  IF current_user_id IS NOT NULL THEN
                      INSERT INTO public.history (
                          brief_id,
                          changed_by,
                          previous_state,
                          new_state,
                          created_at
                      ) VALUES (
                          NEW.id,
                          current_user_id,
                          row_to_json(OLD),
                          row_to_json(NEW),
                          NOW()
                      );
                  END IF;
              END IF;
              
              RETURN NEW;
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
          
          -- Make sure there's a correct trigger on the briefs table
          DROP TRIGGER IF EXISTS brief_history_trigger ON public.briefs;
          
          CREATE TRIGGER brief_history_trigger
              AFTER UPDATE ON public.briefs
              FOR EACH ROW
              EXECUTE FUNCTION public.handle_brief_history();
        `
      });
      
      if (error) {
        console.error('Error updating trigger function with RPC:', error);
        process.exit(1);
      }
      
      console.log('History tables fix completed successfully via RPC!');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

// Run the fix
fixHistoryTables(); 