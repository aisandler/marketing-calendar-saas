import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const SimpleBrands = () => {
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setBrands(data || []);
    } catch (error: any) {
      console.error('Error fetching brands:', error);
      setError(`Error fetching brands: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Try with direct SQL first
      const { data: sqlData, error: sqlError } = await supabase.rpc('execute_sql_unsafe', {
        sql_query: `
          INSERT INTO brands (name, description2) 
          VALUES ('${name.replace(/'/g, "''")}', '${description.replace(/'/g, "''")}')
          RETURNING *
        `
      });
      
      if (!sqlError) {
        console.log('Brand added with SQL:', sqlData);
        setName('');
        setDescription('');
        fetchBrands();
        return;
      }
      
      // If SQL fails, try standard API
      console.log('SQL insertion failed, trying standard API');
      
      const { data, error } = await supabase
        .from('brands')
        .insert([
          { 
            name, 
            description2: description 
          }
        ])
        .select();
      
      if (error) throw error;
      
      console.log('Brand added:', data);
      setName('');
      setDescription('');
      fetchBrands();
    } catch (error: any) {
      console.error('Error adding brand:', error);
      setError(`Error adding brand: ${error.message}`);
      
      // Try name-only as last resort
      try {
        const { data, error: nameOnlyError } = await supabase
          .from('brands')
          .insert([{ name }])
          .select();
          
        if (nameOnlyError) throw nameOnlyError;
        
        console.log('Brand added with name only:', data);
        setName('');
        setDescription('');
        setError('Brand added with name only (description was skipped)');
        fetchBrands();
      } catch (fallbackError: any) {
        console.error('Even name-only insert failed:', fallbackError);
        setError(`All insertion attempts failed. Last error: ${fallbackError.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteBrand = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Try with direct SQL first
      try {
        const { data, error } = await supabase.rpc('execute_sql_unsafe', {
          sql_query: `
            DELETE FROM brands 
            WHERE id = '${id}'
            RETURNING *
          `
        });
        
        if (error) throw error;
        
        console.log('Brand deleted with SQL:', data);
        fetchBrands();
        return;
      } catch (sqlError: any) {
        console.log('SQL deletion failed, trying standard API:', sqlError);
      }
      
      // Standard API
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      console.log('Brand deleted');
      fetchBrands();
    } catch (error: any) {
      console.error('Error deleting brand:', error);
      
      if (error.message.includes('foreign key constraint') || 
          error.message.includes('violates foreign key constraint')) {
        setError('Cannot delete this brand because it is used in briefs or campaigns.');
      } else {
        setError(`Error deleting brand: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Simple Brands Management</h1>
      
      {error && (
        <div className={`mb-6 p-4 rounded-md ${error.includes('(description was skipped)') ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-700'}`}>
          {error}
        </div>
      )}
      
      <form onSubmit={addBrand} className="mb-8 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Add New Brand</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brand Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={3}
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !name}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
        >
          {loading ? 'Adding...' : 'Add Brand'}
        </button>
      </form>
      
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Brands</h2>
        
        {loading && brands.length === 0 ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="mt-2 text-gray-500">Loading brands...</p>
          </div>
        ) : brands.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 px-4 border-b text-left">Name</th>
                  <th className="py-2 px-4 border-b text-left">Description</th>
                  <th className="py-2 px-4 border-b text-left">Created</th>
                  <th className="py-2 px-4 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{brand.name}</td>
                    <td className="py-2 px-4 border-b">
                      {brand.description2 || brand.description || <span className="text-gray-400">No description</span>}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {new Date(brand.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 border-b text-right">
                      <button
                        onClick={() => deleteBrand(brand.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-4 text-gray-500">No brands found</p>
        )}
      </div>
    </div>
  );
};

export default SimpleBrands;