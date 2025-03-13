import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getPriorityColor, getStatusColor } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Download, Filter, Plus, Search, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import type { Brief, Resource, User } from '../types';

const BriefsList = () => {
  const [loading, setLoading] = useState(true);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [resourceFilter, setResourceFilter] = useState<string | null>(null);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mediaTypes, setMediaTypes] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch briefs with explicit field selection
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select('id, title, status, start_date, due_date, channel, resource_id, created_by')
          .order('due_date', { ascending: true });
        
        if (briefsError) {
          console.error('Error fetching briefs:', briefsError);
          setError(`Failed to load briefs: ${briefsError.message}`);
          return;
        }
        
        // Fetch resources for resource filtering and display
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('id, name, type, media_type, created_at')
          .order('name');
        
        if (resourcesError) {
          console.error('Error fetching resources:', resourcesError);
          setError(`Failed to load resources: ${resourcesError.message}`);
          return;
        }
        
        // Extract unique media types
        const uniqueMediaTypes = Array.from(
          new Set(
            resourcesData
              .filter(resource => resource.media_type)
              .map(resource => resource.media_type)
          )
        ).sort() as string[];
        
        // Fetch users with explicit field selection
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, role, created_at, avatar_url');
        
        if (usersError) {
          console.error('Error fetching users:', usersError);
          setError(`Failed to load users: ${usersError.message}`);
          return;
        }
        
        if (!briefsData) {
          setError('No brief data returned from the server');
          return;
        }
        
        if (!usersData) {
          setError('No user data returned from the server');
          return;
        }
        
        // Set state with type safety
        setBriefs(briefsData.map(brief => ({
          ...brief,
          priority: undefined, // Priority no longer in schema
          // Add other missing fields to match Brief type
          resource: null,
          description: brief.description || undefined,
          specifications: brief.specifications || undefined,
          estimated_hours: brief.estimated_hours || undefined,
          expenses: brief.expenses || undefined,
          approver_id: brief.approver_id || undefined,
          updated_at: brief.updated_at || undefined
        })) as Brief[]);
        
        setResources(resourcesData);
        setUsers(usersData as User[]);
        setMediaTypes(uniqueMediaTypes);
      } catch (error: any) {
        console.error('Error fetching briefs data:', error);
        setError(error?.message || 'An unexpected error occurred while loading data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getResourceName = (resourceId: string | null) => {
    if (!resourceId) return 'Unassigned';
    const resource = resources.find(r => r.id === resourceId);
    return resource ? resource.name : 'Unknown';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  };

  const exportToCsv = () => {
    const headers = [
      'Title',
      'Channel',
      'Start Date',
      'Due Date',
      'Status',
      // Priority removed as field no longer exists
      'Resource',
      'Media Type',
      'Created By'
    ].join(',');
    
    const rows = filteredBriefs.map(brief => [
      `"${brief.title.replace(/"/g, '""')}"`,
      `"${brief.channel.replace(/"/g, '""')}"`,
      formatDate(brief.start_date),
      formatDate(brief.due_date),
      brief.status.replace('_', ' '),
      // Priority removed as field no longer exists
      getResourceName(brief.resource_id),
      getResourceMediaType(brief.resource_id) || 'Not specified',
      getUserName(brief.created_by)
    ].join(','));
    
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'marketing_briefs.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter(null);
    setPriorityFilter(null);
    setResourceFilter(null);
    setMediaTypeFilter(null);
  };
  
  // Get the media type of a resource
  const getResourceMediaType = (resourceId: string | null) => {
    if (!resourceId) return null;
    const resource = resources.find(r => r.id === resourceId);
    return resource ? resource.media_type : null;
  };

  const filteredBriefs = briefs.filter(brief => {
    // Apply search query
    if (searchQuery && !brief.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply status filter
    if (statusFilter && brief.status !== statusFilter) {
      return false;
    }
    
    // Priority filter is no longer applicable since priority was removed from schema
    if (priorityFilter) {
      return false; // If priority filter is set, no results will match (since priority field doesn't exist)
    }
    
    // Apply resource filter
    if (resourceFilter) {
      if (resourceFilter === 'null') {
        // Special case for unassigned resources
        if (brief.resource_id) return false;
      } else if (brief.resource_id !== resourceFilter) {
        return false;
      }
    }
    
    // Apply media type filter
    if (mediaTypeFilter) {
      const resourceMediaType = getResourceMediaType(brief.resource_id);
      if (mediaTypeFilter === 'null') {
        // Special case for resources without media type
        if (resourceMediaType) return false;
      } else if (resourceMediaType !== mediaTypeFilter) {
        return false;
      }
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative max-w-2xl w-full mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <Button 
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Briefs</h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search briefs..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter button */}
            <Button 
              variant="outline"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="px-3 py-2"
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span className="ml-2">Filter</span>
            </Button>

            {/* Calendar view temporarily removed */}

            {/* Export */}
            <Button 
              variant="outline"
              onClick={exportToCsv}
              className="px-3 py-2"
            >
              <Download className="h-5 w-5" />
              <span className="ml-2">Export</span>
            </Button>

            {/* Create new brief */}
            <Link to="/briefs/create">
              <Button className="px-3 py-2">
                <Plus className="h-5 w-5" />
                <span className="ml-2">New Brief</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters panel */}
        {isFilterOpen && (
          <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
            <div className="flex flex-wrap gap-4">
              {/* Status filter */}
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status-filter"
                  value={statusFilter || ''}
                  onChange={(e) => setStatusFilter(e.target.value || null)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="complete">Complete</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Priority filter removed as priority field no longer exists */}

              {/* Resource filter */}
              <div>
                <label htmlFor="resource-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Resource
                </label>
                <select
                  id="resource-filter"
                  value={resourceFilter || ''}
                  onChange={(e) => setResourceFilter(e.target.value || null)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Resources</option>
                  <option value="null">Unassigned</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Media Type filter */}
              <div>
                <label htmlFor="media-type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Media Type
                </label>
                <select
                  id="media-type-filter"
                  value={mediaTypeFilter || ''}
                  onChange={(e) => setMediaTypeFilter(e.target.value || null)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Media Types</option>
                  <option value="null">Unspecified</option>
                  {mediaTypes.map((mediaType) => (
                    <option key={mediaType} value={mediaType}>
                      {mediaType}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset button */}
              <div className="flex items-end">
                <Button 
                  variant="outline"
                  onClick={resetFilters}
                  className="px-3 py-2"
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Briefs list */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Channel
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {/* Priority column removed as field no longer exists */}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resource
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Media Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created By
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBriefs.length > 0 ? (
              filteredBriefs.map((brief) => (
                <tr key={brief.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/briefs/${brief.id}`} className="text-blue-600 hover:text-blue-900">
                      {brief.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {brief.channel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(brief.due_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(brief.status)}`}>
                      {brief.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getResourceName(brief.resource_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getResourceMediaType(brief.resource_id) || 'Not specified'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getUserName(brief.created_by)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No briefs found. {searchQuery || statusFilter || priorityFilter || resourceFilter || mediaTypeFilter ? (
                    <button 
                      onClick={resetFilters}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Clear filters
                    </button>
                  ) : (
                    <Link to="/briefs/create" className="text-blue-600 hover:text-blue-800">
                      Create your first brief
                    </Link>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BriefsList;
