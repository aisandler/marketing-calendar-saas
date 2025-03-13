import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Edit, Trash } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  description: string | null;
  description2: string | null; // Added new field for description2
  created_at: string;
}

const BrandsManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const canManageBrands = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setBrands(data);
    } catch (error: any) {
      console.error('Error fetching brands:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canManageBrands) return;
    
    try {
      setLoading(true);
      
      // First try with raw SQL approach through RPC for description2
      if (formData.description) {
        try {
          // Try using RPC to execute SQL directly (if available)
          console.log('Trying RPC approach with name and description2');
          const { data: rpcData, error: rpcError } = await supabase.rpc('insert_brand_with_description2', {
            brand_name: formData.name,
            brand_description: formData.description
          });
          
          if (!rpcError) {
            console.log('RPC success with description2:', rpcData);
            // Refresh brands list
            fetchBrands();
            setFormData({ name: '', description: '' });
            setIsAddModalOpen(false);
            return;
          } else {
            console.log('RPC approach with description2 failed, falling back to standard insert');
          }
        } catch (rpcError) {
          console.log('RPC approach with description2 error:', rpcError);
          // Continue to standard approach
        }
      }
      
      // Standard approach with proper object
      console.log('Trying standard insert with description2');
      const brandData: any = {
        name: formData.name,
      };
      
      if (formData.description) {
        // Use description2 instead of description
        brandData.description2 = formData.description;
      }
      
      console.log('Adding brand with data:', brandData);
      
      const { data, error } = await supabase
        .from('brands')
        .insert([brandData])
        .select('*');
      
      if (error) throw error;
      
      setBrands([...brands, data[0] as Brand]);
      setFormData({ name: '', description: '' });
      setIsAddModalOpen(false);
    } catch (error: any) {
      console.error('Error adding brand:', error);
      setError(error.message);
      
      // If it failed, let's try to insert with just the name as a fallback
      if (formData.name) {
        try {
          console.log('Trying fallback with name only');
          const { data, error: fallbackError } = await supabase
            .from('brands')
            .insert([{ name: formData.name }])
            .select('*');
            
          if (fallbackError) throw fallbackError;
          
          setBrands([...brands, data[0] as Brand]);
          setFormData({ name: '', description: '' });
          setIsAddModalOpen(false);
          setError('Brand added with name only (description was skipped)');
        } catch (fallbackError: any) {
          console.error('Error with fallback brand add:', fallbackError);
          setError(`Original error: ${error.message}. Fallback error: ${fallbackError.message}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canManageBrands || !currentBrand) return;
    
    try {
      setLoading(true);
      
      // First try with minimal fields to avoid schema issues
      const updateData: any = {
        name: formData.name
      };
      
      // Only add description2 if it has a value
      if (formData.description) {
        updateData.description2 = formData.description;
      }
      
      console.log('Updating brand with data (using description2):', updateData);
      
      const { data, error } = await supabase
        .from('brands')
        .update(updateData)
        .eq('id', currentBrand.id)
        .select('*');
      
      if (error) throw error;
      
      setBrands(brands.map(b => 
        b.id === currentBrand.id ? (data[0] as Brand) : b
      ));
      
      setFormData({ name: '', description: '' });
      setCurrentBrand(null);
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error('Error updating brand:', error);
      setError(error.message);
      
      // If it failed, let's try to update with just the name as a fallback
      try {
        console.log('Trying fallback with name only');
        const { data, error: fallbackError } = await supabase
          .from('brands')
          .update({ name: formData.name })
          .eq('id', currentBrand!.id)
          .select('*');
          
        if (fallbackError) throw fallbackError;
        
        setBrands(brands.map(b => 
          b.id === currentBrand!.id ? (data[0] as Brand) : b
        ));
        
        setFormData({ name: '', description: '' });
        setCurrentBrand(null);
        setIsEditModalOpen(false);
        setError('Brand updated with name only (description was skipped)');
      } catch (fallbackError: any) {
        console.error('Error with fallback brand update:', fallbackError);
        setError(`Original error: ${error.message}. Fallback error: ${fallbackError.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBrand = async () => {
    if (!canManageBrands || !currentBrand) return;
    
    try {
      setLoading(true);
      
      // Try using the safe delete function if it exists
      try {
        console.log('Attempting to delete brand with safe_delete_brand function');
        const { data, error } = await supabase.rpc('safe_delete_brand', {
          brand_uuid: currentBrand.id
        });
        
        if (error) throw error;
        
        console.log('Brand deleted successfully with safe function');
        setBrands(brands.filter(b => b.id !== currentBrand.id));
        setCurrentBrand(null);
        setIsDeleteModalOpen(false);
        return;
      } catch (rpcError: any) {
        console.log('Safe delete function failed or does not exist, falling back to standard method');
        if (rpcError.message && 
            (rpcError.message.includes('used in one or more briefs') ||
             rpcError.message.includes('used in one or more campaigns'))) {
          throw rpcError;
        }
        // Continue to standard approach if RPC doesn't exist
      }
      
      // Standard approach with manual checks
      console.log('Using standard delete approach with type safety');
      
      // Convert ID to proper UUID for comparison to avoid type errors
      const brandIdString = currentBrand.id.toString();
      
      // Check if the brand is used in briefs
      const { data: briefsData, error: briefsError } = await supabase
        .from('briefs')
        .select('id')
        .filter('brand_id', 'eq', brandIdString)
        .limit(1);
      
      if (briefsError) throw briefsError;
      
      if (briefsData && briefsData.length > 0) {
        throw new Error('Cannot delete this brand because it is used in one or more briefs.');
      }
      
      // Check if the brand is used in campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id')
        .filter('brand_id', 'eq', brandIdString)
        .limit(1);
      
      if (campaignsError) throw campaignsError;
      
      if (campaignsData && campaignsData.length > 0) {
        throw new Error('Cannot delete this brand because it is used in one or more campaigns.');
      }
      
      // As a last resort, try with direct SQL
      try {
        const { data, error } = await supabase.rpc('execute_sql_unsafe', {
          sql_query: `DELETE FROM brands WHERE id = '${brandIdString}' RETURNING *`
        });
        
        if (error) throw error;
        
        console.log('Brand deleted with direct SQL');
        setBrands(brands.filter(b => b.id !== currentBrand.id));
        setCurrentBrand(null);
        setIsDeleteModalOpen(false);
        return;
      } catch (sqlError: any) {
        console.error('Direct SQL delete error:', sqlError);
        // Continue to standard approach if SQL execution fails
      }
      
      // Proceed with standard deletion as a last resort
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', currentBrand.id);
      
      if (error) throw error;
      
      setBrands(brands.filter(b => b.id !== currentBrand.id));
      setCurrentBrand(null);
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      console.error('Error deleting brand:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (brand: Brand) => {
    setCurrentBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description2 || brand.description || ''
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (brand: Brand) => {
    setCurrentBrand(brand);
    setIsDeleteModalOpen(true);
  };

  if (loading && brands.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Brands</h2>
            <p className="text-gray-600 mt-1">Manage brands for marketing campaigns and briefs</p>
          </div>
          
          <div>
            {canManageBrands && (
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="px-3 py-2"
              >
                <Plus className="h-5 w-5" />
                <span className="ml-2">Add Brand</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <div className={`border px-4 py-3 rounded-md relative ${
          error.includes('description was skipped') 
            ? "bg-yellow-50 border-yellow-200 text-yellow-700" 
            : "bg-red-50 border-red-200 text-red-700"
        }`}>
          <strong>{error.includes('description was skipped') ? 'Notice:' : 'Error:'}</strong> {error}
          <button
            className="absolute top-0 right-0 p-3"
            onClick={() => setError(null)}
          >
            &times;
          </button>
        </div>
      )}
      
      {/* Brands List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              {canManageBrands && (
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {brands.length > 0 ? (
              brands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{brand.description2 || brand.description || 'No description'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(brand.created_at).toLocaleDateString()}
                  </td>
                  {canManageBrands && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        onClick={() => openEditModal(brand)}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => openDeleteModal(brand)}
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={canManageBrands ? 4 : 3} className="px-6 py-4 text-center text-sm text-gray-500">
                  No brands found. {canManageBrands && "Use the 'Add Brand' button to create one."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add Brand Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Brand</h3>
            
            <form onSubmit={handleAddBrand}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Brand'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Brand Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Brand</h3>
            
            <form onSubmit={handleEditBrand}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Brand'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Brand</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{currentBrand?.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                variant="destructive"
                onClick={handleDeleteBrand}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Brand'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandsManagement;