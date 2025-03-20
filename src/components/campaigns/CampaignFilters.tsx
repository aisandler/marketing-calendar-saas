import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Search, X, Calendar, Filter, RefreshCw } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('brands')
          .select('id, name')
          .order('name');
        
        setBrands(data || []);
      } catch (error) {
        console.error('Error fetching brands:', error);
      } finally {
        setLoading(false);
      }
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

  const hasFilters = filters.search || filters.status || filters.brand || filters.dateRange.start || filters.dateRange.end;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search campaigns by name or description..."
              className="pl-10"
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
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            aria-label="Filter by status"
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
          <select
            value={filters.brand}
            onChange={(e) => handleFilterChange('brand', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            aria-label="Filter by brand"
            disabled={loading}
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Date Range */}
        <div>
          <div className="flex items-center gap-2 mb-1 text-sm text-gray-700">
            <Calendar className="h-4 w-4" />
            <span>Date Range</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) =>
                  handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    start: e.target.value,
                  })
                }
                placeholder="Start date"
                aria-label="Start date"
              />
            </div>
            <div>
              <Input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) =>
                  handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    end: e.target.value,
                  })
                }
                placeholder="End date"
                aria-label="End date"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-3 flex justify-end items-end">
          {hasFilters && (
            <Button 
              variant="outline" 
              onClick={resetFilters}
              className="flex items-center gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignFilters; 