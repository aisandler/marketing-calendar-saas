import React, { useState } from 'react';
import { Resource, Brief } from '../../types';
import { AlertTriangle, Info } from 'lucide-react';

interface CapacityPlanningProps {
  resources: Resource[];
  briefs: Brief[];
}

const CapacityPlanning: React.FC<CapacityPlanningProps> = ({
  resources,
  briefs
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'utilization'>('utilization');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Filter resources based on type
  const filteredResources = resources.filter(resource => {
    return filterType === 'all' || resource.type === filterType;
  });
  
  // Calculate resource allocation and utilization
  const resourcesWithUtilization = filteredResources.map(resource => {
    const capacity = resource.capacity_hours || 0;
    const resourceBriefs = briefs.filter(brief => brief.resource_id === resource.id);
    const allocated = resourceBriefs.reduce((sum, brief) => sum + (brief.estimated_hours || 0), 0);
    const utilization = capacity > 0 ? (allocated / capacity) * 100 : 0;
    
    return {
      ...resource,
      allocated,
      utilization,
      briefCount: resourceBriefs.length
    };
  });
  
  // Sort resources
  const sortedResources = [...resourcesWithUtilization].sort((a, b) => {
    if (sortBy === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortBy === 'type') {
      return sortDirection === 'asc'
        ? a.type.localeCompare(b.type)
        : b.type.localeCompare(a.type);
    } else { // utilization
      return sortDirection === 'asc'
        ? a.utilization - b.utilization
        : b.utilization - a.utilization;
    }
  });
  
  // Compute overall statistics
  const totalCapacity = resourcesWithUtilization.reduce((sum, r) => sum + (r.capacity_hours || 0), 0);
  const totalAllocated = resourcesWithUtilization.reduce((sum, r) => sum + r.allocated, 0);
  const overallocatedCount = resourcesWithUtilization.filter(r => r.utilization > 100).length;
  
  // Toggle sort direction or change sort field
  const handleSort = (field: 'name' | 'type' | 'utilization') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc'); // Default to descending for new sort field
    }
  };
  
  // Determine utilization color
  const getUtilizationColor = (percentage: number) => {
    if (percentage > 100) return 'bg-red-500';
    if (percentage > 85) return 'bg-amber-500';
    if (percentage > 50) return 'bg-green-500';
    return 'bg-blue-500';
  };
  
  const getUtilizationTextColor = (percentage: number) => {
    if (percentage > 100) return 'text-red-700';
    if (percentage > 85) return 'text-amber-700'; 
    if (percentage > 50) return 'text-green-700';
    return 'text-blue-700';
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h2 className="text-xl font-medium text-gray-900 mb-4 md:mb-0">Capacity Planning</h2>
        
        <div className="flex space-x-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">All Resources</option>
            <option value="internal">Internal Only</option>
            <option value="agency">Agency Only</option>
            <option value="freelancer">Freelancers Only</option>
          </select>
        </div>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Capacity</p>
              <p className="text-3xl font-semibold text-gray-900">{totalCapacity} hours</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Info className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Allocated</p>
              <p className="text-3xl font-semibold text-gray-900">{totalAllocated} hours</p>
              <p className="text-sm text-gray-500 mt-1">
                {totalCapacity > 0 
                  ? `${Math.round((totalAllocated / totalCapacity) * 100)}% of capacity`
                  : 'No capacity defined'}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Info className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Overallocated Resources</p>
              <p className="text-3xl font-semibold text-gray-900">{overallocatedCount}</p>
              <p className="text-sm text-gray-500 mt-1">
                {resources.length > 0
                  ? `${Math.round((overallocatedCount / resources.length) * 100)}% of resources`
                  : 'No resources defined'}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Capacity visualization */}
      <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Resource Allocation</h3>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span>50-85% (Optimal)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
              <span>85-100% (High)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span>&gt;100% (Overallocated)</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {sortedResources.map(resource => (
            <div key={resource.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{resource.name}</h4>
                  <p className="text-sm text-gray-500 capitalize">{resource.type} • {resource.media_type || 'No media type'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {resource.allocated} / {resource.capacity_hours || 0} hours
                  </p>
                  <p className={`text-sm font-medium ${getUtilizationTextColor(resource.utilization)}`}>
                    {Math.round(resource.utilization)}% utilized
                  </p>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${getUtilizationColor(resource.utilization)}`} 
                  style={{ width: `${Math.min(resource.utilization, 100)}%` }}
                ></div>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                {resource.briefCount} brief{resource.briefCount !== 1 ? 's' : ''} assigned
              </div>
            </div>
          ))}
          
          {sortedResources.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No resources available with the selected filter
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CapacityPlanning; 