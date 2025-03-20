import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format, isAfter, isBefore, isToday } from 'date-fns';
import CampaignFilters from '../components/campaigns/CampaignFilters';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Calendar, 
  Grid, 
  TableIcon, 
  Filter, 
  Layers, 
  Plus, 
  Search, 
  ArrowUp, 
  ArrowDown, 
  ChevronDown, 
  Clock,
  MoreHorizontal,
  Copy,
  Trash,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  brand_id: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'complete' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
  brand: {
    name: string;
  };
  briefs: { count: number }[];
}

interface Filters {
  search: string;
  status: string;
  brand: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export default function CampaignsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  
  // Add view mode state
  const [viewMode, setViewMode] = useState<'list' | 'card' | 'calendar' | 'timeline'>('list');
  
  // Add sorting state
  const [sortField, setSortField] = useState<string>('start_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Add grouping state
  const [groupBy, setGroupBy] = useState<'none' | 'status' | 'brand'>('none');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Add selection state for batch actions
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  
  // Add isFilterOpen state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    brand: searchParams.get('brand') || '',
    dateRange: {
      start: searchParams.get('dateStart') || '',
      end: searchParams.get('dateEnd') || '',
    },
  });
  
  // Calculate total pages
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  
  // Group campaigns based on groupBy selection
  const groupedCampaigns = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Campaigns': campaigns };
    }
    
    return campaigns.reduce<Record<string, Campaign[]>>((acc, campaign) => {
      let groupKey = '';
      
      if (groupBy === 'status') {
        groupKey = campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1);
      } else if (groupBy === 'brand') {
        groupKey = campaign.brand?.name || 'No Brand';
      }
      
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      
      acc[groupKey].push(campaign);
      return acc;
    }, {});
  }, [campaigns, groupBy]);
  
  // Function to expand all groups
  const expandAllGroups = () => {
    const allGroups = Object.keys(groupedCampaigns);
    const expandedState: Record<string, boolean> = {};
    allGroups.forEach(group => {
      expandedState[group] = false; // false = expanded
    });
    setCollapsedGroups(expandedState);
  };
  
  // Function to collapse all groups
  const collapseAllGroups = () => {
    const allGroups = Object.keys(groupedCampaigns);
    const collapsedState: Record<string, boolean> = {};
    allGroups.forEach(group => {
      collapsedState[group] = true; // true = collapsed
    });
    setCollapsedGroups(collapsedState);
  };
  
  // Toggle group collapse state
  const toggleGroupCollapse = (group: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const fetchCampaigns = useCallback(async (filters: Filters) => {
    try {
      setLoading(true);
      setError(null);

      // Calculate pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('campaigns')
        .select(`
          *,
          brand:brands(id, name),
          briefs(count)
        `, { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.brand) {
        query = query.eq('brand_id', filters.brand);
      }

      if (filters.dateRange.start) {
        query = query.gte('start_date', filters.dateRange.start);
      }

      if (filters.dateRange.end) {
        query = query.lte('end_date', filters.dateRange.end);
      }

      // Apply sorting
      query = query.order(sortField, { ascending: sortDirection === 'asc' });
      
      // Apply pagination if not in calendar or timeline view
      if (viewMode !== 'calendar' && viewMode !== 'timeline') {
        query = query.range(from, to);
      }

      const { data, error: queryError, count } = await query;

      if (queryError) {
        console.error('Error fetching campaigns:', queryError);
        setError(`Failed to load campaigns: ${queryError.message}`);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('No campaigns found');
        setCampaigns([]);
      } else {
        console.log(`Fetched ${data.length} campaigns`);
        
        // Validate campaign data
        const validCampaigns = data.filter(campaign => {
          if (!campaign || !campaign.id) {
            console.warn('Found invalid campaign data:', campaign);
            return false;
          }
          return true;
        });
        
        setCampaigns(validCampaigns);
        
        // Update total count for pagination
        if (count !== null) {
          setTotalCount(count);
        }
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortField, sortDirection, viewMode]);

  // Initial load with URL params
  useEffect(() => {
    // Fetch brands for filters
    const fetchBrands = async () => {
      try {
        const { data } = await supabase
          .from('brands')
          .select('id, name')
          .order('name');
        
        setBrands(data || []);
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };
    
    fetchBrands();
    
    // Get initial view mode from URL
    const viewModeParam = searchParams.get('view') as 'list' | 'card' | 'calendar' | 'timeline' | null;
    if (viewModeParam && ['list', 'card', 'calendar', 'timeline'].includes(viewModeParam)) {
      setViewMode(viewModeParam);
    }
    
    // Get initial sort from URL
    const sortFieldParam = searchParams.get('sortField');
    const sortDirParam = searchParams.get('sortDir') as 'asc' | 'desc' | null;
    
    if (sortFieldParam) {
      setSortField(sortFieldParam);
    }
    
    if (sortDirParam && ['asc', 'desc'].includes(sortDirParam)) {
      setSortDirection(sortDirParam);
    }
    
    // Get initial group by from URL
    const groupByParam = searchParams.get('groupBy') as 'none' | 'status' | 'brand' | null;
    if (groupByParam && ['none', 'status', 'brand'].includes(groupByParam)) {
      setGroupBy(groupByParam);
    }
    
    // Get initial page from URL
    const pageParam = searchParams.get('page');
    if (pageParam && !isNaN(Number(pageParam))) {
      setCurrentPage(Number(pageParam));
    }
    
    // Fetch campaigns with initial filters
    fetchCampaigns(filters);
  }, [fetchCampaigns, searchParams, filters]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    fetchCampaigns(newFilters);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    
    // Update filter params
    if (newFilters.search) params.set('search', newFilters.search);
    else params.delete('search');
    
    if (newFilters.status) params.set('status', newFilters.status);
    else params.delete('status');
    
    if (newFilters.brand) params.set('brand', newFilters.brand);
    else params.delete('brand');
    
    if (newFilters.dateRange.start) params.set('dateStart', newFilters.dateRange.start);
    else params.delete('dateStart');
    
    if (newFilters.dateRange.end) params.set('dateEnd', newFilters.dateRange.end);
    else params.delete('dateEnd');
    
    // Add current view mode, sort, group to URL
    params.set('view', viewMode);
    params.set('sortField', sortField);
    params.set('sortDir', sortDirection);
    params.set('groupBy', groupBy);
    params.set('page', currentPage.toString());
    
    setSearchParams(params);
  };

  // Handle sort change
  const handleSortChange = (field: string) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.set('sortField', field);
    params.set('sortDir', field === sortField && sortDirection === 'asc' ? 'desc' : 'asc');
    setSearchParams(params);
    
    // Fetch campaigns with updated sort
    fetchCampaigns(filters);
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'list' | 'card' | 'calendar' | 'timeline') => {
    setViewMode(mode);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.set('view', mode);
    setSearchParams(params);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    
    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
    
    // Fetch campaigns with updated page
    fetchCampaigns(filters);
  };

  // Get status color based on campaign status
  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'complete':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calculate campaign progress based on dates
  const calculateProgress = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    // Campaign hasn't started yet
    if (isBefore(today, start)) {
      return 0;
    }
    
    // Campaign has ended
    if (isAfter(today, end)) {
      return 100;
    }
    
    // Campaign is in progress
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = today.getTime() - start.getTime();
    
    return Math.round((elapsed / totalDuration) * 100);
  };

  // Get time status (upcoming, in progress, overdue)
  const getTimeStatus = (startDate: string, endDate: string, status: Campaign['status']): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    if (status === 'cancelled') {
      return 'Cancelled';
    }
    
    if (status === 'complete') {
      return 'Complete';
    }
    
    if (isBefore(today, start)) {
      return 'Upcoming';
    }
    
    if (isAfter(today, end)) {
      return 'Overdue';
    }
    
    return 'In Progress';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Campaigns</h2>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* View toggle buttons */}
            <div className="flex rounded-md shadow-sm mr-2" role="group">
              <button
                type="button"
                onClick={() => handleViewModeChange('list')}
                className={`px-3 py-2 text-sm font-medium ${
                  viewMode === 'list' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-300 rounded-l-md flex items-center`}
              >
                <TableIcon className="h-4 w-4 mr-1" />
                Table
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('card')}
                className={`px-3 py-2 text-sm font-medium ${
                  viewMode === 'card' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border-t border-b border-r border-gray-300 flex items-center`}
              >
                <Grid className="h-4 w-4 mr-1" />
                Cards
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('timeline')}
                className={`px-3 py-2 text-sm font-medium ${
                  viewMode === 'timeline' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border-t border-b border-r border-gray-300 flex items-center`}
              >
                <Clock className="h-4 w-4 mr-1" />
                Timeline
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('calendar')}
                className={`px-3 py-2 text-sm font-medium ${
                  viewMode === 'calendar' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border-t border-b border-r border-gray-300 rounded-r-md flex items-center`}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Calendar
              </button>
            </div>
            
            {/* Group by dropdown */}
            {(viewMode === 'list' || viewMode === 'card') && (
              <div className="relative z-10 flex gap-1">
                <Button 
                  variant="outline" 
                  className="px-3 py-2 flex items-center gap-1"
                >
                  <Layers className="h-4 w-4" />
                  <span className="mr-1">Group by:</span>
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as 'none' | 'status' | 'brand')}
                    className="border-none bg-transparent focus:ring-0 text-sm p-0 -ml-1 cursor-pointer"
                  >
                    <option value="none">None</option>
                    <option value="status">Status</option>
                    <option value="brand">Brand</option>
                  </select>
                </Button>
              </div>
            )}
            
            {/* Filter button */}
            <Button
              variant="outline"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(filters.search || filters.status || filters.brand || filters.dateRange.start || filters.dateRange.end) && (
                <span className="ml-1 inline-flex items-center justify-center bg-blue-100 text-blue-800 rounded-full w-5 h-5 text-xs">
                  {Object.values(filters).filter(v => v && (typeof v === 'string' ? v.length > 0 : (v.start || v.end))).length}
                </span>
              )}
            </Button>
            
            {/* Create campaign button */}
            <Link to="/campaigns/new">
              <Button className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                New Campaign
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Filters section */}
        {isFilterOpen && (
          <div className="mb-6 border border-gray-200 rounded-md p-4 bg-gray-50">
            <CampaignFilters onFilterChange={handleFilterChange} />
          </div>
        )}

        {error ? (
          <div className="bg-red-50 text-red-800 p-4 rounded-md flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : loading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-md shadow">
            <div className="flex flex-col items-center">
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
              <p className="text-gray-500 mb-6 max-w-md">
                {Object.values(filters).some(v => v && (typeof v === 'string' ? v.length > 0 : (v.start || v.end)))
                  ? 'Try adjusting your search filters or create a new campaign.'
                  : 'Get started by creating your first marketing campaign.'}
              </p>
              <Link to="/campaigns/new">
                <Button className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  Create Campaign
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Group header and expand/collapse controls */}
            {groupBy !== 'none' && (
              <div className="mb-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Grouped by: <span className="font-medium">{groupBy === 'status' ? 'Status' : 'Brand'}</span>
                </div>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={expandAllGroups}
                    className="text-xs"
                  >
                    Expand All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={collapseAllGroups}
                    className="text-xs"
                  >
                    Collapse All
                  </Button>
                </div>
              </div>
            )}
            
            {/* LIST VIEW */}
            {viewMode === 'list' && (
              <div className="bg-white shadow overflow-hidden rounded-md">
                {Object.entries(groupedCampaigns).map(([group, groupCampaigns]) => (
                  <div key={group} className="border-b border-gray-200 last:border-b-0">
                    {/* Group header for grouped views */}
                    {groupBy !== 'none' && (
                      <div 
                        className="px-4 py-3 bg-gray-50 cursor-pointer flex justify-between items-center"
                        onClick={() => toggleGroupCollapse(group)}
                      >
                        <div className="font-medium text-gray-700 flex items-center gap-2">
                          {group}
                          <span className="text-gray-500 text-sm font-normal">
                            ({groupCampaigns.length} {groupCampaigns.length === 1 ? 'campaign' : 'campaigns'})
                          </span>
                        </div>
                        <ChevronDown 
                          className={`h-5 w-5 text-gray-500 transform transition-transform ${
                            collapsedGroups[group] ? '' : 'rotate-180'
                          }`} 
                        />
                      </div>
                    )}
                    
                    {/* Campaigns list */}
                    {(!collapsedGroups[group]) && (
                      <ul className="divide-y divide-gray-200">
                        {/* Table header */}
                        <li className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-4 flex items-center cursor-pointer" onClick={() => handleSortChange('name')}>
                              <span>Name</span>
                              {sortField === 'name' && (
                                sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              )}
                            </div>
                            <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSortChange('brand_id')}>
                              <span>Brand</span>
                              {sortField === 'brand_id' && (
                                sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              )}
                            </div>
                            <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSortChange('status')}>
                              <span>Status</span>
                              {sortField === 'status' && (
                                sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              )}
                            </div>
                            <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSortChange('start_date')}>
                              <span>Start Date</span>
                              {sortField === 'start_date' && (
                                sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              )}
                            </div>
                            <div className="col-span-2 flex items-center cursor-pointer" onClick={() => handleSortChange('end_date')}>
                              <span>End Date</span>
                              {sortField === 'end_date' && (
                                sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
                              )}
                            </div>
                          </div>
                        </li>
                        
                        {/* Table rows */}
                        {groupCampaigns.map((campaign) => (
                          <li key={campaign.id}>
                            <Link
                              to={`/campaigns/${campaign.id}`}
                              className="block hover:bg-gray-50"
                            >
                              <div className="px-6 py-4">
                                <div className="grid grid-cols-12 gap-2">
                                  <div className="col-span-4">
                                    <div className="flex items-center">
                                      <div>
                                        <p className="text-sm font-medium text-blue-600 truncate">
                                          {campaign.name}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500 truncate max-w-xs">
                                          {campaign.description || 'No description'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="col-span-2 flex items-center">
                                    <span className="text-sm text-gray-900">
                                      {campaign.brand?.name || 'No brand'}
                                    </span>
                                  </div>
                                  <div className="col-span-2 flex items-center">
                                    <span className={`px-2 py-1 inline-flex text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                    </span>
                                  </div>
                                  <div className="col-span-2 flex items-center">
                                    <span className="text-sm text-gray-500">
                                      {format(new Date(campaign.start_date), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                  <div className="col-span-2 flex items-center">
                                    <span className="text-sm text-gray-500">
                                      {format(new Date(campaign.end_date), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* CARD VIEW */}
            {viewMode === 'card' && (
              <div className="space-y-6">
                {Object.entries(groupedCampaigns).map(([group, groupCampaigns]) => (
                  <div key={group} className="space-y-3">
                    {/* Group header for grouped views */}
                    {groupBy !== 'none' && (
                      <div 
                        className="px-4 py-3 bg-white shadow rounded-md cursor-pointer flex justify-between items-center"
                        onClick={() => toggleGroupCollapse(group)}
                      >
                        <div className="font-medium text-gray-700 flex items-center gap-2">
                          {group}
                          <span className="text-gray-500 text-sm font-normal">
                            ({groupCampaigns.length} {groupCampaigns.length === 1 ? 'campaign' : 'campaigns'})
                          </span>
                        </div>
                        <ChevronDown 
                          className={`h-5 w-5 text-gray-500 transform transition-transform ${
                            collapsedGroups[group] ? '' : 'rotate-180'
                          }`} 
                        />
                      </div>
                    )}
                    
                    {/* Campaign cards */}
                    {!collapsedGroups[group] && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupCampaigns.map((campaign) => {
                          const timeStatus = getTimeStatus(campaign.start_date, campaign.end_date, campaign.status);
                          const progress = calculateProgress(campaign.start_date, campaign.end_date);
                          
                          return (
                            <Link key={campaign.id} to={`/campaigns/${campaign.id}`} className="block">
                              <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                                <div className="p-4 flex-grow">
                                  <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-md font-medium text-blue-600 truncate max-w-[70%]">{campaign.name}</h3>
                                    <span className={`px-2 py-1 inline-flex text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                    </span>
                                  </div>
                                  
                                  <p className="text-sm text-gray-500 mb-3 line-clamp-2 h-10">
                                    {campaign.description || 'No description provided'}
                                  </p>
                                  
                                  <div className="text-xs text-gray-500 mb-1 flex justify-between">
                                    <span>Progress</span>
                                    <span>{timeStatus}</span>
                                  </div>
                                  
                                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                                    <div 
                                      className={`h-1.5 rounded-full ${
                                        timeStatus === 'Overdue' ? 'bg-red-600' :
                                        timeStatus === 'Complete' ? 'bg-green-600' :
                                        timeStatus === 'Cancelled' ? 'bg-gray-400' :
                                        'bg-blue-600'
                                      }`} 
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                                
                                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                                  <div className="flex justify-between">
                                    <div>
                                      <span className="block text-xs text-gray-500">Brand</span>
                                      <span className="block text-sm font-medium text-gray-900">{campaign.brand?.name || 'No brand'}</span>
                                    </div>
                                    <div>
                                      <span className="block text-xs text-gray-500">Briefs</span>
                                      <span className="block text-sm font-medium text-center text-gray-900">{campaign.briefs?.[0]?.count || 0}</span>
                                    </div>
                                    <div>
                                      <span className="block text-xs text-gray-500">Timeline</span>
                                      <span className="block text-sm text-gray-900">
                                        {format(new Date(campaign.start_date), 'MMM d')} - {format(new Date(campaign.end_date), 'MMM d, yy')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination controls */}
            {(viewMode === 'list' || viewMode === 'card') && totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span className="font-medium">{totalCount}</span> campaigns
                </div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                          pageNum === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 