import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

const DiagnosticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resourcesColumns, setResourcesColumns] = useState<TableColumn[]>([]);
  const [briefsColumns, setBriefsColumns] = useState<TableColumn[]>([]);
  const [brandsColumns, setBrandsColumns] = useState<TableColumn[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [sampleBrief, setSampleBrief] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get schema for resources table
        const { data: resourcesCols, error: resourcesErr } = await supabase.rpc(
          'describe_table',
          { name: 'resources' }
        );
        
        if (resourcesErr) throw new Error(`Resources schema error: ${resourcesErr.message}`);
        setResourcesColumns(resourcesCols || []);

        // Get schema for briefs table
        const { data: briefsCols, error: briefsErr } = await supabase.rpc(
          'describe_table',
          { name: 'briefs' }
        );
        
        if (briefsErr) throw new Error(`Briefs schema error: ${briefsErr.message}`);
        setBriefsColumns(briefsCols || []);

        // Get schema for brands table
        const { data: brandsCols, error: brandsErr } = await supabase.rpc(
          'describe_table',
          { name: 'brands' }
        );
        
        if (brandsErr) throw new Error(`Brands schema error: ${brandsErr.message}`);
        setBrandsColumns(brandsCols || []);

        // Get sample brands
        const { data: brandsData, error: brandsDataErr } = await supabase
          .from('brands')
          .select('*')
          .limit(5);
        
        if (brandsDataErr) throw new Error(`Brands data error: ${brandsDataErr.message}`);
        setBrands(brandsData || []);

        // Get sample brief
        const { data: briefData, error: briefDataErr } = await supabase
          .from('briefs')
          .select('*')
          .limit(1)
          .single();
        
        if (!briefDataErr) {
          setSampleBrief(briefData);
        }

      } catch (err: any) {
        console.error('Error in diagnostics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to format SQL statements
  const formatSQL = (sql: string) => {
    return sql.split(';').map(statement => statement.trim()).filter(Boolean);
  };

  // SQL scripts to fix the database
  const fixResourcesSQL = `
    -- Add missing columns to resources table
    ALTER TABLE resources ADD COLUMN IF NOT EXISTS capacity_hours NUMERIC DEFAULT 40;
    ALTER TABLE resources ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT NULL;
    ALTER TABLE resources ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT NULL;
    ALTER TABLE resources ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id);
  `;

  const fixBriefsSQL = `
    -- Add missing columns to briefs table
    ALTER TABLE briefs ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES resources(id);
    ALTER TABLE briefs ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);
    ALTER TABLE briefs ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id);
  `;

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Database Diagnostics</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Diagnostics</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-600">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Database Schema Information</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resources Table */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-medium mb-2">Resources Table</h3>
            {resourcesColumns.length > 0 ? (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left text-sm font-semibold text-gray-700">Column</th>
                    <th className="px-2 py-1 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-2 py-1 text-left text-sm font-semibold text-gray-700">Nullable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {resourcesColumns.map((col, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-2 py-1 text-sm text-gray-900">{col.column_name}</td>
                      <td className="px-2 py-1 text-sm text-gray-500">{col.data_type}</td>
                      <td className="px-2 py-1 text-sm text-gray-500">{col.is_nullable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No columns found or table doesn't exist.</p>
            )}
            
            {/* Check for missing columns */}
            {!resourcesColumns.some(col => col.column_name === 'capacity_hours') && (
              <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
                <p>Missing <strong>capacity_hours</strong> column.</p>
              </div>
            )}
          </div>
          
          {/* Briefs Table */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-medium mb-2">Briefs Table</h3>
            {briefsColumns.length > 0 ? (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left text-sm font-semibold text-gray-700">Column</th>
                    <th className="px-2 py-1 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-2 py-1 text-left text-sm font-semibold text-gray-700">Nullable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {briefsColumns.map((col, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-2 py-1 text-sm text-gray-900">{col.column_name}</td>
                      <td className="px-2 py-1 text-sm text-gray-500">{col.data_type}</td>
                      <td className="px-2 py-1 text-sm text-gray-500">{col.is_nullable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No columns found or table doesn't exist.</p>
            )}
            
            {/* Check for missing columns */}
            {!briefsColumns.some(col => col.column_name === 'resource_id') && (
              <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
                <p>Missing <strong>resource_id</strong> column.</p>
              </div>
            )}
            
            {!briefsColumns.some(col => col.column_name === 'brand_id') && (
              <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
                <p>Missing <strong>brand_id</strong> column.</p>
              </div>
            )}
          </div>
          
          {/* Brands Table */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-medium mb-2">Brands Table</h3>
            {brandsColumns.length > 0 ? (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left text-sm font-semibold text-gray-700">Column</th>
                    <th className="px-2 py-1 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-2 py-1 text-left text-sm font-semibold text-gray-700">Nullable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {brandsColumns.map((col, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-2 py-1 text-sm text-gray-900">{col.column_name}</td>
                      <td className="px-2 py-1 text-sm text-gray-500">{col.data_type}</td>
                      <td className="px-2 py-1 text-sm text-gray-500">{col.is_nullable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500">No columns found or table doesn't exist.</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Available Data</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Brands */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-medium mb-2">Brands</h3>
            {brands.length > 0 ? (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left text-sm font-semibold text-gray-700">ID</th>
                    <th className="px-2 py-1 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-2 py-1 text-left text-sm font-semibold text-gray-700">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {brands.map((brand, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-2 py-1 text-sm text-gray-500">{brand.id}</td>
                      <td className="px-2 py-1 text-sm text-gray-900">{brand.name}</td>
                      <td className="px-2 py-1 text-sm text-gray-500">{brand.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-yellow-600">No brands found. You need to create at least one brand.</p>
            )}
          </div>
          
          {/* Sample Brief */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-medium mb-2">Sample Brief</h3>
            {sampleBrief ? (
              <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-64">
                {JSON.stringify(sampleBrief, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">No briefs found.</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Fix Database Schema</h2>
        
        <div className="space-y-6">
          {/* Fix Resources */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-medium mb-2">Fix Resources Table</h3>
            
            <div className="bg-gray-50 p-4 rounded mb-4">
              <h4 className="text-sm font-medium mb-2">SQL to Run:</h4>
              {formatSQL(fixResourcesSQL).map((sql, i) => (
                <div key={i} className="mb-2">
                  <code className="block bg-gray-100 p-2 rounded text-sm overflow-x-auto">{sql}</code>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-50 p-4 rounded text-blue-700">
              <p className="text-sm">
                Run each of these SQL statements individually in the Supabase SQL editor.
                This will add missing columns to the resources table.
              </p>
            </div>
          </div>
          
          {/* Fix Briefs */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-medium mb-2">Fix Briefs Table</h3>
            
            <div className="bg-gray-50 p-4 rounded mb-4">
              <h4 className="text-sm font-medium mb-2">SQL to Run:</h4>
              {formatSQL(fixBriefsSQL).map((sql, i) => (
                <div key={i} className="mb-2">
                  <code className="block bg-gray-100 p-2 rounded text-sm overflow-x-auto">{sql}</code>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-50 p-4 rounded text-blue-700">
              <p className="text-sm">
                Run each of these SQL statements individually in the Supabase SQL editor.
                This will add missing columns to the briefs table.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticsPage;