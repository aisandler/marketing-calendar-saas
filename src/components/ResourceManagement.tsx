import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Resource, ResourceType } from '../types';
import { PlusCircle, Edit, Trash2, X, Check, RefreshCw } from 'lucide-react';

interface ResourceManagementProps {
  onResourceChange?: () => void;
}

const ResourceManagement: React.FC<ResourceManagementProps> = ({ onResourceChange }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<ResourceType>('internal');
  const [formCapacity, setFormCapacity] = useState<number>(40);
  const [formRate, setFormRate] = useState<number | undefined>(undefined);
  const [formMediaType, setFormMediaType] = useState('');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setResources(data);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingResource(null);
    resetForm();
    setShowForm(true);
  };

  const handleEditClick = (resource: Resource) => {
    setEditingResource(resource);
    setFormName(resource.name);
    setFormType(resource.type);
    setFormCapacity(resource.capacity_hours || 40);
    setFormRate(resource.hourly_rate);
    setFormMediaType(resource.media_type || '');
    setShowForm(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormType('internal');
    setFormCapacity(40);
    setFormRate(undefined);
    setFormMediaType('');
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
    setEditingResource(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const resourceData = {
        name: formName,
        type: formType,
        capacity_hours: formCapacity,
        hourly_rate: formRate || null,
        media_type: formMediaType || null
      };
      
      if (editingResource) {
        // Update existing resource
        const { error } = await supabase
          .from('resources')
          .update(resourceData)
          .eq('id', editingResource.id);
          
        if (error) throw error;
      } else {
        // Create new resource
        const { error } = await supabase
          .from('resources')
          .insert([resourceData]);
          
        if (error) throw error;
      }
      
      // Refresh resources list
      await fetchResources();
      
      // Notify parent component
      if (onResourceChange) {
        onResourceChange();
      }
      
      // Reset form and close
      handleCancel();
      
    } catch (error) {
      console.error('Error saving resource:', error);
      setError('Failed to save resource');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        setLoading(true);
        
        // Check if resource is assigned to any briefs
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select('id')
          .eq('resource_id', id);
          
        if (briefsError) throw briefsError;
        
        if (briefsData && briefsData.length > 0) {
          alert('This resource is assigned to briefs and cannot be deleted. Please reassign the briefs first.');
          return;
        }
        
        // Delete the resource
        const { error } = await supabase
          .from('resources')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        // Refresh resources list
        await fetchResources();
        
        // Notify parent component
        if (onResourceChange) {
          onResourceChange();
        }
        
      } catch (error) {
        console.error('Error deleting resource:', error);
        setError('Failed to delete resource');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && resources.length === 0) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Resource Management</h3>
        <div className="flex items-center space-x-2">
          <button 
            onClick={fetchResources}
            className="p-1 hover:bg-gray-50 rounded"
            title="Refresh resources"
          >
            <RefreshCw className="h-5 w-5 text-gray-500" />
          </button>
          <button 
            onClick={handleAddClick}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Add Resource
          </button>
        </div>
      </div>
      
      {error && (
        <div className="m-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {showForm && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Resource Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Resource Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as ResourceType)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="internal">Internal</option>
                  <option value="agency">Agency</option>
                  <option value="freelancer">Freelancer</option>
                </select>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                  Weekly Capacity (hours)
                </label>
                <input
                  type="number"
                  name="capacity"
                  id="capacity"
                  value={formCapacity}
                  onChange={(e) => setFormCapacity(parseInt(e.target.value) || 0)}
                  min="0"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="rate" className="block text-sm font-medium text-gray-700">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  name="rate"
                  id="rate"
                  value={formRate || ''}
                  onChange={(e) => setFormRate(e.target.value ? parseInt(e.target.value) : undefined)}
                  min="0"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="mediaType" className="block text-sm font-medium text-gray-700">
                  Media Type
                </label>
                <input
                  type="text"
                  name="mediaType"
                  id="mediaType"
                  value={formMediaType}
                  onChange={(e) => setFormMediaType(e.target.value)}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="e.g. Design, Copy, Video"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <X className="h-4 w-4 inline mr-1" />
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Check className="h-4 w-4 inline mr-1" />
                {editingResource ? 'Update' : 'Create'} Resource
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="overflow-x-auto">
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
                Media Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Capacity
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {resources.map((resource) => (
              <tr key={resource.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {resource.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {resource.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {resource.media_type || <span className="text-gray-400">Unspecified</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {resource.capacity_hours || 40} hours/week
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {resource.hourly_rate ? `$${resource.hourly_rate}/hr` : <span className="text-gray-400">Unspecified</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditClick(resource)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            
            {resources.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No resources found. Click "Add Resource" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResourceManagement; 