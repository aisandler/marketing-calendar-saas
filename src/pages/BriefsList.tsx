import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getPriorityColor, getStatusColor } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CalendarDays, Download, Filter, Plus, Search, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import type { Brief, Resource, User } from '../types';

const BriefsList = () => {
  const [loading, setLoading] = useState(true);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [resourceFilter, setResourceFilter] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch briefs
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select('*')
          .order('due_date', { ascending: true });
        
        if (briefsError) throw briefsError;
        
        // Fetch resources
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('*');
        
        if (resourcesError) throw resourcesError;
        
        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*');
        
        if (usersError) throw usersError;
        
        // Set state
        setBriefs(briefsData as Brief[]);
        setResources(resourcesData as Resource[]);
        setUsers(usersData as User[]);
      } catch (error) {
        console.error('Error fetching briefs data:', error);
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
      'Priority',
      'Resource',
      'Created By'
    ].join(',');
    
    const rows = filteredBriefs.map(brief => [
      `"${brief.title.replace(/"/g, '""')}"`,
      `"${brief.channel.replace(/"/g, '""')}"`,
      formatDate(brief.start_date),
      formatDate(brief.due_date),
      brief.status.replace('_', ' '),
      brief.priority,
      getResourceName(brief.resource_id),
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
    
    // Apply priority filter
    if (priorityFilter && brief.priority !== priorityFilter) {
      return false;
    }
    
    // Apply resource filter
    if (resourceFilter && brief.resource_id !== resourceFilter) {
      return false;
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

            {/* Calendar view */}
            <Link to="/calendar">
              <Button variant="outline" className="px-3 py-2">
                <CalendarDays className="h-5 w-5" />
                <span className="ml-2">Calendar</span>
              </Button>
            </Link>

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

              {/* Priority filter */}
              <div>
                <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority-filter"
                  value={priorityFilter || ''}
                  onChange={(e) => setPriorityFilter(e.target.value || null)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

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
                  <option value={null}>Unassigned</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name}
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
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Priority
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Resource
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(brief.priority)}`}>
                      {brief.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getResourceName(brief.resource_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getUserName(brief.created_by)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No briefs found. {searchQuery || statusFilter || priorityFilter || resourceFilter ? (
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
