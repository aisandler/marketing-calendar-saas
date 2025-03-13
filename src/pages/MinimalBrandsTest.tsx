import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const MinimalBrandsTest = () => {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [brandName, setBrandName] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);

  // Fetch brands on load
  useEffect(() => {
    fetchBrands();
    fetchTableInfo();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setBrands(data || []);
    } catch (err: any) {
      console.error('Error fetching brands:', err);
      setError(`Error fetching brands: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableInfo = async () => {
    try {
      // Directly use RPC to get table info
      const { data: columnsData, error: columnsError } = await supabase.rpc(
        'execute_sql_unsafe',
        {
          sql_query: `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'brands'
            ORDER BY ordinal_position
          `
        }
      );

      if (columnsError) {
        console.log('Error fetching columns via RPC, falling back to regular query');
        // Fallback - use regular query to get sample data which gives us column info
        const { data, error } = await supabase
          .from('brands')
          .select('*')
          .limit(1);
          
        if (error) throw error;
        if (data && data.length > 0) {
          setTableInfo({
            inferred_columns: Object.keys(data[0]).map(name => ({
              column_name: name,
              data_type: typeof data[0][name],
              inferred: true
            }))
          });
        }
      } else {
        setTableInfo({ columns: columnsData });
      }
    } catch (err: any) {
      console.error('Error fetching table info:', err);
    }
  };

  const addBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setApiResponse(null);

    try {
      // Use simple approach with minimal fields
      const { data, error } = await supabase
        .from('brands')
        .insert([
          {
            name: brandName,
            description: brandDescription
          }
        ])
        .select();

      if (error) throw error;

      setSuccessMessage(`Brand "${brandName}" added successfully with description!`);
      setApiResponse(data);
      setBrandName('');
      setBrandDescription('');
      fetchBrands(); // Refresh list
    } catch (err: any) {
      console.error('Error adding brand:', err);
      setError(`Error adding brand: ${err.message}`);
      
      try {
        // Try name-only approach as fallback
        const { data, error: fallbackError } = await supabase
          .from('brands')
          .insert([
            { name: brandName }
          ])
          .select();
          
        if (fallbackError) throw fallbackError;
        
        setSuccessMessage(`Brand added with name only (description was skipped)`);
        setApiResponse(data);
        setBrandName('');
        setBrandDescription('');
        fetchBrands(); // Refresh list
      } catch (fallbackErr: any) {
        setError(`First error: ${err.message}, Fallback error: ${fallbackErr.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to insert with raw SQL via execute_sql_unsafe
  const addBrandWithSQL = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setApiResponse(null);

    try {
      const { data, error } = await supabase.rpc(
        'execute_sql_unsafe',
        {
          sql_query: `
            INSERT INTO brands (name, description)
            VALUES ('${brandName.replace(/'/g, "''")}', '${brandDescription.replace(/'/g, "''")}')
            RETURNING *
          `
        }
      );

      if (error) throw error;

      setSuccessMessage(`Brand "${brandName}" added successfully with SQL!`);
      setApiResponse(data);
      setBrandName('');
      setBrandDescription('');
      fetchBrands(); // Refresh list
    } catch (err: any) {
      console.error('Error adding brand with SQL:', err);
      setError(`Error adding brand with SQL: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test raw INSERT without a description
  const addBrandNameOnly = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setApiResponse(null);

    try {
      const { data, error } = await supabase
        .from('brands')
        .insert([
          { name: brandName }
        ])
        .select();

      if (error) throw error;

      setSuccessMessage(`Brand "${brandName}" added successfully (name only)!`);
      setApiResponse(data);
      setBrandName('');
      setBrandDescription('');
      fetchBrands(); // Refresh list
    } catch (err: any) {
      console.error('Error adding brand (name only):', err);
      setError(`Error adding brand (name only): ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6">Minimal Brands Test</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6">
            {successMessage}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Add Brand (Standard API)</h2>
            <form onSubmit={addBrand} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={brandDescription}
                  onChange={(e) => setBrandDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                >
                  {loading ? 'Adding...' : 'Add Brand with Description'}
                </button>
                
                <button
                  type="button"
                  onClick={addBrandNameOnly}
                  disabled={loading}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                >
                  Add Name Only
                </button>
              </div>
            </form>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Add Brand (Direct SQL)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={brandDescription}
                  onChange={(e) => setBrandDescription(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
              
              <button
                onClick={addBrandWithSQL}
                disabled={loading || !brandName}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md"
              >
                {loading ? 'Adding...' : 'Add Brand with SQL'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Table Information */}
        {tableInfo && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Table Structure</h2>
            <div className="overflow-x-auto bg-gray-50 p-4 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Column Name</th>
                    <th className="px-4 py-2 text-left">Data Type</th>
                    <th className="px-4 py-2 text-left">Nullable</th>
                  </tr>
                </thead>
                <tbody>
                  {tableInfo.columns ? (
                    tableInfo.columns.map((col: any, i: number) => (
                      <tr key={i} className={col.column_name === 'description' ? 'bg-yellow-100' : ''}>
                        <td className="px-4 py-2">{col.column_name}</td>
                        <td className="px-4 py-2">{col.data_type}</td>
                        <td className="px-4 py-2">{col.is_nullable}</td>
                      </tr>
                    ))
                  ) : tableInfo.inferred_columns ? (
                    tableInfo.inferred_columns.map((col: any, i: number) => (
                      <tr key={i} className={col.column_name === 'description' ? 'bg-yellow-100' : ''}>
                        <td className="px-4 py-2">{col.column_name}</td>
                        <td className="px-4 py-2">{col.data_type} (inferred)</td>
                        <td className="px-4 py-2">Unknown</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-center text-gray-500">
                        No column information available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* API Response */}
        {apiResponse && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">API Response</h2>
            <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-40 text-sm">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
        
        {/* Brands List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Brands</h2>
            <button
              onClick={fetchBrands}
              disabled={loading}
              className="text-blue-500 hover:text-blue-600"
            >
              Refresh
            </button>
          </div>
          
          {brands.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {brands.map(brand => (
                    <tr key={brand.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {brand.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {brand.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {brand.description || <span className="text-red-400">No description</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(brand.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No brands found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinimalBrandsTest;