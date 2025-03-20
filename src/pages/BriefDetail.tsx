import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getPriorityColor, getStatusColor, getChannelColor, getProgressPercentage, getDaysRemaining } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { AlertTriangle, Calendar, ChevronLeft, Clock, Download, Edit, Trash, Users, CheckCircle, XCircle, Paperclip, Link2, FileText, Image, MessageSquare, Send, ChevronRight, Clock3, Home, Layers, Info } from 'lucide-react';
import type { Brief, Resource, User, History, BriefStatus } from '../types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Badge } from '../components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/Avatar';
import { Progress } from '../components/ui/Progress';
import { Step, Steps } from '../components/ui/Steps';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

interface BriefAttachment {
  id: string;
  brief_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
}

// Helper function to calculate date difference
const getDateDifference = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date1.getTime() - date2.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

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
  const [attachments, setAttachments] = useState<BriefAttachment[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [relatedBriefs, setRelatedBriefs] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    let mounted = true;
    
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
        
        if (mounted) {
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

          // Fetch real attachments
          const { data: attachmentsData, error: attachmentsError } = await supabase
            .from('brief_attachments')
            .select('*')
            .eq('brief_id', id);

          if (attachmentsError) {
            console.warn('Failed to fetch attachments:', attachmentsError);
            setAttachments([]);
          } else {
            setAttachments(attachmentsData as BriefAttachment[] || []);
          }

          // Simulate fetching related briefs
          setRelatedBriefs([
            { id: '456', title: 'Q4 Campaign Brief', status: 'Completed', due: '2023-08-15' },
            { id: '789', title: 'Social Media Campaign', status: 'In Progress', due: '2023-09-30' },
          ]);

          // Simulate fetching comments
          const mockComments = [
            { 
              id: 1, 
              user: { name: 'Alex Director', avatar: null, role: 'Manager' }, 
              text: 'Please make sure the social media graphics follow our new brand guidelines.', 
              created_at: '2023-10-25T14:30:00Z'
            },
            { 
              id: 2, 
              user: { name: 'Sam Designer', avatar: null, role: 'Designer' }, 
              text: 'I\'ve updated the design based on the new guidelines. What do you think?', 
              created_at: '2023-10-26T09:15:00Z'
            }
          ];
          setComments(mockComments);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
          console.error('Error fetching brief data:', err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    if (id) {
      fetchBriefData();
    }
    
    return () => {
      mounted = false;
    };
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

  // Add a new comment function
  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;
    
    const newCommentObj = {
      id: Date.now(),
      user: { name: user.name, avatar: user.avatar_url, role: user.role },
      text: newComment,
      created_at: new Date().toISOString()
    };
    
    setComments([...comments, newCommentObj]);
    setNewComment('');
  };

  // Format file size to human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // Handle file selection from input
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !brief?.id || !user) return;
    
    setUploadLoading(true);
    setUploadError(null);
    
    try {
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Upload to Supabase Storage
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const filePath = `briefs/${brief.id}/${fileName}`;
        
        // Use the service role for storage operations
        const { error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(filePath, file, {
            upsert: true,
            cacheControl: '3600'
          });
          
        if (uploadError) throw uploadError;
        
        // Create metadata record
        const { error: metaError } = await supabase
          .from('brief_attachments')
          .insert({
            brief_id: brief.id,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            storage_path: filePath,
            uploaded_by: user.id,
            created_at: new Date().toISOString()
          });
          
        if (metaError) throw metaError;
      }
      
      // Refresh attachments
      const { data: refreshedData, error: refreshError } = await supabase
        .from('brief_attachments')
        .select('*')
        .eq('brief_id', brief.id);
        
      if (refreshError) throw refreshError;
      
      setAttachments(refreshedData as BriefAttachment[] || []);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setUploadError(error.message || 'Failed to upload file');
    } finally {
      setUploadLoading(false);
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (attachmentId: string, storagePath: string) => {
    if (!brief?.id || !user) return;
    
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('attachments')
        .remove([storagePath]);
        
      if (storageError) throw storageError;
      
      // Delete metadata
      const { error: deleteError } = await supabase
        .from('brief_attachments')
        .delete()
        .eq('id', attachmentId);
        
      if (deleteError) throw deleteError;
      
      // Update local state
      setAttachments(attachments.filter(a => a.id !== attachmentId));
    } catch (error: any) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file: ' + error.message);
    }
  };

  // Get URL for a file
  const getFileUrl = (storagePath: string): string => {
    // Get the public URL from Supabase storage
    const { data } = supabase.storage
      .from('attachments')
      .getPublicUrl(storagePath);
      
    return data?.publicUrl || '';
  };

  // Get file icon based on mime type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500 mr-3" />;
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500 mr-3" />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-5 w-5 text-indigo-500 mr-3" />;
    return <FileText className="h-5 w-5 text-gray-500 mr-3" />;
  };

  // Helper function to format specification values
  const formatSpecificationValue = (value: any): string => {
    if (value === null || value === undefined) return 'Not specified';
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return JSON.stringify(value);
    }
    
    return value.toString();
  };

  // Add these utility functions
  const getStatusValue = (status: string): number => {
    const statusOrder = {
      'draft': 0,
      'pending_approval': 1,
      'approved': 2,
      'in_progress': 3,
      'review': 4,
      'complete': 5,
      'cancelled': -1
    };
    return statusOrder[status as keyof typeof statusOrder] || 0;
  };

  // Helper function to calculate progress percentage based on status
  const getProgressPercentage = (status: BriefStatus): number => {
    switch (status) {
      case 'draft':
        return 10;
      case 'pending_approval':
        return 30;
      case 'approved':
        return 50;
      case 'in_progress':
        return 70;
      case 'review':
        return 90;
      case 'complete':
        return 100;
      case 'cancelled':
        return 0;
      default:
        return 0;
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
    <div className="container mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb navigation */}
      <nav className="mb-4 flex items-center text-sm text-gray-500" aria-label="Breadcrumb">
        <Link to="/briefs" className="flex items-center hover:text-blue-600">
          <Home className="h-4 w-4 mr-1" />
          <span>Briefs</span>
        </Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="truncate max-w-xs">{brief.title}</span>
      </nav>
      
      {/* Header Section */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 mr-3">{brief.title}</h1>
              <Badge 
                className={`${
                  brief.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  brief.status === 'pending_approval' ? 'bg-amber-100 text-amber-800' : 
                  brief.status === 'approved' ? 'bg-blue-100 text-blue-800' : 
                  brief.status === 'in_progress' ? 'bg-purple-100 text-purple-800' : 
                  brief.status === 'review' ? 'bg-indigo-100 text-indigo-800' :
                  brief.status === 'complete' ? 'bg-green-100 text-green-800' : 
                  'bg-red-100 text-red-800'
                }`}
              >
                {brief.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="mr-4">Due: {formatDate(brief.due_date)}</span>
              <Layers className="h-4 w-4 mr-1" />
              <span>Channel: {brief.channel || 'None'}</span>
            </div>
          </div>
          
          <div className="flex mt-4 md:mt-0 space-x-2">
            {canEdit && (
              <Link to={`/briefs/${brief.id}/edit`}>
                <Button 
                  variant="outline" 
                  className="flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Brief
                </Button>
              </Link>
            )}
            
            {canEdit && (
              <Button 
                variant="destructive" 
                className="flex items-center"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Actions Panel - Only show for pending items or items that can change status */}
      {brief.status !== 'cancelled' && brief.status !== 'complete' && (
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h2 className="text-lg font-medium text-gray-900 mb-1">Status: {brief.status.replace('_', ' ')}</h2>
                <div className="text-sm text-gray-500 flex items-center">
                  <Clock3 className="h-4 w-4 mr-1" />
                  {new Date(brief.due_date) < new Date() 
                    ? <span className="text-red-600 font-semibold">Overdue by {getDateDifference(new Date(), new Date(brief.due_date))} days</span>
                    : <span>Due in {getDateDifference(new Date(brief.due_date), new Date())} days</span>
                  }
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2">
                {/* Status Change Buttons */}
                {canEdit && (
                  <>
                    {brief.status === 'draft' && (
                      <Button 
                        onClick={() => handleStatusChange('pending_approval')}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        Submit for Approval
                      </Button>
                    )}
                    
                    {brief.status === 'pending_approval' && isPendingApproval && (
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => handleStatusChange('approved')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button 
                          onClick={() => handleStatusChange('draft')}
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                    
                    {brief.status === 'approved' && (
                      <Button 
                        onClick={() => handleStatusChange('in_progress')}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Start Work
                      </Button>
                    )}
                    
                    {brief.status === 'in_progress' && (
                      <Button 
                        onClick={() => handleStatusChange('review')}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        Submit for Review
                      </Button>
                    )}
                    
                    {brief.status === 'review' && (
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => handleStatusChange('complete')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete
                        </Button>
                        <Button 
                          onClick={() => handleStatusChange('in_progress')}
                          variant="outline"
                        >
                          Revise
                        </Button>
                      </div>
                    )}
                    
                    {brief.status !== 'cancelled' && brief.status !== 'complete' && (
                      <Button 
                        onClick={() => handleStatusChange('cancelled')}
                        variant="destructive"
                      >
                        Cancel Brief
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
            
            {/* Status Timeline */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-between">
                  {['draft', 'pending_approval', 'approved', 'in_progress', 'review', 'complete'].map((status, idx) => {
                    const isActive = getStatusValue(brief.status) >= getStatusValue(status);
                    const isCurrent = brief.status === status;
                    
                    return (
                      <div key={status} className="flex flex-col items-center">
                        <div 
                          className={`rounded-full h-8 w-8 flex items-center justify-center ${
                            isCurrent ? 'ring-4 ring-blue-100' : ''
                          } ${
                            isActive ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <CheckCircle className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        <div className="text-xs mt-1 text-center hidden md:block">
                          {status.replace('_', ' ')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description with rich content support */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
              <div className="prose max-w-none text-gray-600">
                {brief.description ? (
                  <div className="whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {brief.description}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No description provided.</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Specifications with rich visualization - more defensive handling of data */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Specifications</h3>
                {canEdit && (
                  <Link to={`/briefs/${brief.id}/edit`}>
                    <Button variant="outline" className="text-xs px-2 py-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Specifications
                    </Button>
                  </Link>
                )}
              </div>
              
              {brief.specifications && typeof brief.specifications === 'object' && Object.keys(brief.specifications).length > 0 ? (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(brief.specifications).map(([key, value], index) => {
                      // Generate a different color for each specification card
                      const colors = ['blue', 'amber', 'green', 'purple', 'indigo', 'pink', 'sky', 'emerald'];
                      const colorIndex = index % colors.length;
                      const color = colors[colorIndex];
                      
                      return (
                        <div 
                          key={key} 
                          className={`border rounded-lg p-4 bg-${color}-50 border-${color}-200 hover:shadow transition-shadow`}
                        >
                          <h4 className={`text-sm font-semibold text-${color}-700 mb-1 capitalize`}>
                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                          </h4>
                          <p className="text-sm text-gray-700 break-words">
                            {formatSpecificationValue(value)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 inline-block mx-auto">
                    <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 mb-3">No specifications provided</p>
                    {canEdit && (
                      <Link to={`/briefs/${brief.id}/edit`}>
                        <Button variant="outline" className="text-xs px-3 py-1">
                          <Edit className="h-4 w-4 mr-1" />
                          Add Specifications
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Reference Materials */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reference Materials</h3>
                {canEdit && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      multiple
                    />
                    <Button 
                      variant="outline" 
                      className="text-xs px-2 py-1"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadLoading}
                    >
                      {uploadLoading ? (
                        <>
                          <div className="h-4 w-4 border-2 border-t-transparent border-blue-600 rounded-full animate-spin mr-1"></div>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Paperclip className="h-4 w-4 mr-1" />
                          <span>Add File</span>
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
              
              {uploadError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  <AlertTriangle className="h-4 w-4 inline-block mr-1" /> {uploadError}
                </div>
              )}
              
              {attachments.length > 0 ? (
                <div className="space-y-3">
                  {attachments.map(attachment => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        {getFileIcon(attachment.file_type)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(attachment.file_size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a 
                          href={getFileUrl(attachment.storage_path)} 
                          className="text-blue-600 hover:text-blue-800"
                          download={attachment.file_name}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-5 w-5" />
                        </a>
                        {canEdit && (
                          <button 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteFile(attachment.id, attachment.storage_path)}
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Paperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No reference materials attached</p>
                </div>
              )}
            </div>
          </div>
          
          {/* History with in-line comments */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">History & Comments</h3>
              <div className="text-sm text-gray-500">{history.length + comments.length} updates</div>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* Comments section */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      {comment.user.avatar ? (
                        <img src={comment.user.avatar} alt={comment.user.name} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-700 font-medium">{comment.user.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{comment.user.name}</span>
                            <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                          </div>
                          <div className="mt-1 text-gray-700">{comment.text}</div>
                        </div>
                        <div className="mt-1 flex space-x-2 text-xs text-gray-500">
                          <button className="hover:text-blue-600">Reply</button>
                          <button className="hover:text-blue-600">React</button>
                          {user?.name === comment.user.name && (
                            <button className="hover:text-red-600">Delete</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Status updates in timeline format */}
                {history.length > 0 && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Status Updates</h4>
                    <div className="space-y-4">
                      {history.map((record) => (
                        <div key={record.id} className="flex space-x-3">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center z-10">
                              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                            </div>
                            <div className="absolute top-8 bottom-0 left-4 w-0.5 bg-gray-200"></div>
                          </div>
                          <div>
                            <div className="text-sm">
                              <span className="font-medium">Status changed</span> from <span className={`px-1.5 py-0.5 rounded-full text-xs ${getStatusColor(record.previous_state.status)}`}>{record.previous_state.status.replace('_', ' ')}</span> to <span className={`px-1.5 py-0.5 rounded-full text-xs ${getStatusColor(record.new_state.status)}`}>{record.new_state.status.replace('_', ' ')}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(record.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Add comment form */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex space-x-3">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-medium">{user?.name ? user.name.charAt(0) : 'U'}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                      ></textarea>
                      <div className="flex justify-between mt-2">
                        <div className="text-xs text-gray-500">
                          Markdown supported
                        </div>
                        <Button 
                          variant="default" 
                          className="px-3 py-1"
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Key Details Card */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Key Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Campaign</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {brief.campaign_id ? 'Connected Campaign' : 'No Campaign'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Brand</dt>
                  <dd className="text-sm text-gray-900 mt-1 flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: getChannelColor(brief.channel || null) }}
                    ></div>
                    {brief.brand_id || 'Unspecified'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Channel</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      brief.channel ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {brief.channel || 'None'}
                    </span>
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Priority</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      brief.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      brief.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                      brief.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {brief.priority || 'Low'}
                    </span>
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Timeline</dt>
                  <dd className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(brief.start_date)}</span>
                      <span>{formatDate(brief.due_date)}</span>
                    </div>
                    <div className="mt-1 relative pt-1">
                      <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 bg-blue-600 rounded-full" 
                          style={{ width: `${getProgressPercentage(brief.status)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 text-right">
                      {new Date(brief.due_date) < new Date() ? (
                        <span className="text-red-600">
                          Overdue by {getDateDifference(new Date(), new Date(brief.due_date))} days
                        </span>
                      ) : (
                        <span>
                          {getDateDifference(new Date(brief.due_date), new Date())} days remaining
                        </span>
                      )}
                    </div>
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Estimated Cost</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    <div className="flex justify-between mb-1">
                      <span>Resource Cost:</span>
                      <span>
                        {resource?.hourly_rate && brief.estimated_hours
                          ? `$${(resource.hourly_rate * brief.estimated_hours).toFixed(2)}`
                          : '$0.00'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Expenses:</span>
                      <span>${brief.expenses ? brief.expenses.toFixed(2) : '0.00'}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-1 border-t border-gray-200">
                      <span>Total:</span>
                      <span>
                        ${(
                          (resource?.hourly_rate ? resource.hourly_rate * (brief.estimated_hours || 0) : 0) +
                          (brief.expenses || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* People Card */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">People</h3>
              
              {/* Approver Section */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Approver</h4>
                {approver ? (
                  <div className="flex items-center">
                    {approver.avatar_url ? (
                      <img 
                        src={approver.avatar_url} 
                        alt={approver.name}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <span className="text-blue-700 font-medium">{approver.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{approver.name}</p>
                      <p className="text-gray-500 text-sm">{approver.role}</p>
                    </div>
                    {brief.status === 'pending_approval' && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                        Pending Review
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-gray-500 italic text-sm">No approver assigned</div>
                    {canEdit && (
                      <Link to={`/briefs/${brief.id}/edit`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          Assign
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
              
              {/* Resource Section */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Assigned Resource</h4>
                {resource ? (
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                      <span className="text-purple-700 font-medium">{resource.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{resource.name}</p>
                      <p className="text-gray-500 text-sm capitalize">{resource.type}</p>
                    </div>
                    <div>
                      {resource.hourly_rate && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          ${resource.hourly_rate}/hr
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-gray-500 italic text-sm">No resource assigned</div>
                    {canEdit && (
                      <Link to={`/briefs/${brief.id}/edit`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          Assign
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
              
              {/* Creator Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Created By</h4>
                {creator ? (
                  <div className="flex items-center">
                    {creator.avatar_url ? (
                      <img 
                        src={creator.avatar_url} 
                        alt={creator.name}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                        <span className="text-gray-700 font-medium">{creator.name.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-900 font-medium">{creator.name}</p>
                      <p className="text-gray-500 text-sm">{formatDate(brief.created_at || '')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 italic text-sm">Unknown</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Related Briefs */}
          {relatedBriefs.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Related Briefs</h3>
                <div className="space-y-3">
                  {relatedBriefs.map((relatedBrief) => (
                    <Link 
                      key={relatedBrief.id} 
                      to={`/briefs/${relatedBrief.id}`}
                      className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <span 
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: getChannelColor(relatedBrief.channel) }}
                        ></span>
                        <span className="text-sm font-medium text-gray-900">{relatedBrief.title}</span>
                      </div>
                      <div className="flex justify-between mt-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full ${getStatusColor(relatedBrief.status)}`}>
                          {relatedBrief.status.replace('_', ' ')}
                        </span>
                        <span className="text-gray-500">Due: {formatDate(relatedBrief.due)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BriefDetail;
