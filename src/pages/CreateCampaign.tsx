import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, CalendarDays, Save, X } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
}

const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  campaign_type: z.enum(['tradeshow', 'event', 'digital', 'print', 'social', 'other']).default('other'),
  brand_id: z.string().min(1, 'Brand is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  location: z.string().optional(),
  status: z.enum(['draft', 'active', 'complete', 'cancelled']).default('draft'),
  budget: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export default function CreateCampaign() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      status: 'draft',
      campaign_type: 'other',
    },
  });

  // Watch form values for preview
  const formValues = watch();
  
  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setBrands(data || []);
    } catch (err) {
      console.error('Error fetching brands:', err);
      setError('Failed to load brands.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CampaignFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user?.id) {
        throw new Error('Unable to get current user information. Please log in again.');
      }
      
      const userId = userData.user.id;
      console.log('Creating campaign for user:', userId);
      
      // Validate dates
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      
      if (endDate < startDate) {
        setError('End date cannot be before start date');
        setIsSubmitting(false);
        return;
      }

      // Prepare campaign data
      const campaignData = {
        ...data,
        created_by: userId,
      };

      // Insert the campaign
      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (error) {
        console.error('Error creating campaign:', error);
        setError(`Failed to create campaign: ${error.message}`);
        return;
      }
      
      if (!campaign || !campaign.id) {
        setError('Failed to create campaign: No ID returned');
        return;
      }
      
      // Also create an activity record
      await supabase.from('campaign_activity').insert([{
        campaign_id: campaign.id,
        user_name: userData.user.email || 'Unknown user',
        action: `Created campaign "${campaign.name}"`,
      }]);
      
      console.log('Campaign created successfully with ID:', campaign.id);
      navigate(`/campaigns/${campaign.id}`);
      
    } catch (err) {
      console.error('Error creating campaign:', err);
      setError('Failed to create campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedBrandName = () => {
    const selectedBrand = brands.find(brand => brand.id === formValues.brand_id);
    return selectedBrand?.name || 'Select a brand';
  };

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
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Create New Campaign
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - form */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="p-6">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-md flex items-center">
                  <X className="w-5 h-5 mr-2 text-red-600" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Campaign Name*
                      </label>
                      <input
                        type="text"
                        id="name"
                        {...register('name')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id="description"
                        rows={3}
                        {...register('description')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Describe the purpose and goals of this campaign"
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700">
                          Brand*
                        </label>
                        <select
                          id="brand_id"
                          {...register('brand_id')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          disabled={loading}
                        >
                          <option value="">Select a brand</option>
                          {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>
                              {brand.name}
                            </option>
                          ))}
                        </select>
                        {errors.brand_id && (
                          <p className="mt-1 text-sm text-red-600">{errors.brand_id.message}</p>
                        )}
                        {loading && (
                          <p className="mt-1 text-sm text-gray-500">Loading brands...</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="campaign_type" className="block text-sm font-medium text-gray-700">
                          Campaign Type
                        </label>
                        <select
                          id="campaign_type"
                          {...register('campaign_type')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="tradeshow">Tradeshow</option>
                          <option value="event">Event</option>
                          <option value="digital">Digital</option>
                          <option value="print">Print</option>
                          <option value="social">Social</option>
                          <option value="other">Other</option>
                        </select>
                        {errors.campaign_type && (
                          <p className="mt-1 text-sm text-red-600">{errors.campaign_type.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                        Location
                      </label>
                      <input
                        type="text"
                        id="location"
                        {...register('location')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Event location or geographic target"
                      />
                      {errors.location && (
                        <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timeline Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline & Budget</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                          Start Date*
                        </label>
                        <input
                          type="date"
                          id="start_date"
                          {...register('start_date')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        {errors.start_date && (
                          <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                          End Date*
                        </label>
                        <input
                          type="date"
                          id="end_date"
                          {...register('end_date')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        {errors.end_date && (
                          <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
                          Budget ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          id="budget"
                          {...register('budget')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Planned budget amount"
                        />
                        {errors.budget && (
                          <p className="mt-1 text-sm text-red-600">{errors.budget.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          id="status"
                          {...register('status')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="complete">Complete</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        {errors.status && (
                          <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate('/campaigns')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Creating...' : 'Create Campaign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right column - preview */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 sticky top-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Preview</h3>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 truncate">
                  {formValues.name || 'New Campaign'}
                </h2>
                <div className="mt-1 flex items-center">
                  <span className="text-sm text-gray-500 mr-3">
                    Brand: {getSelectedBrandName()}
                  </span>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${formValues.status === 'active' ? 'bg-green-100 text-green-800' : 
                      formValues.status === 'complete' ? 'bg-blue-100 text-blue-800' : 
                      formValues.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                      'bg-gray-100 text-gray-800'}`}>
                    {formValues.status?.charAt(0).toUpperCase() + formValues.status?.slice(1) || 'Draft'}
                  </span>
                </div>
              </div>
              
              {formValues.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Description</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    {formValues.description}
                  </p>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium text-gray-700">Details</h4>
                <dl className="mt-2 space-y-1">
                  {formValues.campaign_type && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Type:</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {formValues.campaign_type.charAt(0).toUpperCase() + formValues.campaign_type.slice(1)}
                      </dd>
                    </div>
                  )}
                  
                  {formValues.location && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Location:</dt>
                      <dd className="text-sm font-medium text-gray-900">{formValues.location}</dd>
                    </div>
                  )}
                  
                  {formValues.budget && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500">Budget:</dt>
                      <dd className="text-sm font-medium text-emerald-600">${Number(formValues.budget).toFixed(2)}</dd>
                    </div>
                  )}
                </dl>
              </div>
              
              {(formValues.start_date || formValues.end_date) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Timeline</h4>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <CalendarDays className="w-4 h-4 mr-1" />
                    {formValues.start_date || 'Start date'} - {formValues.end_date || 'End date'}
                  </div>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500">
                  Once the campaign is created, you'll be able to add briefs and manage resources.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 