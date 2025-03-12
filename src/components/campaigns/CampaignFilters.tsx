import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Search, X } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
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

interface CampaignFiltersProps {
  onFilterChange: (filters: Filters) => void;
}

const CampaignFilters: React.FC<CampaignFiltersProps> = ({ onFilterChange }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    brand: searchParams.get('brand') || '',
    dateRange: {
      start: searchParams.get('dateStart') || '',
      end: searchParams.get('dateEnd') || '',
    },
  });

  useEffect(() => {
    const fetchBrands = async () => {
      const { data } = await supabase
        .from('brands')
        .select('id, name')
        .order('name');
      
      setBrands(data || []);
    };

    fetchBrands();
  }, []);

  const handleFilterChange = (key: keyof Filters, value: string | { start: string; end: string }) => {
    const newFilters = {
      ...filters,
      [key]: value,
    };
    setFilters(newFilters);

    // Update URL params
    const params = new URLSearchParams();
    params.set('search', newFilters.search);
    if (newFilters.status) params.set('status', newFilters.status);
    if (newFilters.brand) params.set('brand', newFilters.brand);
    if (newFilters.dateRange.start) params.set('dateStart', newFilters.dateRange.start);
    if (newFilters.dateRange.end) params.set('dateEnd', newFilters.dateRange.end);
    setSearchParams(params);

    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const emptyFilters: Filters = {
      search: '',
      status: '',
      brand: '',
      dateRange: {
        start: '',
        end: '',
      },
    };
    setFilters(emptyFilters);
    setSearchParams(new URLSearchParams());
    onFilterChange(emptyFilters);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Search
          </label>
          <div className="mt-1 relative">
            <Input
              type="text"
              id="search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search campaigns..."
              className="pr-10"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => handleFilterChange('search', '')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
            value={filters.brand}
            onChange={(e) => handleFilterChange('brand', e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label htmlFor="dateStart" className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <Input
            type="date"
            id="dateStart"
            value={filters.dateRange.start}
            onChange={(e) =>
              handleFilterChange('dateRange', {
                ...filters.dateRange,
                start: e.target.value,
              })
            }
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="dateEnd" className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <Input
            type="date"
            id="dateEnd"
            value={filters.dateRange.end}
            onChange={(e) =>
              handleFilterChange('dateRange', {
                ...filters.dateRange,
                end: e.target.value,
              })
            }
            className="mt-1"
          />
        </div>
      </div>

      {/* Reset Filters */}
      {(filters.search || filters.status || filters.brand || filters.dateRange.start || filters.dateRange.end) && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default CampaignFilters; 