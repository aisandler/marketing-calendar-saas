import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlertTriangle } from 'lucide-react';
import type { User, Resource, Brief } from '../types';

const briefSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  channel: z.string().min(1, 'Channel is required'),
  start_date: z.string().min(1, 'Start date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  brand_id: z.string().min(1, 'Brand is required'),
  campaign_id: z.string().nullable().transform(val => val || null),
  resource_id: z.string().nullable().transform(val => val || null),
  approver_id: z.string().nullable().transform(val => val || null),
  status: z.enum([
    'draft', 
    'pending_approval', 
    'approved', 
    'in_progress', 
    'review', 
    'complete', 
    'cancelled'
  ]).default('draft'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  description: z.string().nullable().optional(),
  estimated_hours: z.number().nullable().optional(),
  expenses: z.number().nullable().optional(),
}).refine(data => new Date(data.due_date) >= new Date(data.start_date), {
  message: "Due date must be after start date",
  path: ['due_date'],
});

type BriefFormData = z.infer<typeof briefSchema>;

const CreateBrief = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaign');
  const isEditMode = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [approvers, setApprovers] = useState<User[]>([]);
  const [brands, setBrands] = useState<Array<{ id: string; name: string; }>>([]);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string; brand_id: string; }>>([]);
  const [resourceConflict, setResourceConflict] = useState(false);
  const [tradeshowConflict, setTradeshowConflict] = useState(false);
  const [existingBrief, setExistingBrief] = useState<Brief | null>(null);
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);
  const [resourceAllocation, setResourceAllocation] = useState<{
    percentAllocated: number;
    totalAllocated: number;
    capacity: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<BriefFormData>({
    resolver: zodResolver(briefSchema),
    defaultValues: {
      title: '',
      channel: '',
      start_date: new Date().toISOString().split('T')[0],
      due_date: '',
      brand_id: '',
      campaign_id: null,
      resource_id: null,
      approver_id: null,
      status: 'draft',
      priority: 'medium',
      description: '',
      estimated_hours: null,
      expenses: null,
    },
  });

  // Watch for changes to these fields to check for conflicts
  const watchedResourceId = watch('resource_id');
  const watchedStartDate = watch('start_date');
  const watchedDueDate = watch('due_date');
  const watchedEstimatedHours = watch('estimated_hours');
  const watchedExpenses = watch('expenses');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch resources
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('id, name, type, created_at')
          .order('name');
        
        if (resourcesError) throw resourcesError;
        
        // Fetch approvers (users who are managers or admins)
        const { data: approversData, error: approversError } = await supabase
          .from('users')
          .select('id, name, email, role, created_at, avatar_url')
          .in('role', ['manager', 'admin'])
          .order('name');
        
        if (approversError) throw approversError;
        
        // Fetch brands
        const { data: brandsData, error: brandsError } = await supabase
          .from('brands')
          .select('id, name')
          .order('name');
          
        if (brandsError) throw brandsError;
        
        // Fetch campaigns
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select('id, name, brand_id')
          .order('name');
          
        if (campaignsError) throw campaignsError;
        
        // If we have a campaign ID from the URL, pre-select it and its brand
        if (campaignId && !isEditMode) {
          const { data: campaign } = await supabase
            .from('campaigns')
            .select('id, name, brand_id')
            .eq('id', campaignId)
            .single();
            
          if (campaign) {
            reset({
              ...watch(),
              campaign_id: campaign.id,
              brand_id: campaign.brand_id
            });
          }
        }

        setResources(resourcesData as Resource[]);
        setApprovers(approversData as User[]);
        setBrands(brandsData || []);
        setCampaigns(campaignsData || []);

        // If in edit mode, fetch the existing brief
        if (isEditMode && id) {
          const { data: briefData, error: briefError } = await supabase
            .from('briefs')
            .select('*')
            .eq('id', id)
            .single();
          
          if (briefError) throw briefError;
          if (!briefData) throw new Error('Brief not found');
          
          setExistingBrief(briefData as Brief);
          
          // Format dates for form input
          const formattedBrief = {
            ...briefData,
            start_date: briefData.start_date.split('T')[0],
            due_date: briefData.due_date.split('T')[0],
            estimated_hours: briefData.estimated_hours || null,
            expenses: briefData.expenses || null,
          };
          
          // Reset form with existing brief data
          reset(formattedBrief);
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Failed to load data.');
      }
    };
    
    fetchData();
  }, [id, isEditMode, campaignId, reset, watch]);

  // Check for resource conflicts when relevant fields change
  useEffect(() => {
    const checkConflicts = async () => {
      if (!watchedResourceId || !watchedStartDate || !watchedDueDate) {
        setResourceConflict(false);
        setTradeshowConflict(false);
        return;
      }

      try {
        // Get resource information to check capacity
        const { data: resourceData, error: resourceError } = await supabase
          .from('resources')
          .select('id, capacity_hours, hourly_rate, type')
          .eq('id', watchedResourceId)
          .single();
        
        if (resourceError) throw resourceError;
        
        // Check resource allocation for this period
        const { data: existingBriefs, error: briefsError } = await supabase
          .from('briefs')
          .select('id, resource_id, start_date, due_date, estimated_hours')
          .eq('resource_id', watchedResourceId)
          .or(`start_date.lte.${watchedDueDate},due_date.gte.${watchedStartDate}`);
        
        if (briefsError) throw briefsError;
        
        // Check for tradeshows in this period
        const { data: tradeshows, error: tradeshowsError } = await supabase
          .from('tradeshows')
          .select('*')
          .or(`start_date.lte.${watchedDueDate},end_date.gte.${watchedStartDate}`);
        
        if (tradeshowsError) throw tradeshowsError;
        
        // Calculate total allocated hours for this resource in this period
        const totalAllocatedHours = existingBriefs.reduce(
          (sum, brief) => sum + (brief.estimated_hours || 0), 
          0
        );
        
        // Calculate capacity based on the resource's actual capacity setting
        const startDate = new Date(watchedStartDate);
        const dueDate = new Date(watchedDueDate);
        const days = (dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const weeks = Math.ceil(days / 7);
        
        // Get resource's weekly capacity (default to 40 if not set)
        const weeklyCapacity = resourceData?.capacity_hours || 40;
        
        // Calculate if the resource is overallocated
        const isOverallocated = totalAllocatedHours > weeklyCapacity * weeks;
        
        // Calculate how much is being used already
        const percentAllocated = Math.round((totalAllocatedHours / (weeklyCapacity * weeks)) * 100);
        
        // Set conflict state with additional information
        setResourceConflict(isOverallocated);
        
        // Save allocation data for display
        setResourceAllocation({
          percentAllocated,
          totalAllocated: totalAllocatedHours,
          capacity: weeklyCapacity * weeks
        });
        
        // Calculate cost if resource has an hourly rate
        const hourlyRate = resourceData?.hourly_rate || 0;
        if (hourlyRate > 0) {
          // Get currently watched estimated_hours
          const estimatedHours = watch('estimated_hours') || 0;
          const cost = estimatedHours * hourlyRate;
          setCalculatedCost(cost);
        } else {
          setCalculatedCost(null);
        }
        
        // Check for tradeshow conflicts
        setTradeshowConflict(tradeshows.length > 0);
      } catch (error) {
        console.error('Error checking conflicts:', error);
      }
    };
    
    if (watchedResourceId && watchedStartDate && watchedDueDate) {
      checkConflicts();
    }
  }, [watchedResourceId, watchedStartDate, watchedDueDate, watchedEstimatedHours, watchedExpenses]);

  const onSubmit = async (data: BriefFormData) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Clean up the data before submission
      const cleanedData = {
        ...data,
        campaign_id: data.campaign_id || null,
        resource_id: data.resource_id || null,
        approver_id: data.approver_id || null,
        estimated_hours: data.estimated_hours || null,
        expenses: data.expenses || null,
        description: data.description || null
      };
      
      if (isEditMode && id) {
        // Update existing brief
        const { error } = await supabase
          .from('briefs')
          .update({
            ...cleanedData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        
        if (error) throw error;
        
        // Create history record
        if (existingBrief) {
          await supabase
            .from('history')
            .insert([{
              brief_id: id,
              changed_by: user.id,
              previous_state: existingBrief,
              new_state: cleanedData,
              created_at: new Date().toISOString()
            }]);
        }
        
        // Navigate to the brief detail page
        navigate(`/briefs/${id}`);
      } else {
        // Create new brief
        const briefData = {
          ...cleanedData,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Insert the brief
        const { data: newBrief, error } = await supabase
          .from('briefs')
          .insert([briefData])
          .select()
          .single();
        
        if (error) {
          console.error('Error creating brief:', error);
          throw new Error(error.message);
        }
        
        if (!newBrief) {
          throw new Error('Failed to create brief - no data returned');
        }
        
        // Navigate to the brief detail page
        navigate(`/briefs/${newBrief.id}`);
      }
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} brief:`, error);
      setError(error.message || `Failed to ${isEditMode ? 'update' : 'create'} brief. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {isEditMode ? 'Edit Brief' : 'Create New Brief'}
        </h2>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <Input
                  id="title"
                  {...register('title')}
                  className={errors.title ? 'border-red-300' : ''}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="channel" className="block text-sm font-medium text-gray-700 mb-1">
                  Channel *
                </label>
                <select
                  id="channel"
                  {...register('channel')}
                  className={`block w-full rounded-md ${
                    errors.channel ? 'border-red-300' : 'border-gray-300'
                  } shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
                >
                  <option value="">Select Channel</option>
                  <option value="Website">Website</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Email">Email</option>
                  <option value="Print">Print</option>
                  <option value="Tradeshow">Tradeshow</option>
                  <option value="Video">Video</option>
                  <option value="Other">Other</option>
                </select>
                {errors.channel && (
                  <p className="mt-1 text-sm text-red-600">{errors.channel.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="brand_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Brand *
                </label>
                <select
                  id="brand_id"
                  {...register('brand_id')}
                  className={`block w-full rounded-md ${
                    errors.brand_id ? 'border-red-300' : 'border-gray-300'
                  } shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                {errors.brand_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.brand_id.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="campaign_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign
                </label>
                <select
                  id="campaign_id"
                  {...register('campaign_id')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">No Campaign</option>
                  {campaigns
                    .filter(campaign => !watch('brand_id') || campaign.brand_id === watch('brand_id'))
                    .map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <Input
                  id="start_date"
                  type="date"
                  {...register('start_date')}
                  className={errors.start_date ? 'border-red-300' : ''}
                />
                {errors.start_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <Input
                  id="due_date"
                  type="date"
                  {...register('due_date')}
                  className={errors.due_date ? 'border-red-300' : ''}
                />
                {errors.due_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                {...register('description')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          {/* Resource and Approval */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Resource and Approval</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="resource_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Resource
                </label>
                <select
                  id="resource_id"
                  {...register('resource_id')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Unassigned</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name} ({resource.type})
                    </option>
                  ))}
                </select>
                
                {resourceAllocation && (
                  <div className="mt-2 bg-gray-50 p-2 rounded border border-gray-200 text-sm">
                    <p>
                      <span className="font-medium">Current Allocation:</span>{' '}
                      <span className={resourceAllocation.percentAllocated > 90 ? 'text-red-600 font-bold' : 'text-gray-600'}>
                        {resourceAllocation.percentAllocated}%
                      </span>
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1 mb-2">
                      <div 
                        className={`h-2.5 rounded-full ${
                          resourceAllocation.percentAllocated > 100 ? 'bg-red-600' : 
                          resourceAllocation.percentAllocated > 90 ? 'bg-amber-500' : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(resourceAllocation.percentAllocated, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {resourceAllocation.totalAllocated} of {resourceAllocation.capacity} hours allocated
                    </p>
                  </div>
                )}
                
                {resourceConflict && (
                  <div className="mt-2 flex items-start gap-2 text-red-600 text-sm">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <span>
                      <strong>Warning:</strong> This resource is overallocated during this time period.
                      Consider assigning to another resource or adjusting the timeline.
                    </span>
                  </div>
                )}
                
                {tradeshowConflict && (
                  <div className="mt-2 flex items-start gap-2 text-amber-600 text-sm">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <span>There are tradeshows during this time period that may require resources.</span>
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="approver_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Approver
                </label>
                <select
                  id="approver_id"
                  {...register('approver_id')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select Approver</option>
                  {approvers.map((approver) => (
                    <option key={approver.id} value={approver.id}>
                      {approver.name} ({approver.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Hours
                </label>
                <Controller
                  name="estimated_hours"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="estimated_hours"
                      type="number"
                      min="0"
                      step="0.5"
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      value={field.value !== null ? field.value : ''}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  )}
                />
              </div>
              
              <div>
                <label htmlFor="expenses" className="block text-sm font-medium text-gray-700 mb-1">
                  Expenses ($)
                </label>
                <Controller
                  name="expenses"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="expenses"
                      type="number"
                      min="0"
                      step="1"
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      value={field.value !== null ? field.value : ''}
                    />
                  )}
                />
                {/* Cost estimation section */}
                {calculatedCost !== null && (
                  <div className="mt-2 bg-gray-50 p-2 rounded border border-gray-200 text-sm">
                    <p className="font-medium text-gray-700">
                      Estimated Resource Cost: ${calculatedCost.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Based on resource hourly rate and estimated hours
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Priority, Status, and Cost Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Priority, Status, and Cost</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  {...register('priority')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  {...register('status')}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="complete">Complete</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Summary
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 h-full">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Resource Cost:</span>
                      <span>${calculatedCost !== null ? calculatedCost.toFixed(2) : '0.00'}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Additional Expenses:</span>
                      <span>${watchedExpenses !== null ? (watchedExpenses || 0).toFixed(2) : '0.00'}</span>
                    </div>
                    
                    <div className="border-t border-blue-200 my-1 pt-1 flex justify-between font-medium">
                      <span>Total Estimated Cost:</span>
                      <span>
                        ${(
                          (calculatedCost || 0) +
                          (watchedExpenses || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Submit button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="px-4 py-2"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : isEditMode ? 'Update Brief' : 'Create Brief'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBrief;
