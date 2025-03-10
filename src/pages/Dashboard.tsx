import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getPriorityColor, getStatusColor } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Calendar, FileText, Clock, AlertTriangle, ChevronRight, Plus, MapPin } from 'lucide-react';
import type { Brief, Campaign, Resource } from '../types';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState({
    totalBriefs: 0,
    pendingApproval: 0,
    inProgress: 0,
    resourceConflicts: 0
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch briefs
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select('*, campaigns(*), resources(*), users!briefs_created_by_fkey(*)')
          .order('due_date', { ascending: true })
          .limit(5);
        
        if (briefsError) throw briefsError;
        
        // Fetch campaigns (tradeshows)
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*')
          .gte('start_date', new Date().toISOString().split('T')[0])
          .order('start_date', { ascending: true })
          .eq('campaign_type', 'tradeshow')
          .limit(5);
        
        if (campaignsError) throw campaignsError;
        
        // Fetch resources
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('*');
        
        if (resourcesError) throw resourcesError;
        
        // Set state
        setBriefs(briefsData as Brief[]);
        setCampaigns(campaignsData as Campaign[]);
        setResources(resourcesData as Resource[]);
        
        // Calculate stats
        if (briefsData) {
          const totalBriefs = briefsData.length;
          const pendingApproval = briefsData.filter(brief => brief.status === 'pending_approval').length;
          const inProgress = briefsData.filter(brief => brief.status === 'in_progress').length;
          
          // Count resource conflicts - briefs with same resource and overlapping dates
          let resourceConflicts = 0;
          const resourceMap = new Map();
          
          briefsData.forEach(brief => {
            if (brief.resource_id) {
              const key = brief.resource_id;
              if (!resourceMap.has(key)) {
                resourceMap.set(key, []);
              }
              resourceMap.get(key).push({
                start: new Date(brief.start_date),
                end: new Date(brief.due_date),
                id: brief.id
              });
            }
          });
          
          // Check for overlapping date ranges
          resourceMap.forEach(briefs => {
            if (briefs.length > 1) {
              for (let i = 0; i < briefs.length; i++) {
                for (let j = i + 1; j < briefs.length; j++) {
                  const a = briefs[i];
                  const b = briefs[j];
                  if ((a.start <= b.end) && (a.end >= b.start)) {
                    resourceConflicts++;
                  }
                }
              }
            }
          });
          
          setStats({
            totalBriefs,
            pendingApproval,
            inProgress,
            resourceConflicts
          });
          
          console.log('Dashboard stats calculated:', {
            totalBriefs,
            pendingApproval,
            inProgress,
            resourceConflicts
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const today = new Date();
  const upcomingDeadlines = briefs.filter(brief => {
    const dueDate = new Date(brief.due_date);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
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
      {/* Welcome banner */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Welcome back, {user?.name}</h2>
            <p className="text-gray-600 mt-1">Here's what's happening with your marketing projects today.</p>
          </div>
          <div>
            <Link to="/briefs/create">
              <Button className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Brief
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Briefs</h3>
              <p className="text-3xl font-semibold text-gray-900">{stats.totalBriefs}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Pending Approval</h3>
              <p className="text-3xl font-semibold text-gray-900">{stats.pendingApproval}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
              <p className="text-3xl font-semibold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Resource Conflicts</h3>
              <p className="text-3xl font-semibold text-gray-900">{stats.resourceConflicts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Deadlines (Next 7 Days)</h3>
        {upcomingDeadlines.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {upcomingDeadlines.map((brief) => (
              <div key={brief.id} className="py-4 flex items-center">
                <div className="min-w-0 flex-1">
                  <Link to={`/briefs/${brief.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                    {brief.title}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">
                    Due: {formatDate(brief.due_date)}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(brief.priority)}`}>
                    {brief.priority}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(brief.status)}`}>
                    {brief.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No deadlines in the next 7 days.</p>
        )}
        {upcomingDeadlines.length > 0 && (
          <div className="mt-4">
            <Link to="/briefs" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all briefs →
            </Link>
          </div>
        )}
      </div>

      {/* Upcoming tradeshows */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Campaigns</h3>
        {campaigns.length > 0 ? (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                  </span>
                </div>
                {campaign.location && (
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{campaign.location}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No upcoming campaigns.</p>
        )}
        {campaigns.length > 0 && (
          <div className="mt-4 text-right">
            <Link to="/campaigns" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all campaigns →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
