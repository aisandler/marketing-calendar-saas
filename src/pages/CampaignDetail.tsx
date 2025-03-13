import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Brief as BaseBrief, ResourceType } from '../types';

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

// Extend the base Brief interface with campaign-specific resource details
interface Brief extends Omit<BaseBrief, 'resource'> {
  resource?: {
    id: string;
    name: string;
    type: ResourceType;
    hourly_rate?: number;
  } | null;
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cost summary states
  const [totalResourceCost, setTotalResourceCost] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [resourceCostByType, setResourceCostByType] = useState<{[key: string]: number}>({});
  const [costTimeline, setCostTimeline] = useState<{date: string; cost: number}[]>([]);

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
          setBriefs(briefsData || []);
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
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="p-4">
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          {error || 'Campaign not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {campaign.name}
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              Brand: {campaign.brand?.name || 'Unknown'}
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                {campaign.status}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to={`/campaigns/${id}/edit`}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit Campaign
          </Link>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Campaign Details
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {campaign.description || 'No description provided'}
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
          </dl>
        </div>
      </div>
      
      {/* Cost Summary Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Cost Summary
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <dt className="text-sm font-medium text-gray-700">Total Resource Cost:</dt>
                  <dd className="text-sm font-medium text-gray-900">${totalResourceCost.toFixed(2)}</dd>
                </div>
              </dl>
            </div>
            
            {/* Cost Distribution Chart */}
            <div className="md:col-span-2 mt-4">
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
            <div className="md:col-span-2 mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Cost Timeline</h4>
              
              {costTimeline.length === 0 ? (
                <div className="text-sm text-gray-500 text-center p-4 border border-gray-200 rounded-md">
                  No cost data available for timeline
                </div>
              ) : (
                <>
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
                                className="bg-indigo-500 w-full" 
                                style={{ height: `${heightPercentage}%` }}
                              ></div>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 mb-1 whitespace-nowrap">
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
                  
                  {/* Cumulative cost line */}
                  <div className="mt-6 text-sm font-medium text-gray-700">
                    Cumulative Campaign Cost
                  </div>
                  <div className="relative h-20 mt-2 border-b border-l border-gray-300">
                    <div className="absolute bottom-0 left-0 w-full h-full">
                      {/* Cumulative cost line chart */}
                      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                        <path
                          d={`
                            M ${4} ${95 - (0 / totalCost * 90)}
                            ${costTimeline.map((point, index) => {
                              // Calculate cumulative cost up to this point
                              const cumulativeCost = costTimeline
                                .slice(0, index + 1)
                                .reduce((sum, p) => sum + p.cost, 0);
                              
                              const x = 4 + ((index + 1) / costTimeline.length) * 95;
                              const y = totalCost > 0 
                                ? 95 - (cumulativeCost / totalCost * 90) 
                                : 95;
                              
                              return `L ${x} ${y}`;
                            }).join(' ')}
                          `}
                          fill="none"
                          stroke="#4f46e5"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Campaign Briefs
          </h3>
          <Link
            to={`/briefs/new?campaign=${id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Brief
          </Link>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {briefs.map((brief) => (
              <li key={brief.id}>
                <Link
                  to={`/briefs/${brief.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
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
              </li>
            ))}
            {briefs.length === 0 && (
              <li className="px-4 py-5 text-center text-sm text-gray-500">
                No briefs found. Create your first brief to get started.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
} 