import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, getPriorityColor, getStatusColor, getChannelColor, getProgressPercentage, getDaysRemaining } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { AlertTriangle, Calendar, ChevronLeft, Clock, Download, Edit, Trash, Users, CheckCircle, XCircle, Paperclip, Link2, FileText, Image, MessageSquare, Send } from 'lucide-react';
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
  const [relatedFiles, setRelatedFiles] = useState<any[]>([]);
  const [relatedBriefs, setRelatedBriefs] = useState<any[]>([]);
  const [brandGuidelines, setBrandGuidelines] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');

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

        // Simulate fetching related files (would be an actual API call in production)
        const mockFiles = [
          { id: 1, name: 'brand-guidelines.pdf', type: 'pdf', size: '2.4 MB', url: '#' },
          { id: 2, name: 'inspiration-moodboard.jpg', type: 'image', size: '1.8 MB', url: '#' },
          { id: 3, name: 'copy-draft.docx', type: 'document', size: '345 KB', url: '#' }
        ];
        setRelatedFiles(mockFiles);

        // Simulate fetching related briefs
        const mockRelatedBriefs = [
          { id: 'b1', title: 'Product Launch Social Posts', channel: 'Social Media', status: 'in_progress', due_date: '2023-11-15' },
          { id: 'b2', title: 'Email Announcement', channel: 'Email', status: 'approved', due_date: '2023-11-10' },
          { id: 'b3', title: 'Press Release', channel: 'Blog Post', status: 'review', due_date: '2023-11-20' }
        ];
        setRelatedBriefs(mockRelatedBriefs);

        // Simulate fetching brand guidelines
        const mockBrandGuidelines = {
          id: 'bg1',
          name: 'TechCorp Brand Guidelines',
          colors: [
            { name: 'Primary Blue', hex: '#2563eb' },
            { name: 'Secondary Green', hex: '#10b981' },
            { name: 'Accent Red', hex: '#ef4444' }
          ],
          fonts: ['Montserrat', 'Open Sans'],
          tone: 'Professional, innovative, approachable'
        };
        setBrandGuidelines(mockBrandGuidelines);

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
      {/* Enhanced Header */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center mb-2">
                <Link to="/briefs" className="text-blue-600 hover:text-blue-800 mr-2">
                  <ChevronLeft className="h-5 w-5" />
                </Link>
                <h2 className="text-2xl font-bold text-gray-900">{brief.title}</h2>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(brief.status)}`}>
                  {brief.status.replace('_', ' ')}
                </span>
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800 flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full mr-1" style={{backgroundColor: getChannelColor(brief.channel || null)}}></span>
                  {brief.channel || 'No media type'}
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
        
        {/* Progress bar */}
        <div className="px-6 py-3 bg-gray-50">
          <div className="flex justify-between mb-1 text-xs text-gray-500">
            <span>Progress</span>
            <span>{getProgressPercentage(brief.status)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${getProgressPercentage(brief.status)}%` }}
            ></div>
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
          
          {/* Specifications with rich visualization */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Specifications</h3>
              {brief.specifications ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Example specification cards - would be dynamic based on actual data */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Target Audience</h4>
                      <p className="text-sm text-gray-700">
                        {brief.specifications.audience || "Young professionals aged 25-34, tech-savvy, urban dwellers"}
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 bg-amber-50">
                      <h4 className="text-sm font-medium text-amber-800 mb-2">Key Message</h4>
                      <p className="text-sm text-gray-700">
                        {brief.specifications.message || "Emphasize sustainability and premium quality"}
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
                      <h4 className="text-sm font-medium text-green-800 mb-2">Content Length</h4>
                      <p className="text-sm text-gray-700">
                        {brief.specifications.length || "60-second video, 500-700 words article"}
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 bg-purple-50">
                      <h4 className="text-sm font-medium text-purple-800 mb-2">Call To Action</h4>
                      <p className="text-sm text-gray-700">
                        {brief.specifications.cta || "Sign up for a free trial"}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-4 mt-2">
                    <p className="text-xs text-gray-500 mb-2">Full specifications JSON:</p>
                    <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded overflow-auto max-h-40">
                      {JSON.stringify(brief.specifications, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 italic">No specifications provided.</p>
              )}
            </div>
          </div>
          
          {/* Reference Materials */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reference Materials</h3>
              {relatedFiles.length > 0 ? (
                <div className="space-y-3">
                  {relatedFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center">
                        {file.type === 'pdf' && <FileText className="h-5 w-5 text-red-500 mr-3" />}
                        {file.type === 'image' && <Image className="h-5 w-5 text-blue-500 mr-3" />}
                        {file.type === 'document' && <FileText className="h-5 w-5 text-indigo-500 mr-3" />}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.size}</p>
                        </div>
                      </div>
                      <a href={file.url} className="text-blue-600 hover:text-blue-800">
                        <Download className="h-5 w-5" />
                      </a>
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
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-6 relative">
                  <div className="flex">
                    <div className="flex-shrink-0 z-10">
                      <div className="w-8 h-8 rounded-full bg-green-100 border-4 border-white flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-green-600"></div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">Start Date</h4>
                      <p className="text-sm text-gray-500">{formatDate(brief.start_date)}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex-shrink-0 z-10">
                      <div className="w-8 h-8 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">Current Progress</h4>
                      <p className="text-sm text-gray-500">{brief.status.replace('_', ' ')}</p>
                      <span className="inline-block px-2 py-1 text-xs rounded-full mt-1 bg-blue-100 text-blue-800">
                        {getProgressPercentage(brief.status)}% Complete
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="flex-shrink-0 z-10">
                      <div className="w-8 h-8 rounded-full bg-red-100 border-4 border-white flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-red-600"></div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-medium text-gray-900">Due Date</h4>
                      <p className="text-sm text-gray-500">{formatDate(brief.due_date)}</p>
                      <span className="inline-block px-2 py-1 text-xs rounded-full mt-1 bg-red-100 text-red-800">
                        {getDaysRemaining(brief.due_date)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
              <dl className="space-y-3">
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
                  <dd className="text-sm text-gray-900 mt-1 flex items-center">
                    {creator?.avatar_url ? (
                      <img src={creator.avatar_url} alt={creator.name} className="w-5 h-5 rounded-full mr-1" />
                    ) : (
                      <Users className="h-4 w-4 text-gray-400 mr-1" />
                    )}
                    {creator?.name || 'Unknown'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created At</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {brief.created_at ? formatDate(brief.created_at) : 'Not available'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {brief.updated_at ? formatDate(brief.updated_at) : 'Not available'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* Resource */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resource</h3>
              {resource ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-gray-900 font-medium">{resource.name}</p>
                      <p className="text-gray-600 mt-1 capitalize">
                        {resource.type}
                        {resource.media_type ? ` • ${resource.media_type}` : ''}
                      </p>
                    </div>
                    <div className="bg-blue-100 px-3 py-1 rounded-md">
                      <span className="text-xs text-blue-800 font-medium">
                        {resource.hourly_rate ? `$${resource.hourly_rate.toFixed(2)}/hr` : 'Rate N/A'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Resource availability visualization */}
                  <div className="mt-3 border-t border-gray-200 pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Availability</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 w-10">Today</span>
                        <div className="ml-2 flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                        <span className="ml-2 text-xs text-gray-500">60%</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 w-10">Week</span>
                        <div className="ml-2 flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-amber-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                        </div>
                        <span className="ml-2 text-xs text-gray-500">80%</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 w-10">Month</span>
                        <div className="ml-2 flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <span className="ml-2 text-xs text-gray-500">45%</span>
                      </div>
                    </div>
                  </div>

                  {/* Cost information */}
                  {resource.hourly_rate && brief.estimated_hours && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Cost Breakdown</h4>
                      
                      <div className="space-y-1">
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
                <div className="text-center py-4">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No resource assigned</p>
                  {canEdit && (
                    <Button variant="outline" className="mt-3 text-xs px-2 py-1">
                      Assign Resource
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Brand Guidelines */}
          {brandGuidelines && (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Brand Guidelines</h3>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{brandGuidelines.name}</h4>
                  
                  {/* Brand colors */}
                  <div className="mb-4">
                    <h5 className="text-xs text-gray-500 mb-2">Brand Colors</h5>
                    <div className="flex space-x-2">
                      {brandGuidelines.colors.map((color: any, index: number) => (
                        <div key={index} className="text-center">
                          <div 
                            className="w-8 h-8 rounded-md mb-1 border border-gray-200" 
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          ></div>
                          <span className="text-xs text-gray-500">{color.name.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Brand fonts */}
                  <div className="mb-4">
                    <h5 className="text-xs text-gray-500 mb-2">Brand Fonts</h5>
                    <div className="flex flex-wrap gap-2">
                      {brandGuidelines.fonts.map((font: string, index: number) => (
                        <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">{font}</span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Brand tone */}
                  <div>
                    <h5 className="text-xs text-gray-500 mb-2">Brand Tone</h5>
                    <p className="text-sm text-gray-700">{brandGuidelines.tone}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
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
                        <span className="text-gray-500">Due: {formatDate(relatedBrief.due_date)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Approver */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Approver</h3>
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
                  <div>
                    <p className="text-gray-900 font-medium">{approver.name}</p>
                    <p className="text-gray-600 text-sm mt-1 capitalize">{approver.role}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No approver assigned</p>
                  {canEdit && (
                    <Button variant="outline" className="mt-3 text-xs px-2 py-1">
                      Assign Approver
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BriefDetail;
