import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getPriorityColor, getStatusColor } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Calendar, FileText, Clock, AlertTriangle, ChevronRight, Plus } from 'lucide-react';
import type { Brief, Tradeshow, BriefStatus, Priority } from '../types';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [tradeshows, setTradeshows] = useState<Tradeshow[]>([]);
  const [stats, setStats] = useState({
    totalBriefs: 0,
    pendingApproval: 0,
    inProgress: 0,
    resourceConflicts: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch briefs with error handling
        try {
          const { data: briefsData, error: briefsError } = await supabase
            .from('briefs')
            .select(`
              id,
              title,
              status,
              start_date,
              due_date,
              priority,
              resource:resources(name)
            `)
            .order('due_date', { ascending: true })
            .limit(5);

          if (briefsError) {
            console.error('Error fetching briefs:', briefsError);
            setBriefs([]);
          } else if (briefsData) {
            const typedBriefs = briefsData.map(brief => {
              const resourceData = Array.isArray(brief.resource) ? brief.resource[0] : brief.resource;
              const typedBrief: Brief = {
                ...brief,
                status: brief.status as BriefStatus,
                priority: brief.priority as Priority | undefined,
                resource: resourceData && typeof resourceData === 'object' && 'name' in resourceData
                  ? { name: String(resourceData.name) }
                  : null
              };
              return typedBrief;
            });
            setBriefs(typedBriefs);
            
            // Calculate stats with type-safe filters
            const stats = {
              totalBriefs: typedBriefs.length,
              pendingApproval: typedBriefs.filter(b => b.status === 'pending_approval').length,
              inProgress: typedBriefs.filter(b => b.status === 'in_progress').length,
              resourceConflicts: 0
            };
            setStats(stats);
          }
        } catch (err) {
          console.error('Error processing briefs:', err);
        }

        // Fetch tradeshows with error handling
        try {
          const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
          const { data: tradeshowsData, error: tradeshowsError } = await supabase
            .from('tradeshows')
            .select('*')
            .gte('end_date', today)
            .order('start_date', { ascending: true })
            .limit(5);

          if (tradeshowsError) {
            console.error('Error fetching tradeshows:', tradeshowsError);
          } else {
            setTradeshows(tradeshowsData || []);
          }
        } catch (err) {
          console.error('Error processing tradeshows:', err);
        }

      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load some dashboard data. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const today = new Date();
  const upcomingDeadlines = briefs.filter(brief => {
    try {
      const dueDate = new Date(brief.due_date);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= 0;
    } catch (err) {
      console.error('Error processing brief date:', err);
      return false;
    }
  });

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
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
                  {brief.priority && (
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(brief.priority)}`}>
                      {brief.priority}
                    </span>
                  )}
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Tradeshows</h3>
        {tradeshows.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {tradeshows.map((tradeshow) => (
              <div key={tradeshow.id} className="py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{tradeshow.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(tradeshow.start_date)} - {formatDate(tradeshow.end_date)}
                    </p>
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                    Tradeshow
                  </div>
                </div>
                {tradeshow.description && (
                  <p className="mt-2 text-sm text-gray-600">{tradeshow.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No upcoming tradeshows.</p>
        )}
        {tradeshows.length > 0 && (
          <div className="mt-4">
            <Link to="/tradeshows" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all tradeshows →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
