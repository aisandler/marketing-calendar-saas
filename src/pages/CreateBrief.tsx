import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlertTriangle } from 'lucide-react';
import type { User, Resource, Brief } from '../types';
import { withErrorBoundary } from '../components/ErrorBoundary';

const briefSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  channel: z.string().min(1, 'Channel is required'),
  start_date: z.string().min(1, 'Start date is required'),
  due_date: z.string().min(1, 'Due date is required'),
  resource_id: z.string().nullable(),
  approver_id: z.string().nullable(),
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
  const isEditMode = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [approvers, setApprovers] = useState<User[]>([]);
  const [resourceConflict, setResourceConflict] = useState(false);
  const [campaignConflict, setCampaignConflict] = useState(false);
  const [existingBrief, setExistingBrief] = useState<Brief | null>(null);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch resources
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('*')
          .order('name');
        
        if (resourcesError) throw resourcesError;
        
        // Fetch approvers (users who are managers or admins)
        const { data: approversData, error: approversError } = await supabase
          .from('users')
          .select('*')
          .in('role', ['manager', 'admin'])
          .order('name');
        
        if (approversError) throw approversError;
        
        setResources(resourcesData as Resource[]);
        setApprovers(approversData as User[]);

        // If in edit mode, fetch the existing brief
        if (isEditMode && id) {
          const { data: briefData, error: briefError } = await supabase
            .from('briefs')
            .select(`
              *,
              campaigns(*),
              resources(*),
              users!briefs_created_by_fkey(*)
            `)
            .eq('id', id)
            .single();
          
          if (briefError) {
            console.error('Error fetching brief:', briefError);
            setError('Brief not found or you do not have permission to edit it.');
            // Redirect to briefs list after a short delay
            setTimeout(() => {
              navigate('/briefs');
            }, 3000);
            return;
          }
          
          if (!briefData) {
            setError('Brief not found.');
            // Redirect to briefs list after a short delay
            setTimeout(() => {
              navigate('/briefs');
            }, 3000);
            return;
          }
          
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
  }, [id, isEditMode, reset, navigate]);

  // Check for resource conflicts when relevant fields change
  useEffect(() => {
    const checkConflicts = async () => {
      if (!watchedResourceId || !watchedStartDate || !watchedDueDate) return;
      
      try {
        // Check for resource conflicts
        const { data: conflictingBriefs, error: conflictError } = await supabase
          .from('briefs')
          .select('*')
          .eq('resource_id', watchedResourceId)
          .or(`start_date.lte.${watchedDueDate},due_date.gte.${watchedStartDate}`)
          .not('id', 'eq', id || '');
        
        if (conflictError) throw conflictError;
        
        setResourceConflict(conflictingBriefs.length > 0);
        
        // Check for campaigns (tradeshows) in this period
        const { data: campaigns, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*')
          .or(`start_date.lte.${watchedDueDate},end_date.gte.${watchedStartDate}`)
          .eq('campaign_type', 'tradeshow');
        
        if (campaignsError) throw campaignsError;
        
        setCampaignConflict(campaigns.length > 0);
      } catch (error) {
        console.error('Error checking conflicts:', error);
      }
    };
    
    if (watchedResourceId && watchedStartDate && watchedDueDate) {
      checkConflicts();
    }
  }, [watchedResourceId, watchedStartDate, watchedDueDate, id]);

  const onSubmit = async (data: BriefFormData) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      if (isEditMode && id) {
        // Update existing brief
        const { error } = await supabase
          .from('briefs')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        
        if (error) {
          console.error('Error updating brief:', error);
          if (error.code === 'PGRST116') {
            // Foreign key violation
            setError('Error: The campaign associated with this brief no longer exists.');
          } else if (error.code === 'PGRST204') {
            // Row level security violation
            setError('You do not have permission to edit this brief.');
          } else {
            setError(error.message || 'Failed to update brief. Please try again.');
          }
          setLoading(false);
          return;
        }
        
        // Create history record
        if (existingBrief) {
          const { error: historyError } = await supabase
            .from('history')
            .insert([
              {
                brief_id: id,
                changed_by: user.id,
                previous_state: existingBrief,
                new_state: data,
                created_at: new Date().toISOString()
              }
            ]);
            
          if (historyError) {
            console.error('Error creating history record:', historyError);
            // Continue anyway since the brief was updated successfully
          }
        }
        
        // Navigate to the brief detail page
        navigate(`/briefs/${id}`);
      } else {
        // Create new brief
        const briefData = {
          ...data,
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
        
        if (error) throw error;
        
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

  // Handle cancel button click
  const handleCancel = () => {
    if (isEditMode && id) {
      // Navigate back to brief detail page
      navigate(`/briefs/${id}`);
    } else {
      // Navigate back to briefs list
      navigate('/briefs');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? 'Edit Brief' : 'Create New Brief'}
      </h1>
      
      {error && (
        <div className="mb-6 p-4 border border-red-300 bg-red-50 rounded-md flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
          <div>
            <p className="text-red-700">{error}</p>
            {error.includes('not found') && (
              <p className="text-sm text-red-600 mt-1">
                You will be redirected to the briefs list shortly.
              </p>
            )}
          </div>
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
              
              {resourceConflict && (
                <div className="mt-2 flex items-start gap-2 text-amber-600 text-sm">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <span>This resource may be overallocated during this time period.</span>
                </div>
              )}
              
              {campaignConflict && (
                <div className="mt-2 flex items-start gap-2 text-amber-600 text-sm">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <span>There are campaigns during this time period that may require resources.</span>
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
            </div>
          </div>
        </div>
        
        {/* Priority and Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Priority and Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>
        
        {/* Warnings */}
        {resourceConflict && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
              <span>This resource is already assigned to another brief during this time period.</span>
            </div>
          </div>
        )}
        
        {campaignConflict && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
              <span>There are campaigns during this time period that may require resources.</span>
            </div>
          </div>
        )}
        
        {/* Submit button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="px-4 py-2"
          >
            Cancel
          </Button>
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
  );
};

export default withErrorBoundary(CreateBrief, 'CreateBrief');
