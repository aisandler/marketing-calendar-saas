import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getPriorityColor, getStatusColor } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { AlertTriangle, Calendar, ChevronLeft, Clock, Download, Edit, Trash, Users, CheckCircle, XCircle } from 'lucide-react';
import type { Brief, Resource, User, History } from '../types';

const BriefDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [resource, setResource] = useState<Resource | null>(null);
  const [approver, setApprover] = useState<User | null>(null);
  const [creator, setCreator] = useState<User | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const fetchBriefData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!id) return;
        
        // Fetch brief details with explicit field selection to avoid schema mismatch
        const { data: briefData, error: briefError } = await supabase
          .from('briefs')
          .select(`
            id, 
            title, 
            description, 
            status, 
            start_date, 
            due_date, 
            channel,
            brand_id,
            campaign_id,
            resource_id,
            approver_id,
            created_by,
            created_at,
            updated_at,
            estimated_hours,
            expenses,
            specifications
          `)
          .eq('id', id)
          .single();
        
        if (briefError) throw briefError;
        if (!briefData) throw new Error('Brief not found');
        
        setBrief(briefData as Brief);
        
        // Fetch resource if resource_id is present
        if (briefData.resource_id) {
          const { data: resourceData, error: resourceError } = await supabase
            .from('resources')
            .select('id, name, type, created_at')
            .eq('id', briefData.resource_id)
            .single();
          
          if (resourceError) {
            console.warn('Failed to fetch resource details:', resourceError);
          } else {
            setResource(resourceData as Resource);
          }
        } else {
          setResource(null);
        }
        
        if (briefData.approver_id) {
          const { data: approverData, error: approverError } = await supabase
            .from('users')
            .select('id, name, email, role, created_at, avatar_url')
            .eq('id', briefData.approver_id)
            .single();
          
          if (approverError) {
            console.warn('Failed to fetch approver details:', approverError);
          } else {
            setApprover(approverData as User);
          }
        }
        
        if (briefData.created_by) {
          const { data: creatorData, error: creatorError } = await supabase
            .from('users')
            .select('id, name, email, role, created_at, avatar_url')
            .eq('id', briefData.created_by)
            .single();
          
          if (creatorError) {
            console.warn('Failed to fetch creator details:', creatorError);
          } else {
            setCreator(creatorData as User);
          }
        }
        
        // Fetch history with explicit field selection
        const { data: historyData, error: historyError } = await supabase
          .from('history')
          .select('id, brief_id, changed_by, previous_state, new_state, created_at')
          .eq('brief_id', id)
          .order('created_at', { ascending: false });
          
        if (historyError) {
          console.warn('Failed to fetch history:', historyError);
          setHistory([]);
        } else {
          setHistory(historyData as History[] || []);
        }
      } catch (error: any) {
        console.error('Error fetching brief data:', error);
        setError(error.message || 'Failed to load brief details.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBriefData();
  }, [id]);

  const handleStatusChange = async (newStatus: Brief['status']) => {
    if (!brief || !user) return;
    
    try {
      setLoading(true);
      
      // Store previous state for history
      const previousState = { ...brief };
      
      // Update brief status
      const { error } = await supabase
        .from('briefs')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', brief.id);
      
      if (error) throw error;
      
      // Record in history
      const { error: historyError } = await supabase
        .from('history')
        .insert([
          {
            brief_id: brief.id,
            changed_by: user.id,
            previous_state: { status: previousState.status },
            new_state: { status: newStatus },
            created_at: new Date().toISOString()
          }
        ]);
      
      if (historyError) throw historyError;
      
      // Update local state
      setBrief({
        ...brief,
        status: newStatus,
        updated_at: new Date().toISOString()
      });
      
      // Refresh history
      const { data: historyData } = await supabase
        .from('history')
        .select('*')
        .eq('brief_id', brief.id)
        .order('created_at', { ascending: false });
      
      setHistory(historyData as History[] || []);
    } catch (error: any) {
      console.error('Error updating status:', error);
      setError(error.message || 'Failed to update status.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!brief || !user) return;
    
    try {
      setLoading(true);
      
      // Delete history records first (foreign key constraint)
      const { error: historyError } = await supabase
        .from('history')
        .delete()
        .eq('brief_id', brief.id);
      
      if (historyError) throw historyError;
      
      // Delete the brief
      const { error } = await supabase
        .from('briefs')
        .delete()
        .eq('id', brief.id);
      
      if (error) throw error;
      
      // Navigate back to briefs list
      navigate('/briefs');
    } catch (error: any) {
      console.error('Error deleting brief:', error);
      setError(error.message || 'Failed to delete brief.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error || 'Brief not found'}</p>
          <Link to="/briefs" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            Back to Briefs
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = user?.role === 'admin' || user?.role === 'manager' || user?.id === brief.created_by;
  const canApprove = user?.role === 'admin' || user?.role === 'manager' || user?.id === brief.approver_id;
  const isPendingApproval = brief.status === 'pending_approval';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center mb-2">
              <Link to="/briefs" className="text-blue-600 hover:text-blue-800 mr-2">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <h2 className="text-xl font-semibold text-gray-900">{brief.title}</h2>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(brief.status)}`}>
                {brief.status.replace('_', ' ')}
              </span>
              {/* Priority field removed as it no longer exists in schema */}
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                {brief.channel}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Link to={`/briefs/${brief.id}/edit`}>
                <Button variant="outline" className="px-3 py-2">
                  <Edit className="h-5 w-5" />
                  <span className="ml-2">Edit</span>
                </Button>
              </Link>
            )}
            
            {canEdit && (
              <Button 
                variant="outline" 
                className="px-3 py-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash className="h-5 w-5" />
                <span className="ml-2">Delete</span>
              </Button>
            )}
            
            {isPendingApproval && canApprove && (
              <>
                <Button 
                  variant="outline" 
                  className="px-3 py-2 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                  onClick={() => handleStatusChange('approved')}
                >
                  <CheckCircle className="h-5 w-5" />
                  <span className="ml-2">Approve</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="px-3 py-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  onClick={() => handleStatusChange('draft')}
                >
                  <XCircle className="h-5 w-5" />
                  <span className="ml-2">Reject</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this brief? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Brief details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
            <p className="text-gray-600 whitespace-pre-line">
              {brief.description || 'No description provided.'}
            </p>
          </div>
          
          {/* Specifications */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Specifications</h3>
            {brief.specifications ? (
              <div className="prose max-w-none">
                <pre className="text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(brief.specifications, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-gray-600">No specifications provided.</p>
            )}
          </div>
          
          {/* History */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">History</h3>
            {history.length > 0 ? (
              <div className="space-y-4">
                {history.map((record) => (
                  <div key={record.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="text-sm text-gray-500">
                      {formatDate(record.created_at)} by {/* Would need to fetch user name */}
                    </p>
                    <div className="mt-1">
                      <p className="text-sm">
                        Changed status from <span className="font-medium">{record.previous_state.status}</span> to <span className="font-medium">{record.new_state.status}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No history recorded yet.</p>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                <dd className="text-sm text-gray-900 mt-1 flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                  {formatDate(brief.start_date)}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                <dd className="text-sm text-gray-900 mt-1 flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                  {formatDate(brief.due_date)}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Estimated Hours</dt>
                <dd className="text-sm text-gray-900 mt-1 flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-1" />
                  {brief.estimated_hours ? `${brief.estimated_hours} hours` : 'Not specified'}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Expenses</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {typeof brief.expenses === 'number' ? `$${brief.expenses.toFixed(2)}` : 'Not specified'}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {creator?.name || 'Unknown'}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {formatDate(brief.created_at)}
                </dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {formatDate(brief.updated_at)}
                </dd>
              </div>
            </dl>
          </div>
          
          {/* Resource */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resource & Cost</h3>
            {resource ? (
              <div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-gray-900 font-medium">{resource.name}</p>
                    <p className="text-gray-600 mt-1 capitalize">
                      {resource.type}
                      {resource.media_type ? ` • ${resource.media_type}` : ''}
                    </p>
                  </div>
                  <div className="bg-gray-100 px-3 py-1 rounded-md flex flex-col items-center">
                    <span className="text-xs text-gray-500">Weekly Capacity</span>
                    <span className="font-medium">{resource.capacity_hours || 40} hrs</span>
                  </div>
                </div>
                
                {/* Cost information */}
                {resource.hourly_rate && brief.estimated_hours && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Cost Breakdown</h4>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Resource Rate:</span>
                        <span>${resource.hourly_rate.toFixed(2)}/hr</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Resource Cost ({brief.estimated_hours} hrs):</span>
                        <span>${(resource.hourly_rate * brief.estimated_hours).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Additional Expenses:</span>
                        <span>${typeof brief.expenses === 'number' ? brief.expenses.toFixed(2) : '0.00'}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm font-medium border-t border-gray-200 pt-1 mt-1">
                        <span>Total Estimated Cost:</span>
                        <span>${(
                          resource.hourly_rate * (brief.estimated_hours || 0) + 
                          (typeof brief.expenses === 'number' ? brief.expenses : 0)
                        ).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-600">No resource assigned</p>
            )}
          </div>
          
          {/* Approver */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Approver</h3>
            {approver ? (
              <div>
                <p className="text-gray-900 font-medium">{approver.name}</p>
                <p className="text-gray-600 mt-1 capitalize">{approver.role}</p>
              </div>
            ) : (
              <p className="text-gray-600">No approver assigned</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BriefDetail;
