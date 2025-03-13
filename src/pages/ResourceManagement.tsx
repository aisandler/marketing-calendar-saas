import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, Edit, Trash, Download, BarChart3, Users, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import type { Resource, Brief, Team } from '../types';
import MediaTypeUtilization from '../components/MediaTypeUtilization';
import TeamManagement from '../components/teams/TeamManagement';
import TeamUtilization from '../components/teams/TeamUtilization';

const ResourceManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isOverallocationWarningOpen, setIsOverallocationWarningOpen] = useState(false);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [activeTab, setActiveTab] = useState<'resources' | 'media-types' | 'teams' | 'team-utilization'>('resources');
  const [teams, setTeams] = useState<Team[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    type: 'internal' as Resource['type'],
    capacity_hours: 40, // Default 40 hours per week
    hourly_rate: 0, // Optional hourly rate
    media_type: '', // Optional media type
    team_id: '' // Optional team assignment
  });

  // Check if user has permission
  const canManageResources = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch resources with explicit field selection including capacity and team_id
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('id, name, type, capacity_hours, hourly_rate, media_type, team_id, created_at, updated_at')
          .order('name');
        
        if (resourcesError) throw resourcesError;
        
        // Fetch teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('name');
        
        if (teamsError) throw teamsError;
        
        // Fetch briefs for resource utilization with explicit field selection
        // Include estimated_hours for capacity planning and resource_id for allocation
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select('id, title, status, start_date, due_date, resource_id, estimated_hours')
          .order('due_date');
          
        if (briefsError) throw briefsError;
        
        setResources(resourcesData as Resource[]);
        setTeams(teamsData as Team[]);
        setBriefs(briefsData as Brief[]);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load resources and teams.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
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
            capacity_hours: formData.capacity_hours,
            hourly_rate: formData.hourly_rate > 0 ? formData.hourly_rate : null,
            media_type: formData.media_type || null,
            team_id: formData.team_id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Update resources list
      setResources([...resources, data[0] as Resource]);
      
      // Reset form and close modal
      setFormData({ 
        name: '', 
        type: 'internal',
        capacity_hours: 40,
        hourly_rate: 0,
        media_type: '',
        team_id: ''
      });
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
    
    // Check if the new capacity would cause overallocation
    const totalAllocated = getTotalHoursAllocated(currentResource.id);
    if (totalAllocated > formData.capacity_hours) {
      // If capacity is being reduced below current allocation, show warning
      if (!isOverallocationWarningOpen) {
        setIsOverallocationWarningOpen(true);
        return;
      }
      // If user confirms overallocation, continue with update
      setIsOverallocationWarningOpen(false);
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('resources')
        .update({
          name: formData.name,
          type: formData.type,
          capacity_hours: formData.capacity_hours,
          hourly_rate: formData.hourly_rate > 0 ? formData.hourly_rate : null,
          media_type: formData.media_type || null,
          team_id: formData.team_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentResource.id)
        .select();
      
      if (error) throw error;
      
      // Update resources list
      if (!data || data.length === 0) {
        throw new Error('No data returned from update operation');
      }
      
      // Validate returned data has required Resource properties
      const updatedResource = data[0];
      if (!updatedResource.id || !updatedResource.name || !updatedResource.type) {
        throw new Error('Updated resource data is incomplete');
      }
      
      setResources(resources.map(r => 
        r.id === currentResource.id ? updatedResource as Resource : r
      ));
      
      // Reset form and close modal
      setFormData({ 
        name: '', 
        type: 'internal',
        capacity_hours: 40,
        hourly_rate: 0,
        media_type: '',
        team_id: ''
      });
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
      
      // First check if there are any briefs referencing this resource
      const { data: referencedBriefs, error: briefsError } = await supabase
        .from('briefs')
        .select('id, title')
        .eq('resource_id', currentResource.id)
        .limit(1);
      
      if (briefsError) throw briefsError;
      
      // If briefs reference this resource, prevent deletion
      if (referencedBriefs && referencedBriefs.length > 0) {
        throw new Error(`Cannot delete this resource because it is assigned to ${referencedBriefs.length} briefs. Please reassign these briefs before deleting.`);
      }
      
      // Proceed with deletion if no references exist
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
      type: resource.type,
      capacity_hours: resource.capacity_hours || 40,
      hourly_rate: resource.hourly_rate || 0,
      media_type: resource.media_type || '',
      team_id: resource.team_id || ''
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (resource: Resource) => {
    setCurrentResource(resource);
    setIsDeleteModalOpen(true);
  };

  // Get brief count for a resource
  const getResourceBriefCount = (resourceId: string) => {
    const resourceBriefs = briefs.filter(brief => brief.resource_id === resourceId);
    return resourceBriefs.length;
  };
  
  // Calculate total hours allocated to a resource
  const getTotalHoursAllocated = (resourceId: string) => {
    const resourceBriefs = briefs.filter(brief => brief.resource_id === resourceId);
    return resourceBriefs.reduce((total, brief) => total + (brief.estimated_hours || 0), 0);
  };
  
  // Check if a resource is overallocated based on capacity
  const isResourceOverallocated = (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return false;
    
    const capacity = resource.capacity_hours || 40;
    const totalHours = getTotalHoursAllocated(resourceId);
    
    return totalHours > capacity;
  };

  const exportToCsv = () => {
    const headers = [
      'Name',
      'Type',
      'Media Type',
      'Capacity (hours/week)',
      'Hourly Rate',
      'Active Briefs',
      'Hours Allocated',
      'Status',
      'Created At'
    ].join(',');
    
    const rows = resources.map(resource => [
      `"${resource.name.replace(/"/g, '""')}"`,
      resource.type,
      resource.media_type || '',
      resource.capacity_hours || 40,
      resource.hourly_rate || 0,
      getResourceBriefCount(resource.id),
      getTotalHoursAllocated(resource.id),
      isResourceOverallocated(resource.id) ? 'Overallocated' : 'Available',
      resource.created_at ? format(new Date(resource.created_at), 'yyyy-MM-dd') : ''
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
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          <strong>Error:</strong> {error}
          <button 
            className="float-right text-red-700 hover:text-red-900"
            onClick={() => setError(null)}
          >
            &times;
          </button>
        </div>
      )}
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
        
        {/* Tabs Navigation */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('resources')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'resources'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="inline-block h-5 w-5 mr-2" />
              Resources List
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'teams'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Briefcase className="inline-block h-5 w-5 mr-2" />
              Teams
            </button>
            <button
              onClick={() => setActiveTab('media-types')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'media-types'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="inline-block h-5 w-5 mr-2" />
              Media Type Utilization
            </button>
            <button
              onClick={() => setActiveTab('team-utilization')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'team-utilization'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="inline-block h-5 w-5 mr-2" />
              Team Utilization
            </button>
          </nav>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      {/* Tab Content */}
      {activeTab === 'resources' && (
        /* Resources Table */
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
                  Team
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Media Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours Allocated
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                resources.map((resource) => {
                  // Find team name, safely handle null/undefined team_id
                  const team = resource.team_id ? teams.find(t => t.id === resource.team_id) : undefined;
                  
                  return (
                    <tr key={resource.id} className={`hover:bg-gray-50 ${isResourceOverallocated(resource.id) ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 capitalize">
                          {resource.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {team ? team.name : 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resource.media_type || 'Not specified'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resource.capacity_hours || 40} hours/week
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getTotalHoursAllocated(resource.id)} hours
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isResourceOverallocated(resource.id) ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            Overallocated
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Available
                          </span>
                        )}
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan={canManageResources ? 8 : 7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No resources found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {activeTab === 'teams' && (
        <TeamManagement />
      )}
      
      {activeTab === 'media-types' && (
        <MediaTypeUtilization />
      )}
      
      {activeTab === 'team-utilization' && (
        <TeamUtilization />
      )}
      
      {/* Overallocation Warning Modal */}
      {isOverallocationWarningOpen && currentResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resource Overallocation Warning</h3>
            <p className="text-gray-600 mb-6">
              Reducing capacity to {formData.capacity_hours} hours will overallocate <span className="font-semibold">{currentResource.name}</span>.
              <br /><br />
              Current allocation: <span className="font-semibold">{getTotalHoursAllocated(currentResource.id)} hours</span>
              <br />
              New capacity: <span className="font-semibold">{formData.capacity_hours} hours</span>
              <br /><br />
              Are you sure you want to continue with this change?
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsOverallocationWarningOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                variant="destructive"
                onClick={(e) => {
                  setIsOverallocationWarningOpen(false);
                  handleEditResource(e as React.FormEvent);
                }}
              >
                Continue with Overallocation
              </Button>
            </div>
          </div>
        </div>
      )}

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
                
                <div>
                  <label htmlFor="media-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Media Type
                  </label>
                  <Input
                    id="media-type"
                    value={formData.media_type}
                    onChange={(e) => setFormData({ ...formData, media_type: e.target.value })}
                    placeholder="e.g., Photography, Graphic Design, Social Media"
                  />
                </div>
                
                <div>
                  <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-1">
                    Team
                  </label>
                  <select
                    id="team"
                    value={formData.team_id}
                    onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">No Team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="capacity-hours" className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity (Hours/Week)
                  </label>
                  <Input
                    id="capacity-hours"
                    type="number"
                    value={formData.capacity_hours}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      const capacity_hours = !isNaN(value) && value > 0 ? value : 40;
                      setFormData({ ...formData, capacity_hours });
                    }}
                    min="1"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="hourly-rate" className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate (optional)
                  </label>
                  <Input
                    id="hourly-rate"
                    type="number"
                    value={formData.hourly_rate}
                    onChange={(e) => {
                      // Ensure value is non-negative
                      const value = parseFloat(e.target.value);
                      const hourly_rate = !isNaN(value) && value >= 0 ? value : 0;
                      setFormData({ ...formData, hourly_rate });
                    }}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave at 0 for internal resources with no direct cost
                  </p>
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
                
                <div>
                  <label htmlFor="edit-media-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Media Type
                  </label>
                  <Input
                    id="edit-media-type"
                    value={formData.media_type}
                    onChange={(e) => setFormData({ ...formData, media_type: e.target.value })}
                    placeholder="e.g., Photography, Graphic Design, Social Media"
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-team" className="block text-sm font-medium text-gray-700 mb-1">
                    Team
                  </label>
                  <select
                    id="edit-team"
                    value={formData.team_id}
                    onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">No Team</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="edit-capacity-hours" className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity (Hours/Week)
                  </label>
                  <Input
                    id="edit-capacity-hours"
                    type="number"
                    value={formData.capacity_hours}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      const capacity_hours = !isNaN(value) && value > 0 ? value : 40;
                      setFormData({ ...formData, capacity_hours });
                    }}
                    min="1"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="edit-hourly-rate" className="block text-sm font-medium text-gray-700 mb-1">
                    Hourly Rate (optional)
                  </label>
                  <Input
                    id="edit-hourly-rate"
                    type="number"
                    value={formData.hourly_rate}
                    onChange={(e) => {
                      // Ensure value is non-negative
                      const value = parseFloat(e.target.value);
                      const hourly_rate = !isNaN(value) && value >= 0 ? value : 0;
                      setFormData({ ...formData, hourly_rate });
                    }}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave at 0 for internal resources with no direct cost
                  </p>
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
