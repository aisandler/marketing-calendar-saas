import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import CampaignFilters from '../components/campaigns/CampaignFilters';

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
  const [searchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async (filters: Filters) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('campaigns')
        .select(`
          *,
          brand:brands(name)
        `);

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

      // Always sort by start date
      query = query.order('start_date', { ascending: true });

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load with URL params
  useEffect(() => {
    const initialFilters = {
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      brand: searchParams.get('brand') || '',
      dateRange: {
        start: searchParams.get('dateStart') || '',
        end: searchParams.get('dateEnd') || '',
      },
    };
    fetchCampaigns(initialFilters);
  }, [fetchCampaigns, searchParams]);

  const handleFilterChange = (filters: Filters) => {
    fetchCampaigns(filters);
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

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Campaigns</h1>
        <Link
          to="/campaigns/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          New Campaign
        </Link>
      </div>

      <CampaignFilters onFilterChange={handleFilterChange} />

      {error ? (
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          {error}
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
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <li key={campaign.id}>
                <Link
                  to={`/campaigns/${campaign.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {campaign.name}
                        </p>
                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className="text-sm text-gray-500">
                          {campaign.brand?.name}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {campaign.description || 'No description'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          {format(new Date(campaign.start_date), 'MMM d, yyyy')} - {format(new Date(campaign.end_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
            {campaigns.length === 0 && (
              <li className="px-4 py-5 text-center text-sm text-gray-500">
                No campaigns found. {searchParams.toString() ? 'Try adjusting your filters.' : 'Create your first campaign to get started.'}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
} 