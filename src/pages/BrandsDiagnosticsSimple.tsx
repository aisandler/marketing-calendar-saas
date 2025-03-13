import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const BrandsDiagnosticsSimple = () => {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sqlToExecute, setSqlToExecute] = useState<string>(`
-- Query to generate a brand directly using explicit column names
INSERT INTO brands (name, description) 
VALUES ('Direct SQL Test Brand', 'Description added via direct SQL')
RETURNING *;
  `.trim());

  // SQL options for quick execution
  const fixOptions = [
    {
      name: "1. Add or recreate description column",
      sql: `-- Backup brands data first
CREATE TABLE IF NOT EXISTS brands_backup AS SELECT * FROM brands;

-- Drop and recreate the description column
ALTER TABLE brands 
  DROP COLUMN IF EXISTS description,
  ADD COLUMN description TEXT;

-- Try to insert a brand with description to test
INSERT INTO brands (name, description)
VALUES ('Test Brand With Description', 'This is a test description added after column fix')
RETURNING *;`
    },
    {
      name: "2. Disable RLS on brands table",
      sql: `-- Temporarily disable RLS
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;

-- Test by adding a brand
INSERT INTO brands (name, description)
VALUES ('Test Brand After RLS Disabled', 'This description should work with RLS disabled')
RETURNING *;`
    },
    {
      name: "3. Check brands table structure",
      sql: `-- View table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'brands'
ORDER BY ordinal_position;

-- Check sample data
SELECT * FROM brands LIMIT 5;`
    },
    {
      name: "4. Check RLS policies",
      sql: `-- View RLS policies
SELECT * FROM pg_policies WHERE tablename = 'brands';`
    }
  ];

  const executeSQL = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      // Using a raw query through Supabase's rpc feature
      const { data, error: queryError } = await supabase.rpc(
        'execute_sql_unsafe',
        { sql_query: sqlToExecute }
      ).maybeSingle();
      
      if (queryError) {
        // If the function doesn't exist, try explaining the query instead to check syntax
        try {
          const { data: explainData, error: explainError } = await supabase.from('brands')
            .select('*')
            .limit(1);
            
          if (explainError) throw explainError;
          
          // Show helpful error that function is missing
          throw new Error(
            `The RPC function 'execute_sql_unsafe' doesn't exist. You need to create it first. Error: ${queryError.message}`
          );
        } catch (explainErr) {
          throw queryError;
        }
      }
      
      setResult(JSON.stringify(data || {}, null, 2));
    } catch (err: any) {
      console.error('Error executing SQL:', err);
      setError(`Error: ${err.message || 'Unknown error'}`);
      
      // Add helpful message if it looks like the function is missing
      if (err.message.includes("function") && err.message.includes("does not exist")) {
        setError(`
Function missing: You need to create the execute_sql_unsafe function in your database.

Run this SQL in your Supabase SQL Editor first:

CREATE OR REPLACE FUNCTION execute_sql_unsafe(sql_query TEXT)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE 'DO $do$ BEGIN RAISE NOTICE ''Executing: ' || sql_query || '''; END $do$;';
  EXECUTE 'WITH query_result AS (' || sql_query || ') SELECT COALESCE(jsonb_agg(q), ''[]''::jsonb) FROM query_result q' INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE);
END;
$$;

Then try again.
        `);
      }
    } finally {
      setLoading(false);
    }
  };

  const testBrandCreation = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      // Try direct brand creation through Supabase API
      const { data, error } = await supabase
        .from('brands')
        .insert([
          { 
            name: 'Test Brand via API',
            description: 'This is a test description via direct API call'
          }
        ])
        .select('*');
      
      if (error) throw error;
      
      setResult(JSON.stringify(data || [], null, 2));
    } catch (err: any) {
      console.error('Error creating brand:', err);
      setError(`Error creating brand: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Brands Table Diagnostics (Simple)</h1>
        <p className="text-gray-600 mb-6">
          This page provides a simple interface to diagnose and fix issues with the brands table,
          particularly related to the description column and RLS policies.
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 whitespace-pre-wrap">
            {error}
          </div>
        )}
        
        {/* Direct API Test */}
        <div className="mb-8 p-4 border border-blue-200 rounded-lg bg-blue-50">
          <h2 className="text-lg font-semibold mb-2">Test Direct Brand Creation</h2>
          <p className="text-sm text-gray-600 mb-4">
            This uses the Supabase API to create a brand with description directly, which can help determine if the issue is with the database or the UI.
          </p>
          <button
            onClick={testBrandCreation}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm"
          >
            {loading ? 'Testing...' : 'Test Brand Creation'}
          </button>
        </div>
        
        {/* SQL Execution Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Execute SQL to Fix Issues</h2>
            <p className="text-sm text-gray-600 mb-4">
              The SQL will be executed via a stored procedure with elevated permissions if available, or you can copy these commands to run directly in your Supabase SQL editor.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {fixOptions.map((option, index) => (
                <div 
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer"
                  onClick={() => setSqlToExecute(option.sql)}
                >
                  <h3 className="font-medium">{option.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">Click to load this SQL</p>
                </div>
              ))}
            </div>
            
            <div className="mb-4">
              <textarea
                value={sqlToExecute}
                onChange={(e) => setSqlToExecute(e.target.value)}
                className="w-full h-60 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none font-mono text-sm"
                placeholder="Enter SQL to execute"
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={executeSQL}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow-sm"
              >
                {loading ? 'Executing...' : 'Execute SQL'}
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlToExecute);
                  alert('SQL copied to clipboard!');
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md shadow-sm"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
          
          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Result:</h3>
              <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-80 text-sm">
                {result}
              </pre>
            </div>
          )}
          
          <div className="mt-6 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
            <h3 className="text-lg font-medium mb-2">SQL Function Setup</h3>
            <p className="text-sm mb-4">
              To enable SQL execution directly from this page, you need to create a special function in your database. Copy and run this SQL in your Supabase SQL editor:
            </p>
            <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-60 text-xs">
{`CREATE OR REPLACE FUNCTION execute_sql_unsafe(sql_query TEXT)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE 'DO $do$ BEGIN RAISE NOTICE ''Executing: ' || sql_query || '''; END $do$;';
  EXECUTE 'WITH query_result AS (' || sql_query || ') 
           SELECT COALESCE(jsonb_agg(q), ''[]''::jsonb) 
           FROM query_result q' INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE);
END;
$$;`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandsDiagnosticsSimple;