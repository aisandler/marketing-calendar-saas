import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Brand {
  id: string;
  name: string;
}

interface FilterProps {
  onFilterChange: (filters: {
    search: string;
    status: string;
    brand: string;
    dateRange: {
      start: string;
      end: string;
    };
  }) => void;
}

export default function CampaignFilters({ onFilterChange }: FilterProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [brand, setBrand] = useState(searchParams.get('brand') || '');
  const [dateStart, setDateStart] = useState(searchParams.get('dateStart') || '');
  const [dateEnd, setDateEnd] = useState(searchParams.get('dateEnd') || '');

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    const filters = {
      search,
      status,
      brand,
      dateRange: {
        start: dateStart,
        end: dateEnd,
      },
    };

    // Update URL params
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (brand) params.set('brand', brand);
    if (dateStart) params.set('dateStart', dateStart);
    if (dateEnd) params.set('dateEnd', dateEnd);
    setSearchParams(params);

    // Notify parent component
    onFilterChange(filters);
  }, [search, status, brand, dateStart, dateEnd, setSearchParams, onFilterChange]);

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

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setBrand('');
    setDateStart('');
    setDateEnd('');
  };

  return (
    <div className="bg-white shadow sm:rounded-lg mb-6">
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="complete">Complete</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Brand */}
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
              Brand
            </label>
            <select
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label htmlFor="dateStart" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="dateStart"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="dateEnd" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="dateEnd"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {(search || status || brand || dateStart || dateEnd) && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 