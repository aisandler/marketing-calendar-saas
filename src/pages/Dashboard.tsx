import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Calendar, FileText, Clock, AlertTriangle, Plus } from 'lucide-react';

interface Brief {
  id: string;
  title: string;
  status: string;
  start_date: string;
  due_date: string;
}

interface DashboardStats {
  totalBriefs: number;
  pendingApproval: number;
  inProgress: number;
  resourceConflicts: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalBriefs: 0,
    pendingApproval: 0,
    inProgress: 0,
    resourceConflicts: 0
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch briefs
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select('*')
          .order('due_date', { ascending: true });

        if (briefsError) throw briefsError;

        const typedBriefs = (briefsData || []) as Brief[];
        setBriefs(typedBriefs);

        // Calculate stats
        setStats({
          totalBriefs: typedBriefs.length,
          pendingApproval: typedBriefs.filter(b => b.status === 'pending_approval').length,
          inProgress: typedBriefs.filter(b => b.status === 'in_progress').length,
          resourceConflicts: 0 // This can be updated when resource conflict logic is implemented
        });

      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user?.id]);

  // Calculate upcoming deadlines (next 7 days)
  const upcomingDeadlines = briefs.filter(brief => {
    const dueDate = new Date(brief.due_date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Welcome banner */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Welcome back, {user?.email}</h2>
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
                <div className="ml-4 flex-shrink-0">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    brief.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                    brief.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {brief.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No deadlines in the next 7 days</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Retry loading
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
