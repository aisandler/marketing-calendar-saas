import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

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

interface Brief {
  id: string;
  title: string;
  status: string;
  start_date: string;
  due_date: string;
  resource: {
    name: string;
  } | null;
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCampaignData();
    }
  }, [id]);

  const fetchCampaignData = async () => {
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
          .select('id, title, status, start_date, due_date')
          .eq('campaign_id', id)
          .order('start_date');

        if (briefsError) {
          console.error('Briefs fetch error:', briefsError);
        } else {
          setBriefs(briefsData?.map(brief => ({
            ...brief,
            resource: null // Resource relationship no longer exists
          })) || []);
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
  };

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
                      {/* Resource information removed as it no longer exists in schema */}
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="text-sm text-gray-500">
                          {/* No resource display */}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {format(new Date(brief.start_date), 'MMM d')} - {format(new Date(brief.due_date), 'MMM d, yyyy')}
                        </p>
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