import React from 'react';
import { Resource, Brief } from '../../types';
import { Users, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

interface ResourceOverviewProps {
  totalResources: number;
  internalResources: number;
  agencyResources: number;
  freelancerResources: number;
  totalHoursCapacity: number;
  totalHoursAllocated: number;
  overallocatedResources: number;
  mediaTypeStats: { [key: string]: { count: number, capacity: number, allocated: number } };
  resources: Resource[];
  briefs: Brief[];
}

const ResourceOverview: React.FC<ResourceOverviewProps> = ({
  totalResources,
  internalResources,
  agencyResources,
  freelancerResources,
  totalHoursCapacity,
  totalHoursAllocated,
  overallocatedResources,
  mediaTypeStats,
  resources,
  briefs
}) => {
  // Calculate utilization percentage
  const utilizationPercentage = totalHoursCapacity > 0 
    ? Math.round((totalHoursAllocated / totalHoursCapacity) * 100) 
    : 0;
  
  // Get color for utilization
  const getUtilizationColor = (percentage: number) => {
    if (percentage > 100) return 'text-red-600';
    if (percentage > 85) return 'text-amber-500';
    if (percentage > 60) return 'text-green-500';
    return 'text-blue-500';
  };
  
  // Get top 5 most utilized resources
  const getTopUtilizedResources = () => {
    return resources.map(resource => {
      const capacity = resource.capacity_hours || 0;
      const resourceBriefs = briefs.filter(brief => brief.resource_id === resource.id);
      const allocated = resourceBriefs.reduce((sum, brief) => sum + (brief.estimated_hours || 0), 0);
      const utilizationPercentage = capacity > 0 ? (allocated / capacity) * 100 : 0;
      
      return {
        id: resource.id,
        name: resource.name,
        type: resource.type,
        mediaType: resource.media_type,
        capacity,
        allocated,
        utilizationPercentage
      };
    })
    .sort((a, b) => b.utilizationPercentage - a.utilizationPercentage)
    .slice(0, 5);
  };
  
  const topUtilizedResources = getTopUtilizedResources();
  
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-medium text-gray-900 mb-4">Resource Overview</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-full bg-blue-100">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Resources</h3>
              <span className="text-3xl font-semibold text-gray-900">{totalResources}</span>
              <div className="mt-1 text-xs text-gray-500">
                <span className="inline-block mr-2">Internal: {internalResources}</span>
                <span className="inline-block mr-2">Agency: {agencyResources}</span>
                <span className="inline-block">Freelance: {freelancerResources}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-full bg-green-100">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Capacity Utilization</h3>
              <span className={`text-3xl font-semibold ${getUtilizationColor(utilizationPercentage)}`}>
                {utilizationPercentage}%
              </span>
              <div className="mt-1 text-xs text-gray-500">
                {totalHoursAllocated} of {totalHoursCapacity} hours allocated
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-full bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Overallocated Resources</h3>
              <span className="text-3xl font-semibold text-gray-900">{overallocatedResources}</span>
              <div className="mt-1 text-xs text-gray-500">
                Need attention to prevent burnout
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-full bg-purple-100">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Active Projects</h3>
              <span className="text-3xl font-semibold text-gray-900">
                {briefs.filter(brief => ['approved', 'in_progress', 'review'].includes(brief.status)).length}
              </span>
              <div className="mt-1 text-xs text-gray-500">
                Requiring resource allocation
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Top Utilized Resources */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Utilized Resources</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Media Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilization
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topUtilizedResources.map(resource => (
                <tr key={resource.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {resource.name}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 capitalize">
                    {resource.type}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {resource.mediaType || '-'}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className={`h-2.5 rounded-full ${
                            resource.utilizationPercentage > 100 
                              ? 'bg-red-500' 
                              : resource.utilizationPercentage > 85 
                                ? 'bg-amber-500' 
                                : 'bg-green-500'
                          }`} 
                          style={{ width: `${Math.min(resource.utilizationPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-medium ${
                        resource.utilizationPercentage > 100 
                          ? 'text-red-700' 
                          : resource.utilizationPercentage > 85 
                            ? 'text-amber-700'
                            : 'text-green-700'
                      }`}>
                        {Math.round(resource.utilizationPercentage)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {resource.allocated} / {resource.capacity}
                  </td>
                </tr>
              ))}
              {topUtilizedResources.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-sm text-gray-500 text-center">
                    No resource utilization data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Media Type Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Media Type Distribution</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(mediaTypeStats).map(([mediaType, stats]) => (
            <div key={mediaType} className="bg-gray-50 rounded p-3">
              <h4 className="font-medium text-gray-900">{mediaType}</h4>
              <div className="mt-2 text-sm text-gray-500">
                <div className="flex justify-between mb-1">
                  <span>Resources:</span>
                  <span className="font-medium">{stats.count}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Capacity:</span>
                  <span className="font-medium">{stats.capacity} hours</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Allocated:</span>
                  <span className="font-medium">{stats.allocated} hours</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Utilization:</span>
                  <span className={`font-medium ${
                    stats.capacity > 0 && (stats.allocated / stats.capacity) > 1 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {stats.capacity > 0 ? Math.round((stats.allocated / stats.capacity) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          ))}
          {Object.keys(mediaTypeStats).length === 0 && (
            <div className="col-span-3 text-center py-6 text-gray-500">
              No media type data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceOverview; 