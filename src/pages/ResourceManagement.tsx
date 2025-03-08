import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Edit, Trash, Users, Download } from 'lucide-react';
import type { Resource, Brief } from '../types';

const ResourceManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'internal' as Resource['type']
  });

  // Check if user has permission
  const canManageResources = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        
        // Fetch resources
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('*')
          .order('name');
        
        if (resourcesError) throw resourcesError;
        
        // Fetch briefs for resource utilization
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select('*');
          
        if (briefsError) throw briefsError;
        
        setResources(resourcesData as Resource[]);
        setBriefs(briefsData as Brief[]);
      } catch (error: any) {
        console.error('Error fetching resources:', error);
        setError(error.message || 'Failed to load resources.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResources();
  }, []);

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canManageResources) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('resources')
        .insert([
          {
            name: formData.name,
            type: formData.type,
            created_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Update resources list
      setResources([...resources, data[0] as Resource]);
      
      // Reset form and close modal
      setFormData({ name: '', type: 'internal' });
      setIsAddModalOpen(false);
    } catch (error: any) {
      console.error('Error adding resource:', error);
      setError(error.message || 'Failed to add resource.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditResource = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canManageResources || !currentResource) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('resources')
        .update({
          name: formData.name,
          type: formData.type
        })
        .eq('id', currentResource.id)
        .select();
      
      if (error) throw error;
      
      // Update resources list
      setResources(resources.map(r => 
        r.id === currentResource.id ? (data[0] as Resource) : r
      ));
      
      // Reset form and close modal
      setFormData({ name: '', type: 'internal' });
      setCurrentResource(null);
      setIsEditModalOpen(false);
    } catch (error: any) {
      console.error('Error updating resource:', error);
      setError(error.message || 'Failed to update resource.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResource = async () => {
    if (!canManageResources || !currentResource) return;
    
    try {
      setLoading(true);
      
      // Check if resource is used in any briefs
      const resourceBriefs = briefs.filter(b => b.resource_id === currentResource.id);
      
      if (resourceBriefs.length > 0) {
        throw new Error('Cannot delete resource that is assigned to briefs');
      }
      
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', currentResource.id);
      
      if (error) throw error;
      
      // Update resources list
      setResources(resources.filter(r => r.id !== currentResource.id));
      
      // Reset and close modal
      setCurrentResource(null);
      setIsDeleteModalOpen(false);
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      setError(error.message || 'Failed to delete resource.');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (resource: Resource) => {
    setCurrentResource(resource);
    setFormData({
      name: resource.name,
      type: resource.type
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (resource: Resource) => {
    setCurrentResource(resource);
    setIsDeleteModalOpen(true);
  };

  const getResourceUtilization = (resourceId: string) => {
    const resourceBriefs = briefs.filter(b => 
      b.resource_id === resourceId && 
      b.status !== 'complete' && 
      b.status !== 'cancelled'
    );
    
    return resourceBriefs.length;
  };

  const exportToCsv = () => {
    const headers = [
      'Name',
      'Type',
      'Active Briefs',
      'Created At'
    ].join(',');
    
    const rows = resources.map(resource => [
      `"${resource.name.replace(/"/g, '""')}"`,
      resource.type,
      getResourceUtilization(resource.id),
      resource.created_at
    ].join(','));
    
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'resources.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && resources.length === 0) {
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
            <h2 className="text-xl font-semibold text-gray-900">Resources</h2>
            <p className="text-gray-600 mt-1">Manage internal and external resources for marketing projects</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {canManageResources && (
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="px-3 py-2"
              >
                <Plus className="h-5 w-5" />
                <span className="ml-2">Add Resource</span>
              </Button>
            )}
            
            <Button 
              variant="outline"
              onClick={exportToCsv}
              className="px-3 py-2"
            >
              <Download className="h-5 w-5" />
              <span className="ml-2">Export</span>
            </Button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      {/* Resources Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active Briefs
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              {canManageResources && (
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {resources.length > 0 ? (
              resources.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 capitalize">
                      {resource.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getResourceUtilization(resource.id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(resource.created_at).toLocaleDateString()}
                  </td>
                  {canManageResources && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        onClick={() => openEditModal(resource)}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => openDeleteModal(resource)}
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={canManageResources ? 5 : 4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No resources found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add Resource Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Resource</h3>
            
            <form onSubmit={handleAddResource}>
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
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Resource['type'] })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  >
                    <option value="internal">Internal</option>
                    <option value="agency">Agency</option>
                    <option value="freelancer">Freelancer</option>
                  </select>
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
                  {loading ? 'Adding...' : 'Add Resource'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Resource Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Resource</h3>
            
            <form onSubmit={handleEditResource}>
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
                  <label htmlFor="edit-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    id="edit-type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Resource['type'] })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  >
                    <option value="internal">Internal</option>
                    <option value="agency">Agency</option>
                    <option value="freelancer">Freelancer</option>
                  </select>
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
                  {loading ? 'Updating...' : 'Update Resource'}
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Resource</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{currentResource?.name}</span>? This action cannot be undone.
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
                onClick={handleDeleteResource}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete Resource'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceManagement;
