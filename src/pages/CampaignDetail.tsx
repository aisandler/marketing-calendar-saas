import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format, differenceInDays } from 'date-fns';
import { ResourceType, Brief as BaseBrief, BriefStatus } from '../types/index';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { AlertTriangle, Calendar, Clock, Edit, Plus, Trash2, ArrowLeft } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  campaign_type?: 'tradeshow' | 'event';
  brand_id: string;
  start_date: string;
  end_date: string;
  location?: string | null;
  status: 'draft' | 'active' | 'complete' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
  brand?: {
    id: string;
    name: string;
  };
}

// Define a campaign-specific Brief interface to handle the resource structure from the API
interface Brief {
  id: string;
  title: string;
  status: BriefStatus;
  start_date: string;
  due_date: string;
  resource_id?: string;
  campaign_id?: string;
  brand_id?: string;
  estimated_hours?: number;
  expenses?: number;
  resource?: {
    id: string;
    name: string;
    type: ResourceType;
    hourly_rate?: number;
  } | null;
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Activity history state
  const [activityHistory, setActivityHistory] = useState<{
    id: string;
    user_name: string;
    action: string;
    created_at: string;
  }[]>([]);
  
  // Cost summary states
  const [totalResourceCost, setTotalResourceCost] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [resourceCostByType, setResourceCostByType] = useState<{[key: string]: number}>({});
  const [costTimeline, setCostTimeline] = useState<{date: string; cost: number}[]>([]);
  const [campaignProgress, setCampaignProgress] = useState(0);

  const calculateCosts = useCallback(() => {
    let resourceCost = 0;
    let expenses = 0;
    const costByType: {[key: string]: number} = {
      internal: 0,
      agency: 0,
      freelancer: 0
    };
    
    // Create timeline data structure
    const timelineData: {[key: string]: number} = {};
    
    briefs.forEach(brief => {
      // Calculate resource cost if hourly rate exists
      if (brief.resource?.hourly_rate && brief.estimated_hours) {
        const briefResourceCost = brief.resource.hourly_rate * brief.estimated_hours;
        resourceCost += briefResourceCost;
        
        // Add to resource type total
        const resourceType = brief.resource.type || 'other';
        costByType[resourceType] = (costByType[resourceType] || 0) + briefResourceCost;
        
        // Add to timeline
        const briefDate = format(new Date(brief.due_date), 'yyyy-MM-dd');
        timelineData[briefDate] = (timelineData[briefDate] || 0) + briefResourceCost;
      }
      
      // Add expenses
      if (brief.expenses) {
        expenses += brief.expenses;
        
        // Add expenses to timeline
        const briefDate = format(new Date(brief.due_date), 'yyyy-MM-dd');
        timelineData[briefDate] = (timelineData[briefDate] || 0) + brief.expenses;
      }
    });
    
    // Convert timeline data to array and sort by date
    const timeline = Object.entries(timelineData)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setTotalResourceCost(resourceCost);
    setTotalExpenses(expenses);
    setTotalCost(resourceCost + expenses);
    setResourceCostByType(costByType);
    setCostTimeline(timeline);
  }, [briefs]);
  
  // Calculate costs whenever briefs change
  useEffect(() => {
    calculateCosts();
  }, [calculateCosts]);

  const fetchCampaignData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!id) {
        setError('Campaign ID is missing');
        setLoading(false);
        return;
      }
      
      console.log('Fetching campaign with ID:', id);
      
      // Fetch campaign details with better error handling
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('*, brand:brands(id, name)')
        .eq('id', id)
        .single();

      if (campaignError) {
        console.error('Campaign fetch error:', campaignError);
        if (campaignError.code === 'PGRST116') {
          setError('Campaign not found. It may have been deleted or you may not have permission to view it.');
        } else {
          setError(`Failed to load campaign: ${campaignError.message}`);
        }
        setLoading(false);
        return;
      }
      
      if (!campaignData) {
        setError('Campaign not found');
        setLoading(false);
        return;
      }
      
      console.log('Campaign data retrieved:', campaignData.id);
      setCampaign(campaignData);

      // Only fetch briefs if we have a valid campaign
      try {
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select(`
            id, 
            title, 
            status, 
            start_date, 
            due_date, 
            resource_id, 
            estimated_hours, 
            expenses,
            resource:resources(id, name, type, hourly_rate)
          `)
          .eq('campaign_id', id)
          .order('start_date');

        if (briefsError) {
          console.error('Briefs fetch error:', briefsError);
        } else {
          // Use type assertion to handle the API response structure
          setBriefs(briefsData as unknown as Brief[] || []);
        }
        
        // Fetch campaign activity history
        const { data: activityData, error: activityError } = await supabase
          .from('campaign_activity')
          .select(`
            id,
            user_name,
            action,
            created_at
          `)
          .eq('campaign_id', id)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (activityError) {
          console.error('Activity fetch error:', activityError);
        } else {
          setActivityHistory(activityData || []);
        }
      } catch (briefErr) {
        console.error('Error in briefs fetch:', briefErr);
        // Don't fail the whole page if just briefs fail to load
      }

    } catch (err) {
      console.error('Error fetching campaign data:', err);
      setError('Failed to load campaign data.');
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  // Fetch campaign data when ID changes
  useEffect(() => {
    if (id) {
      fetchCampaignData();
    }
  }, [id, fetchCampaignData]);

  // Calculate campaign progress
  useEffect(() => {
    if (campaign) {
      const startDate = new Date(campaign.start_date);
      const endDate = new Date(campaign.end_date);
      const today = new Date();
      
      if (today < startDate) {
        setCampaignProgress(0);
      } else if (today > endDate) {
        setCampaignProgress(100);
      } else {
        const totalDuration = differenceInDays(endDate, startDate) || 1; // Avoid division by zero
        const elapsedDuration = differenceInDays(today, startDate);
        const progress = Math.round((elapsedDuration / totalDuration) * 100);
        setCampaignProgress(progress);
      }
    }
  }, [campaign]);

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'complete':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBriefStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      case 'complete':
        return 'bg-indigo-100 text-indigo-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <div className="h-8 bg-gray-200 rounded-full w-8 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
          {error || 'Campaign not found.'}
        </div>
        <div className="mt-4">
          <Link
            to="/campaigns"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center mb-4 md:mb-0">
          <Link
            to="/campaigns"
            className="text-gray-500 hover:text-gray-700 mr-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {campaign.name}
            </h1>
            <div className="mt-1 flex items-center">
              <span className="text-sm text-gray-500 mr-3">
                Brand: {campaign.brand?.name || 'Unknown'}
              </span>
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                {campaign.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/briefs/create?campaign=${id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Brief
          </Link>
          <Link
            to={`/campaigns/${id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Link>
        </div>
      </div>

      {/* Campaign Progress */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-md font-medium text-gray-900">Campaign Progress</h3>
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            {format(new Date(campaign.start_date), 'MMM d, yyyy')} - {format(new Date(campaign.end_date), 'MMM d, yyyy')}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${campaignProgress}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>Start</span>
          <span>{campaignProgress}% Complete</span>
          <span>End</span>
        </div>
      </div>

      {/* Main content with two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - details and briefs */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg mb-6">
            <Tabs className="w-full">
              <TabsList className="px-6 pt-4">
                <TabsTrigger 
                  isActive={activeTab === 'overview'} 
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  isActive={activeTab === 'briefs'} 
                  onClick={() => setActiveTab('briefs')}
                >
                  Briefs
                </TabsTrigger>
                <TabsTrigger 
                  isActive={activeTab === 'activity'} 
                  onClick={() => setActiveTab('activity')}
                >
                  Activity
                </TabsTrigger>
              </TabsList>
              
              <TabsContent 
                value="overview" 
                activeValue={activeTab}
                className="p-6"
              >
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {campaign.description || 'No description provided'}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Campaign Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {campaign.campaign_type ? campaign.campaign_type.charAt(0).toUpperCase() + campaign.campaign_type.slice(1) : 'Standard'}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Location</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {campaign.location || 'Not specified'}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {format(new Date(campaign.start_date), 'MMMM d, yyyy')}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">End Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {format(new Date(campaign.end_date), 'MMMM d, yyyy')}
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Duration</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {differenceInDays(new Date(campaign.end_date), new Date(campaign.start_date))} days
                    </dd>
                  </div>
                  
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {format(new Date(campaign.created_at), 'MMMM d, yyyy')}
                    </dd>
                  </div>
                </dl>
              </TabsContent>
              
              <TabsContent 
                value="briefs" 
                activeValue={activeTab}
                className="border-t border-gray-200"
              >
                <div className="divide-y divide-gray-200">
                  {briefs.map((brief) => (
                    <Link
                      key={brief.id}
                      to={`/briefs/${brief.id}`}
                      className="block hover:bg-gray-50"
                    >
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-indigo-600 truncate">
                              {brief.title}
                            </p>
                            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBriefStatusColor(brief.status)}`}>
                              {brief.status}
                            </span>
                          </div>
                          <div className="ml-2 flex-shrink-0 flex items-center">
                            {brief.resource && (
                              <span className="text-sm text-gray-500 mr-3">
                                {brief.resource.name}
                              </span>
                            )}
                            {brief.resource?.hourly_rate && brief.estimated_hours ? (
                              <span className="text-sm font-medium text-emerald-600">
                                ${(brief.resource.hourly_rate * brief.estimated_hours + (brief.expenses || 0)).toFixed(2)}
                              </span>
                            ) : brief.expenses ? (
                              <span className="text-sm font-medium text-emerald-600">
                                ${brief.expenses.toFixed(2)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              {format(new Date(brief.start_date), 'MMM d')} - {format(new Date(brief.due_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="flex items-center mt-2 sm:mt-0">
                            {brief.estimated_hours && (
                              <p className="text-xs text-gray-500">
                                <span className="font-medium">{brief.estimated_hours}</span> hrs
                                {brief.resource?.hourly_rate && (
                                  <span className="ml-1">
                                    @ ${brief.resource.hourly_rate}/hr
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {briefs.length === 0 && (
                    <div className="px-6 py-10 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No briefs</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by creating a new brief for this campaign.
                      </p>
                      <div className="mt-6">
                        <Link
                          to={`/briefs/create?campaign=${id}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Plus className="-ml-1 mr-2 h-4 w-4" />
                          New Brief
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent 
                value="activity" 
                activeValue={activeTab}
                className="border-t border-gray-200 p-6"
              >
                <h4 className="text-sm font-medium text-gray-700 mb-4">Recent Activity</h4>
                
                {activityHistory.length === 0 ? (
                  <div className="text-center py-6">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Activity for this campaign will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {activityHistory.map((activity, index) => (
                        <li key={activity.id}>
                          <div className="relative pb-8">
                            {index !== activityHistory.length - 1 ? (
                              <span
                                className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                                aria-hidden="true"
                              />
                            ) : null}
                            <div className="relative flex items-start space-x-3">
                              <div className="relative">
                                <span className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ring-8 ring-white">
                                  <span className="text-xs font-medium text-gray-500">
                                    {activity.user_name.split(' ').map(name => name[0]).join('')}
                                  </span>
                                </span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div>
                                  <div className="text-sm">
                                    <span className="font-medium text-gray-900">
                                      {activity.user_name}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 text-sm text-gray-500">
                                    {activity.action}
                                  </p>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                  {format(new Date(activity.created_at), 'MMM d, yyyy • h:mm a')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Right column - cost summary */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Cost Summary
            </h3>
            <div className="space-y-6">
              {/* Cost Breakdown */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Cost Breakdown</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Resource Cost:</dt>
                    <dd className="text-sm font-medium text-gray-900">${totalResourceCost.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Additional Expenses:</dt>
                    <dd className="text-sm font-medium text-gray-900">${totalExpenses.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <dt className="text-sm font-medium text-gray-700">Total Campaign Cost:</dt>
                    <dd className="text-sm font-medium text-emerald-600">${totalCost.toFixed(2)}</dd>
                  </div>
                </dl>
              </div>
              
              {/* Cost by Resource Type */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Cost by Resource Type</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Internal:</dt>
                    <dd className="text-sm font-medium text-gray-900">${(resourceCostByType.internal || 0).toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Agency:</dt>
                    <dd className="text-sm font-medium text-gray-900">${(resourceCostByType.agency || 0).toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Freelancer:</dt>
                    <dd className="text-sm font-medium text-gray-900">${(resourceCostByType.freelancer || 0).toFixed(2)}</dd>
                  </div>
                </dl>
              </div>
              
              {/* Cost Distribution Chart */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Cost Distribution</h4>
                <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                  {Object.entries(resourceCostByType).map(([type, cost]) => {
                    const percentage = totalCost > 0 ? (cost / totalCost) * 100 : 0;
                    const colors = {
                      internal: 'bg-blue-500',
                      agency: 'bg-purple-500',
                      freelancer: 'bg-emerald-500',
                      other: 'bg-gray-500'
                    };
                    const color = colors[type as keyof typeof colors] || colors.other;
                    
                    if (percentage <= 0) return null;
                    
                    return (
                      <div 
                        key={type}
                        className={`h-full ${color} relative inline-block`}
                        style={{ width: `${percentage}%` }}
                        title={`${type}: $${cost.toFixed(2)} (${percentage.toFixed(1)}%)`}
                      />
                    );
                  })}
                  
                  {/* Expenses portion */}
                  {totalExpenses > 0 && (
                    <div 
                      className="h-full bg-amber-500 relative inline-block" 
                      style={{ width: `${totalCost > 0 ? (totalExpenses / totalCost) * 100 : 0}%` }}
                      title={`Expenses: $${totalExpenses.toFixed(2)} (${totalCost > 0 ? ((totalExpenses / totalCost) * 100).toFixed(1) : 0}%)`}
                    />
                  )}
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center text-xs">
                    <div className="w-3 h-3 bg-blue-500 rounded-sm mr-1" />
                    <span>Internal</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="w-3 h-3 bg-purple-500 rounded-sm mr-1" />
                    <span>Agency</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm mr-1" />
                    <span>Freelancer</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className="w-3 h-3 bg-amber-500 rounded-sm mr-1" />
                    <span>Expenses</span>
                  </div>
                </div>
              </div>
              
              {/* Cost Timeline Chart */}
              {costTimeline.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Cost Timeline</h4>
                  <div className="relative h-40 border-b border-l border-gray-300">
                    <div className="absolute bottom-0 left-0 w-full h-full">
                      {/* Y-axis labels */}
                      <div className="absolute -left-10 bottom-0 h-full flex flex-col justify-between text-xs text-gray-500">
                        <div>$</div>
                        <div>$0</div>
                      </div>
                      
                      {/* Timeline bars */}
                      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between h-full px-2">
                        {costTimeline.map((point, index) => {
                          const maxCost = Math.max(...costTimeline.map(p => p.cost));
                          const heightPercentage = maxCost > 0 ? (point.cost / maxCost) * 100 : 0;
                          
                          return (
                            <div 
                              key={index} 
                              className="group relative mx-1 flex-1"
                              style={{ maxWidth: '30px' }}
                            >
                              <div 
                                className="bg-indigo-500 w-full rounded-t-sm" 
                                style={{ height: `${heightPercentage}%` }}
                              ></div>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 mb-1 whitespace-nowrap z-10">
                                {format(new Date(point.date), 'MMM d, yyyy')}: ${point.cost.toFixed(2)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* X-axis labels */}
                  <div className="flex justify-between text-xs text-gray-500 mt-1 px-2">
                    {costTimeline.map((point, index) => (
                      <div 
                        key={index}
                        className="flex-1 text-center overflow-hidden"
                        style={{ maxWidth: '30px' }}
                      >
                        {format(new Date(point.date), 'M/d')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Resource Allocation */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Resource Allocation
            </h3>
            
            {briefs.length === 0 ? (
              <div className="text-sm text-gray-500 text-center p-4 border border-gray-200 rounded-md">
                No resources allocated yet
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group briefs by resource */}
                {Object.entries(
                  briefs.reduce((acc, brief) => {
                    if (brief.resource) {
                      const resourceId = brief.resource.id;
                      if (!acc[resourceId]) {
                        acc[resourceId] = {
                          resource: brief.resource,
                          briefs: [],
                          totalHours: 0
                        };
                      }
                      acc[resourceId].briefs.push(brief);
                      acc[resourceId].totalHours += brief.estimated_hours || 0;
                    }
                    return acc;
                  }, {} as Record<string, { resource: Brief['resource'], briefs: Brief[], totalHours: number }>)
                ).map(([resourceId, data]) => (
                  <div key={resourceId} className="border border-gray-200 rounded-md p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium text-gray-900">{data.resource?.name}</div>
                      <div className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                        {data.resource?.type}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="text-gray-500">{data.briefs.length} brief{data.briefs.length !== 1 ? 's' : ''}</div>
                      <div className="font-medium">{data.totalHours} hours</div>
                    </div>
                    {data.resource?.hourly_rate && (
                      <div className="mt-2 text-right text-xs text-gray-500">
                        ${data.resource.hourly_rate}/hr • ${(data.resource.hourly_rate * data.totalHours).toFixed(2)} total
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Unassigned briefs */}
                {briefs.some(brief => !brief.resource) && (
                  <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                    <div className="font-medium text-gray-900 mb-2">Unassigned</div>
                    <div className="text-sm text-gray-500">
                      {briefs.filter(brief => !brief.resource).length} brief(s) without assigned resources
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 