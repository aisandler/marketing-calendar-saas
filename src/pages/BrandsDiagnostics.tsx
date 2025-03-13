import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const BrandsDiagnostics = () => {
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [columnInfo, setColumnInfo] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [sampleData, setSampleData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [sqlToExecute, setSqlToExecute] = useState<string>(`
-- Query to generate a brand directly using explicit column names
INSERT INTO brands (name, description) 
VALUES ('Direct SQL Test Brand', 'Description added via direct SQL')
RETURNING *;
  `.trim());

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get table information
      const { data: tableData, error: tableError } = await supabase.rpc('get_table_info', {
        table_name: 'brands'
      });
      
      if (tableError) throw tableError;
      setTableInfo(tableData);
      
      // Get column information
      const { data: columnData, error: columnError } = await supabase.rpc('get_column_info', {
        table_name: 'brands'
      });
      
      if (columnError) throw columnError;
      setColumnInfo(columnData || []);
      
      // Get policy information
      const { data: policyData, error: policyError } = await supabase.rpc('get_policies_info', {
        table_name: 'brands'
      });
      
      if (policyError) throw policyError;
      setPolicies(policyData || []);
      
      // Get sample data
      const { data: sampleData, error: sampleError } = await supabase
        .from('brands')
        .select('*')
        .limit(5);
        
      if (sampleError) throw sampleError;
      setSampleData(sampleData || []);
      
    } catch (error: any) {
      console.error('Error loading diagnostics:', error);
      setError(`Error loading diagnostics: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const executeFixSQL = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('execute_sql', {
        sql_string: sqlToExecute
      });
      
      if (error) throw error;
      
      setResult(JSON.stringify(data, null, 2));
      // Reload diagnostics to show changes
      await loadDiagnostics();
    } catch (error: any) {
      console.error('Error executing SQL:', error);
      setError(`Error executing SQL: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !tableInfo) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Brands Table Diagnostics</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}
        
        <button
          onClick={loadDiagnostics}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm mb-6"
        >
          Refresh Diagnostics
        </button>
        
        <div className="space-y-6">
          {/* Table Information */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Table Information</h2>
            {tableInfo ? (
              <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-40">
                {JSON.stringify(tableInfo, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">No table information available</p>
            )}
          </div>
          
          {/* Column Information */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Column Information</h2>
            {columnInfo.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nullable</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {columnInfo.map((column, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{column.column_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{column.data_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{column.is_nullable}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{column.column_default || 'null'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No column information available</p>
            )}
          </div>
          
          {/* Policy Information */}
          <div>
            <h2 className="text-xl font-semibold mb-2">RLS Policies</h2>
            {policies.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Command</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Using Expression</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">With Check</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {policies.map((policy, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{policy.policy_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{policy.command}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{policy.using_expr}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{policy.with_check || 'null'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No policy information available</p>
            )}
          </div>
          
          {/* Sample Data */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Sample Data</h2>
            {sampleData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sampleData.map((brand, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{brand.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{brand.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{brand.description || 'null'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {brand.created_at ? new Date(brand.created_at).toLocaleString() : 'null'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No sample data available</p>
            )}
          </div>
          
          {/* SQL Execution */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Execute Fix SQL</h2>
            <p className="text-sm text-gray-600 mb-4">
              Use this to execute SQL to fix the brands table. The SQL will be executed with SECURITY DEFINER permissions.
            </p>
            
            <div className="mb-4">
              <textarea
                value={sqlToExecute}
                onChange={(e) => setSqlToExecute(e.target.value)}
                className="w-full h-40 px-3 py-2 text-gray-700 border rounded-lg focus:outline-none font-mono"
                placeholder="Enter SQL to execute"
              />
            </div>
            
            <button
              onClick={executeFixSQL}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow-sm"
            >
              {loading ? 'Executing...' : 'Execute SQL'}
            </button>
            
            {result && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Result:</h3>
                <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-40">
                  {result}
                </pre>
              </div>
            )}
          </div>
          
          {/* Generate Fix SQL */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Fix SQL Suggestions</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">1. Aggressive Description Column Fix</h3>
                <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-40 text-sm">
{`-- Backup brands data
CREATE TABLE IF NOT EXISTS brands_backup AS SELECT * FROM brands;

-- Drop and recreate the description column
ALTER TABLE brands DROP COLUMN IF EXISTS description;
ALTER TABLE brands DROP COLUMN IF EXISTS "Description";
ALTER TABLE brands ADD COLUMN description TEXT;

-- You can copy this SQL to the execute box above to run it`}
                </pre>
                <button
                  onClick={() => setSqlToExecute(`
-- Backup brands data
CREATE TABLE IF NOT EXISTS brands_backup AS SELECT * FROM brands;

-- Drop and recreate the description column
ALTER TABLE brands DROP COLUMN IF EXISTS description;
ALTER TABLE brands DROP COLUMN IF EXISTS "Description";
ALTER TABLE brands ADD COLUMN description TEXT;
                  `.trim())}
                  className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md shadow-sm text-sm"
                >
                  Copy to Execute
                </button>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">2. Disable RLS on Brands Table</h3>
                <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-40 text-sm">
{`-- Temporarily disable RLS
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;

-- You can copy this SQL to the execute box above to run it`}
                </pre>
                <button
                  onClick={() => setSqlToExecute(`
-- Temporarily disable RLS
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
                  `.trim())}
                  className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md shadow-sm text-sm"
                >
                  Copy to Execute
                </button>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">3. Create Stored Function for Brand Insertion</h3>
                <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-40 text-sm">
{`-- Create brand insertion function
CREATE OR REPLACE FUNCTION insert_brand(brand_name TEXT, brand_description TEXT)
RETURNS SETOF brands 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO brands (name, description)
  VALUES (brand_name, brand_description)
  RETURNING *;
END;
$$;

-- You can copy this SQL to the execute box above to run it`}
                </pre>
                <button
                  onClick={() => setSqlToExecute(`
-- Create brand insertion function
CREATE OR REPLACE FUNCTION insert_brand(brand_name TEXT, brand_description TEXT)
RETURNS SETOF brands 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO brands (name, description)
  VALUES (brand_name, brand_description)
  RETURNING *;
END;
$$;
                  `.trim())}
                  className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md shadow-sm text-sm"
                >
                  Copy to Execute
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandsDiagnostics;