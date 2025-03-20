import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getPriorityColor, getStatusColor, calculateResourceAllocation } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Download, Filter, Plus, Search, SlidersHorizontal, ChevronDown, ChevronUp, Calendar, LayoutList, ArrowDown, ArrowUp, Eye, Copy, Archive, MoreHorizontal } from 'lucide-react';
import type { Resource, User } from '../types';
import MarketingCalendar from '../components/MarketingCalendar';

interface Brief {
  id: string;
  title: string;
  description: string | null;
  campaign_id: string | null;
  brand_id: string;
  resource_id: string | null;
  start_date: string;
  due_date: string;
  estimated_hours: number | null;
  status: string;
  channel: string;
  specifications: any | null;
  created_by: string;
  approver_id: string | null;
  created_at: string;
  updated_at: string;
  expenses: number | null;
  brand?: {
    id: string;
    name: string;
  };
  resource?: {
    id: string;
    name: string;
    type: string;
    media_type: string | null;
  };
  created_by_user?: {
    id: string;
    name: string;
  };
}

const BriefsList = () => {
  const [loading, setLoading] = useState(true);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string; }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [resourceFilter, setResourceFilter] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [mediaTypes, setMediaTypes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [campaigns, setCampaigns] = useState<Array<any>>([]);
  
  // Add sorting state
  const [sortField, setSortField] = useState<string>('due_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [filterCount, setFilterCount] = useState(0);
  const [showCompleted, setShowCompleted] = useState(false);
  const [resourceUtilization, setResourceUtilization] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch campaigns
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select(`
            *,
            brand:brands(id, name)
          `)
          .order('start_date', { ascending: true });
        
        if (campaignsError) {
          console.error('Error fetching campaigns:', campaignsError);
        } else {
          setCampaigns(campaignsData || []);
        }
        
        // Fetch briefs with * to get all columns
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select(`
            *,
            brand:brands(id, name),
            resource:resources(id, name, type, media_type, hourly_rate),
            created_by_user:users!created_by(id, name)
          `)
          .order('due_date', { ascending: true });
        
        if (briefsError) {
          console.error('Error fetching briefs:', briefsError);
          setError(`Failed to load briefs: ${briefsError.message}`);
          return;
        }
        
        // More detailed debug logging
        console.log('Raw briefs data:', briefsData);
        briefsData?.forEach(brief => {
          if (brief.title.includes('SHOP MKTPLACE')) {
            console.log('SHOP MKTPLACE Brief details:', {
              title: brief.title,
              resource_id: brief.resource_id,
              resource: brief.resource,
              raw_brief: brief
            });
          }
        });
        
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
        
        // Extract unique media types (now from channel field)
        const uniqueMediaTypes = Array.from(
          new Set(
            briefsData
              .filter(brief => brief.channel)
              .map(brief => brief.channel)
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
        
        // Fetch brands for filtering
        const { data: brandsData, error: brandsError } = await supabase
          .from('brands')
          .select('id, name')
          .order('name');
          
        if (brandsError) {
          console.error('Error fetching brands:', brandsError);
          setError(`Failed to load brands: ${brandsError.message}`);
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
        
        // Set state with type safety, adding missing fields with defaults
        setBriefs(briefsData.map(brief => ({
          ...brief,
          priority: 'medium', // Default priority
          campaign_id: brief.campaign_id || null, // Preserve existing campaign_id
          brand_id: brief.brand_id || (brands.length > 0 ? brands[0].id : ''), // Preserve existing brand_id
          description: brief.description || undefined,
          specifications: brief.specifications || undefined,
          estimated_hours: brief.estimated_hours || undefined,
          expenses: brief.expenses || undefined,
          approver_id: brief.approver_id || undefined,
          updated_at: brief.updated_at || undefined
        })) as Brief[]);
        
        setResources(resourcesData);
        setUsers(usersData as User[]);
        setBrands(brandsData || []);
        setMediaTypes(uniqueMediaTypes);

        // Calculate resource utilization
        calculateResourceUtilization(briefsData);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error?.message || 'An unexpected error occurred while loading data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    // Update filter count
    let count = 0;
    if (searchQuery) count++;
    if (statusFilter) count++;
    if (resourceFilter) count++;
    if (brandFilter) count++;
    if (mediaTypeFilter) count++;
    // Don't count showCompleted as a filter since it's a view preference
    setFilterCount(count);
  }, [searchQuery, statusFilter, resourceFilter, brandFilter, mediaTypeFilter]);

  const getResourceName = (resourceId: string | null) => {
    if (!resourceId) return 'Unassigned';
    const resource = resources.find(r => r.id === resourceId);
    return resource ? resource.name : 'Unknown';
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown';
  };
  
  const getBrandName = (brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    return brand ? brand.name : 'Unknown';
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
      brief.channel || 'Not specified',
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
    setBrandFilter(null);
    setMediaTypeFilter(null);
  };
  
  // Get the media type of a resource
  const getResourceMediaType = (resourceId: string | null) => {
    if (!resourceId) return null;
    const resource = resources.find(r => r.id === resourceId);
    return resource ? resource.media_type : null;
  };

  // Get the media type of a brief (it's now the channel field)
  const getBriefMediaType = (brief: Brief) => {
    return brief?.channel || null;
  };

  // Handle column sort
  const handleSort = (field: string) => {
    // If clicking the same field, toggle direction
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it as sort field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort indicator for column headers
  const getSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 inline ml-1 text-indigo-600" /> 
      : <ArrowDown className="h-4 w-4 inline ml-1 text-indigo-600" />;
  };

  // Get column header class based on sort field
  const getColumnHeaderClass = (field: string) => {
    const baseClass = "px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition duration-150";
    
    if (sortField === field) {
      return `${baseClass} text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-b-2 border-indigo-500`;
    }
    
    return `${baseClass} text-gray-500`;
  };

  const filteredBriefs = briefs.filter(brief => {
    // First filter out completed briefs if showCompleted is false
    if (!showCompleted && brief.status === 'complete') {
      return false;
    }
    
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
    
    // Apply brand filter (check if brand_id exists in the brief)
    if (brandFilter && brief.brand_id && brief.brand_id !== brandFilter) {
      return false;
    }
    
    // Apply media type filter (now using channel field)
    if (mediaTypeFilter) {
      if (mediaTypeFilter === 'null') {
        // Special case for briefs without a channel specified
        if (brief.channel && brief.channel.trim() !== '') return false;
      } else if (brief.channel !== mediaTypeFilter) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    // Sort based on current sort field and direction
    let comparison = 0;
    
    switch (sortField) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'channel':
        comparison = (a.channel || '').localeCompare(b.channel || '');
        break;
      case 'due_date':
        comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'brand':
        comparison = (a.brand?.name || '').localeCompare(b.brand?.name || '');
        break;
      case 'resource':
        comparison = (a.resource?.name || '').localeCompare(b.resource?.name || '');
        break;
      case 'created_by':
        comparison = (a.created_by_user?.name || '').localeCompare(b.created_by_user?.name || '');
        break;
      default:
        comparison = 0;
    }
    
    // Reverse comparison if sort direction is descending
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Count completed briefs that aren't shown
  const completedBriefsCount = !showCompleted ? briefs.filter(brief => brief.status === 'complete').length : 0;

  // Get background color for utilization bar
  const getUtilizationBgColor = (percent: number) => {
    if (percent < 50) return 'bg-emerald-500';
    if (percent < 75) return 'bg-blue-500';
    if (percent < 90) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Get deadline proximity indicator
  const getDeadlineIndicator = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      return {
        indicator: "overdue",
        color: "text-red-500",
        icon: <span title="Overdue" className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></span>
      };
    } else if (daysUntilDue <= 2) {
      return {
        indicator: "urgent",
        color: "text-red-500",
        icon: <span title="Due in ≤ 2 days" className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
      };
    } else if (daysUntilDue <= 7) {
      return {
        indicator: "soon",
        color: "text-amber-500",
        icon: <span title="Due in ≤ 7 days" className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
      };
    } else if (daysUntilDue <= 14) {
      return {
        indicator: "approaching",
        color: "text-blue-500",
        icon: <span title="Due in ≤ 14 days" className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
      };
    } else {
      return {
        indicator: "plenty-of-time",
        color: "text-gray-500",
        icon: null
      };
    }
  };

  // Get priority indicator based on status
  const getPriorityIndicator = (brief: Brief) => {
    // Use status to determine visual priority for now
    const statusPriority: Record<string, string> = {
      'draft': 'low',
      'pending_approval': 'medium',
      'approved': 'medium',
      'in_progress': 'high',
      'review': 'high',
      'complete': 'low',
      'cancelled': 'low'
    };

    // Get days until due
    const now = new Date();
    const due = new Date(brief.due_date);
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Combine status and due date for priority
    let priority = statusPriority[brief.status] || 'medium';
    
    // Increase priority if deadline is close
    if (daysUntilDue < 0) {
      priority = 'urgent';
    } else if (daysUntilDue <= 2 && priority !== 'urgent') {
      priority = 'high';
    }

    switch (priority) {
      case 'urgent':
        return <span title="Urgent Priority" className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></span>;
      case 'high':
        return <span title="High Priority" className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></span>;
      case 'medium':
        return <span title="Medium Priority" className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></span>;
      case 'low':
        return <span title="Low Priority" className="absolute left-0 top-0 bottom-0 w-1 bg-gray-300"></span>;
      default:
        return null;
    }
  };

  // Function to handle brief duplication
  const handleDuplicate = async (brief: Brief) => {
    try {
      // Create a new brief based on the existing one, but omit the id
      const { id, ...briefWithoutId } = brief;
      const newBrief = {
        ...briefWithoutId,
        title: `Copy of ${brief.title}`,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('briefs')
        .insert([newBrief])
        .select();
      
      if (error) {
        console.error('Error duplicating brief:', error);
        alert('Failed to duplicate brief');
        return;
      }
      
      // Refresh the briefs list to show the new brief
      window.location.reload();
      
    } catch (error) {
      console.error('Error duplicating brief:', error);
      alert('An unexpected error occurred');
    }
  };
  
  // Function to handle brief archiving
  const handleArchive = async (briefId: string) => {
    try {
      // Update the brief status to "archived"
      const { error } = await supabase
        .from('briefs')
        .update({ status: 'cancelled' })
        .eq('id', briefId);
      
      if (error) {
        console.error('Error archiving brief:', error);
        alert('Failed to archive brief');
        return;
      }
      
      // Update the status in the local state
      setBriefs(briefs.map(brief => 
        brief.id === briefId ? { ...brief, status: 'cancelled' } : brief
      ));
      
    } catch (error) {
      console.error('Error archiving brief:', error);
      alert('An unexpected error occurred');
    }
  };

  // Function to handle brief status change
  const handleStatusChange = async (briefId: string, newStatus: string) => {
    try {
      // Update the brief status
      const { error } = await supabase
        .from('briefs')
        .update({ status: newStatus })
        .eq('id', briefId);
      
      if (error) {
        console.error('Error updating brief status:', error);
        alert('Failed to update brief status');
        return;
      }
      
      // Update the status in the local state
      setBriefs(briefs.map(brief => 
        brief.id === briefId ? { ...brief, status: newStatus } : brief
      ));
      
    } catch (error) {
      console.error('Error updating brief status:', error);
      alert('An unexpected error occurred');
    }
  };

  // Calculate resource utilization based on briefs
  const calculateResourceUtilization = (briefsData: Brief[]) => {
    const utilization: Record<string, number> = {};
    
    // Group briefs by resource
    const resourceBriefs: Record<string, Brief[]> = {};
    
    briefsData.forEach(brief => {
      if (brief.resource_id) {
        if (!resourceBriefs[brief.resource_id]) {
          resourceBriefs[brief.resource_id] = [];
        }
        resourceBriefs[brief.resource_id].push(brief);
      }
    });
    
    // Calculate utilization for each resource
    Object.keys(resourceBriefs).forEach(resourceId => {
      const briefs = resourceBriefs[resourceId];
      const now = new Date();
      const twoWeeksFromNow = new Date();
      twoWeeksFromNow.setDate(now.getDate() + 14);
      
      // Calculate hours in next two weeks
      const hoursInPeriod = briefs.reduce((total, brief) => {
        const briefDate = new Date(brief.due_date);
        // Only count briefs due in the next two weeks and not completed
        if (briefDate >= now && briefDate <= twoWeeksFromNow && brief.status !== 'complete' && brief.status !== 'cancelled') {
          return total + (brief.estimated_hours || 0);
        }
        return total;
      }, 0);
      
      // Assume 40 hours/week capacity (80 hours for two weeks)
      const utilizationPercent = Math.min(100, Math.round((hoursInPeriod / 80) * 100));
      utilization[resourceId] = utilizationPercent;
    });
    
    setResourceUtilization(utilization);
  };

  // Get utilization display for a resource
  const getResourceUtilizationDisplay = (resourceId: string | null) => {
    if (!resourceId || resourceUtilization[resourceId] === undefined) return null;
    
    const utilization = resourceUtilization[resourceId];
    let color = 'bg-green-500';
    
    if (utilization >= 90) {
      color = 'bg-red-500'; // Overallocated
    } else if (utilization >= 70) {
      color = 'bg-amber-500'; // Heavily allocated
    } else if (utilization >= 40) {
      color = 'bg-blue-500'; // Moderately allocated
    }
    
    return (
      <div className="ml-2 flex items-center" title={`${utilization}% utilized in next 2 weeks`}>
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${utilization}%` }}></div>
        </div>
        <span className="text-xs ml-1 text-gray-500">{utilization}%</span>
      </div>
    );
  };

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
            {/* View toggle - Positioned first */}
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
              className="px-3 py-2"
            >
              {viewMode === 'list' ? (
                <>
                  <Calendar className="h-5 w-5" />
                  <span className="ml-2">Calendar</span>
                </>
              ) : (
                <>
                  <LayoutList className="h-5 w-5" />
                  <span className="ml-2">List</span>
                </>
              )}
            </Button>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search briefs..."
                className={`pl-10 ${searchQuery ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter button with count badge */}
            <Button 
              variant={isFilterOpen ? "default" : "outline"}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="px-3 py-2 relative"
            >
              <SlidersHorizontal className="h-5 w-5" />
              <span className="ml-2">Filter</span>
              {filterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {filterCount}
                </span>
              )}
            </Button>

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
              
              {/* Brand filter */}
              <div>
                <label htmlFor="brand-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <select
                  id="brand-filter"
                  value={brandFilter || ''}
                  onChange={(e) => setBrandFilter(e.target.value || null)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
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
            
            {/* Active filters tags */}
            {filterCount > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500 flex items-center flex-wrap gap-2">
                <span>Active filters:</span>
                {statusFilter && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    Status: {statusFilter.replace('_', ' ')}
                  </span>
                )}
                {resourceFilter && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    Resource: {resourceFilter === 'null' ? 'Unassigned' : resources.find(r => r.id === resourceFilter)?.name || resourceFilter}
                  </span>
                )}
                {brandFilter && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    Brand: {brands.find(b => b.id === brandFilter)?.name || brandFilter}
                  </span>
                )}
                {mediaTypeFilter && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    Media: {mediaTypeFilter}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Completed briefs toggle */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="show-completed"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="show-completed" className="font-medium text-gray-700">
              Show completed briefs
            </label>
          </div>
          
          {completedBriefsCount > 0 && !showCompleted && (
            <span className="text-gray-500 italic">
              {completedBriefsCount} completed {completedBriefsCount === 1 ? 'brief' : 'briefs'} hidden
            </span>
          )}
        </div>
      </div>

      {viewMode === 'list' ? (
        // Briefs list with horizontal scrolling wrapper
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full w-max divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th 
                    scope="col" 
                    className={getColumnHeaderClass('title')}
                    onClick={() => handleSort('title')}
                    title="Click to sort by title"
                  >
                    <div className="flex items-center">
                      Title
                      {getSortIndicator('title')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className={getColumnHeaderClass('channel')}
                    onClick={() => handleSort('channel')}
                    title="Click to sort by media type"
                    style={{ width: '120px' }}
                  >
                    <div className="flex items-center">
                      Media Type
                      {getSortIndicator('channel')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className={getColumnHeaderClass('due_date')}
                    onClick={() => handleSort('due_date')}
                    title="Click to sort by due date"
                    style={{ width: '120px' }}
                  >
                    <div className="flex items-center">
                      Due Date
                      {getSortIndicator('due_date')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className={getColumnHeaderClass('status')}
                    onClick={() => handleSort('status')}
                    title="Click to sort by status"
                    style={{ width: '140px' }}
                  >
                    <div className="flex items-center">
                      Status
                      {getSortIndicator('status')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className={getColumnHeaderClass('brand')}
                    onClick={() => handleSort('brand')}
                    title="Click to sort by brand"
                    style={{ width: '150px' }}
                  >
                    <div className="flex items-center">
                      Brand
                      {getSortIndicator('brand')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className={getColumnHeaderClass('resource')}
                    onClick={() => handleSort('resource')}
                    title="Click to sort by resource"
                    style={{ width: '150px' }}
                  >
                    <div className="flex items-center">
                      Resource
                      {getSortIndicator('resource')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className={getColumnHeaderClass('created_by')}
                    onClick={() => handleSort('created_by')}
                    title="Click to sort by creator"
                    style={{ width: '150px' }}
                  >
                    <div className="flex items-center">
                      Created By
                      {getSortIndicator('created_by')}
                    </div>
                  </th>
                  <th 
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    style={{ width: '140px' }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBriefs.length > 0 ? (
                  filteredBriefs.map((brief) => (
                    <tr 
                      key={brief.id} 
                      className="hover:bg-gray-50 transition-colors duration-150 relative group"
                    >
                      {/* Priority indicator should not cause column misalignment */}
                      <td className="px-6 py-4 whitespace-nowrap group-hover:bg-gray-50 relative">
                        {getPriorityIndicator(brief)}
                        <Link to={`/briefs/${brief.id}`} className="text-blue-600 hover:text-blue-800 max-w-md truncate inline-block font-medium">
                          {brief.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 group-hover:bg-gray-50">
                        {brief.channel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm group-hover:bg-gray-50">
                        <div className="flex items-center">
                          {getDeadlineIndicator(brief.due_date).icon}
                          <span className={getDeadlineIndicator(brief.due_date).color}>
                            {formatDate(brief.due_date)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap group-hover:bg-gray-50">
                        <select
                          className={`px-2 py-1 text-xs rounded cursor-pointer appearance-none pr-7 relative ${getStatusColor(brief.status)} focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                          value={brief.status}
                          onChange={(e) => handleStatusChange(brief.id, e.target.value)}
                          style={{ 
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.2rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1em 1em'
                          }}
                        >
                          <option value="draft">Draft</option>
                          <option value="pending_approval">Pending Approval</option>
                          <option value="approved">Approved</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="complete">Complete</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[150px] truncate group-hover:bg-gray-50" title={brief.brand?.name || 'Unknown'}>
                        {brief.brand?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[150px] truncate group-hover:bg-gray-50" title={brief.resource?.name || 'Unassigned'}>
                        <div className="flex items-center">
                          <span className="truncate">{brief.resource?.name || 'Unassigned'}</span>
                          {brief.resource_id && getResourceUtilizationDisplay(brief.resource_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[150px] truncate group-hover:bg-gray-50" title={brief.created_by_user?.name || 'Unknown'}>
                        {brief.created_by_user?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 group-hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1">
                            <Link 
                              to={`/briefs/${brief.id}`}
                              className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                              title="View Brief"
                            >
                              <Eye size={16} />
                            </Link>
                            <button
                              onClick={() => handleDuplicate(brief)}
                              className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                              title="Duplicate Brief"
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              onClick={() => handleArchive(brief.id)}
                              className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                              title="Archive Brief"
                            >
                              <Archive size={16} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
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
      ) : (
        // Calendar view
        <MarketingCalendar 
          briefs={filteredBriefs}
          campaigns={campaigns}
        />
      )}
    </div>
  );
};

export default BriefsList;
