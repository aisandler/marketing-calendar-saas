import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlertTriangle } from 'lucide-react';
import type { User, Resource } from '../types';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [approvers, setApprovers] = useState<User[]>([]);
  const [resourceConflict, setResourceConflict] = useState(false);
  const [tradeshowConflict, setTradeshowConflict] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
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
      } catch (error) {
        console.error('Error fetching form data:', error);
        setError('Failed to load form data. Please try again.');
      }
    };
    
    fetchData();
  }, []);

  // Check for resource conflicts when relevant fields change
  useEffect(() => {
    const checkConflicts = async () => {
      if (!watchedResourceId || !watchedStartDate || !watchedDueDate) {
        setResourceConflict(false);
        setTradeshowConflict(false);
        return;
      }

      try {
        // Check resource allocation for this period
        const { data: existingBriefs, error: briefsError } = await supabase
          .from('briefs')
          .select('*')
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
        
        // If more than 40 hours per week are allocated, show warning
        const startDate = new Date(watchedStartDate);
        const dueDate = new Date(watchedDueDate);
        const days = (dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const weeks = Math.ceil(days / 7);
        const weeklyThreshold = 40;
        
        setResourceConflict(totalAllocatedHours > weeklyThreshold * weeks);
        
        // Check for tradeshow conflicts
        setTradeshowConflict(tradeshows.length > 0);
      } catch (error) {
        console.error('Error checking conflicts:', error);
      }
    };
    
    if (watchedResourceId && watchedStartDate && watchedDueDate) {
      checkConflicts();
    }
  }, [watchedResourceId, watchedStartDate, watchedDueDate]);

  const onSubmit = async (data: BriefFormData) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare the brief data
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
    } catch (error: any) {
      console.error('Error creating brief:', error);
      setError(error.message || 'Failed to create brief. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Brief</h2>
        
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
          
          {/* Submission */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/briefs')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Brief'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBrief;
