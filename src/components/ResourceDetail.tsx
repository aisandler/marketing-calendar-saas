import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Brief, Resource } from '../types';
import { X, Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDate } from '../lib/utils';

interface ResourceDetailProps {
  resourceId: string;
  onClose: () => void;
}

const ResourceDetail = ({ resourceId, onClose }: ResourceDetailProps) => {
  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState<Resource | null>(null);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResourceDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch resource details
        const { data: resourceData, error: resourceError } = await supabase
          .from('resources')
          .select('*')
          .eq('id', resourceId)
          .single();
        
        if (resourceError) throw resourceError;
        
        // Fetch briefs assigned to this resource
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select(`
            id, 
            title, 
            description, 
            status, 
            start_date, 
            due_date, 
            estimated_hours,
            brand_id,
            campaign_id,
            channel
          `)
          .eq('resource_id', resourceId)
          .neq('status', 'cancelled')
          .order('due_date');
        
        if (briefsError) throw briefsError;
        
        setResource(resourceData);
        setBriefs(briefsData);
      } catch (error) {
        console.error('Error fetching resource details:', error);
        setError('Failed to load resource details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResourceDetails();
  }, [resourceId]);

  // Calculate utilization percentage
  const calculateUtilization = () => {
    if (!resource) return 0;
    
    const capacity = resource.capacity_hours || 20;
    const totalHours = briefs.reduce((sum, brief) => sum + (brief.estimated_hours || 0), 0);
    
    return (totalHours / capacity) * 100;
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-indigo-100 text-indigo-800';
      case 'review':
        return 'bg-purple-100 text-purple-800';
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get color for utilization percentage
  const getUtilizationColor = (percent: number) => {
    if (percent < 50) return 'text-emerald-500';
    if (percent < 75) return 'text-blue-500';
    if (percent < 90) return 'text-amber-500';
    return 'text-red-500';
  };
  
  // Get background color for utilization bar
  const getUtilizationBgColor = (percent: number) => {
    if (percent < 50) return 'bg-emerald-500';
    if (percent < 75) return 'bg-blue-500';
    if (percent < 90) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-3xl relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-3xl relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p>{error || 'Resource not found'}</p>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const utilization = calculateUtilization();
  const totalHours = briefs.reduce((sum, brief) => sum + (brief.estimated_hours || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{resource.name}</h2>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Resource Type</p>
            <p className="text-lg font-medium capitalize">{resource.type}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Media Type</p>
            <p className="text-lg font-medium">{resource.media_type || 'Unspecified'}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Hourly Rate</p>
            <p className="text-lg font-medium">${resource.hourly_rate || 0}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">Utilization</h3>
            <p className={`text-lg font-medium ${getUtilizationColor(utilization)}`}>
              {utilization.toFixed(1)}%
            </p>
          </div>
          
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getUtilizationBgColor(utilization)}`} 
              style={{ width: `${Math.min(utilization, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>{totalHours} hours allocated</span>
            <span>{resource.capacity_hours || 20} hours capacity</span>
          </div>
          
          {utilization > 100 && (
            <div className="flex items-center mt-2 text-red-600 text-sm">
              <AlertTriangle className="h-4 w-4 mr-1" />
              <span>This resource is overallocated</span>
            </div>
          )}
        </div>
        
        <h3 className="text-xl font-semibold mb-4">Assigned Briefs ({briefs.length})</h3>
        
        {briefs.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500">No briefs assigned to this resource</p>
          </div>
        ) : (
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brief
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timeline
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {briefs.map(brief => (
                  <tr key={brief.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a 
                        href={`/briefs/${brief.id}`} 
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {brief.title}
                      </a>
                      <div className="text-xs text-gray-500 mt-1">
                        {brief.channel || 'No channel'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(brief.status)}`}>
                        {brief.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{formatDate(brief.start_date)} - {formatDate(brief.due_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-medium">
                        <Clock className="h-4 w-4 mr-1 text-gray-500" />
                        <span>{brief.estimated_hours || 0}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetail; 