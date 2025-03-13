import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Brief, Resource } from '../types';

interface ResourceWithBriefs extends Resource {
  briefs: Brief[];
}

interface MediaTypeData {
  type: string;
  totalResources: number;
  totalHours: number;
  allocatedHours: number;
  utilization: number;
  resources: ResourceWithBriefs[];
}

const MediaTypeUtilization = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch resources with media_type
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('id, name, type, capacity_hours, hourly_rate, media_type, created_at')
          .order('media_type, name');

        if (resourcesError) {
          throw resourcesError;
        }

        // Fetch briefs with resource_id
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select('id, title, status, start_date, due_date, resource_id, estimated_hours')
          .not('resource_id', 'is', null);

        if (briefsError) {
          throw briefsError;
        }

        setResources(resourcesData);
        setBriefs(briefsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load resource and brief data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group resources by media type and calculate utilization
  const mediaTypeData = useMemo<MediaTypeData[]>(() => {
    // Group resources by media type
    const mediaTypeGroups: { [key: string]: Resource[] } = {};
    
    resources.forEach(resource => {
      const mediaType = resource.media_type || 'Unspecified';
      if (!mediaTypeGroups[mediaType]) {
        mediaTypeGroups[mediaType] = [];
      }
      mediaTypeGroups[mediaType].push(resource);
    });

    // Map briefs to resources
    const resourcesWithBriefs: { [key: string]: ResourceWithBriefs } = {};
    
    resources.forEach(resource => {
      resourcesWithBriefs[resource.id] = {
        ...resource,
        briefs: []
      };
    });

    briefs.forEach(brief => {
      if (brief.resource_id && resourcesWithBriefs[brief.resource_id]) {
        resourcesWithBriefs[brief.resource_id].briefs.push(brief);
      } else if (brief.resource_id) {
        // Log warning for briefs with non-existent resource IDs
        console.warn(`Brief ${brief.id} references non-existent resource ID: ${brief.resource_id}`);
      }
    });

    // Calculate utilization by media type
    return Object.entries(mediaTypeGroups).map(([type, typeResources]) => {
      const resourcesWithBriefsArray = typeResources.map(resource => 
        resourcesWithBriefs[resource.id]
      );

      const totalResources = typeResources.length;
      const totalHours = typeResources.reduce((sum, resource) => 
        sum + (resource.capacity_hours || 40), 0);
      
      const allocatedHours = resourcesWithBriefsArray.reduce((sum, resource) => {
        const resourceAllocatedHours = resource.briefs.reduce((briefSum, brief) => 
          briefSum + (brief.estimated_hours || 0), 0);
        return sum + resourceAllocatedHours;
      }, 0);

      const utilization = totalHours > 0 ? (allocatedHours / totalHours) * 100 : 0;

      return {
        type,
        totalResources,
        totalHours,
        allocatedHours,
        utilization,
        resources: resourcesWithBriefsArray
      };
    }).sort((a, b) => b.utilization - a.utilization); // Sort by utilization (highest first)
  }, [resources, briefs]);

  // Function to get color based on utilization percentage
  const getUtilizationColor = (utilization: number) => {
    if (utilization < 50) return 'bg-emerald-500';
    if (utilization < 75) return 'bg-blue-500';
    if (utilization < 90) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Function to get text color based on utilization percentage
  const getUtilizationTextColor = (utilization: number) => {
    if (utilization < 50) return 'text-emerald-700';
    if (utilization < 75) return 'text-blue-700';
    if (utilization < 90) return 'text-amber-700';
    return 'text-red-700';
  };

  if (loading) {
    return (
      <div className="animate-pulse p-6 bg-white rounded-lg shadow">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Media Type Utilization</h2>
        
        {/* Media Type Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            onClick={() => setSelectedType(null)}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedType === null 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          
          {mediaTypeData.map(data => (
            <button
              key={data.type}
              onClick={() => setSelectedType(data.type)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedType === data.type 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {data.type}
            </button>
          ))}
        </div>
        
        {/* Overall Utilization Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Overall Utilization by Media Type</h3>
          <div className="space-y-4">
            {mediaTypeData
              .filter(data => selectedType === null || data.type === selectedType)
              .map(data => (
                <div key={data.type} className="group">
                  <div className="flex items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 w-36 truncate" title={data.type}>
                      {data.type}
                    </span>
                    <span className={`text-sm ml-2 ${getUtilizationTextColor(data.utilization)}`}>
                      {data.utilization.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {data.allocatedHours.toFixed(0)} / {data.totalHours.toFixed(0)} hours
                    </span>
                  </div>
                  <div className="h-5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getUtilizationColor(data.utilization)}`} 
                      style={{ width: `${Math.min(data.utilization, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </div>
        
        {/* Detailed Resource Table */}
        {mediaTypeData
          .filter(data => selectedType === null || data.type === selectedType)
          .map(mediaType => (
            <div key={mediaType.type} className="mt-6">
              <h3 className="text-lg font-medium text-gray-700 mb-2 flex items-center">
                <span>{mediaType.type}</span>
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                  {mediaType.totalResources} resources
                </span>
              </h3>
              
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg mb-8">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Resource
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Type
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Capacity
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Allocated
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Utilization
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {mediaType.resources.map(resource => {
                      const allocated = resource.briefs.reduce((sum, brief) => sum + (brief.estimated_hours || 0), 0);
                      const capacity = resource.capacity_hours || 40;
                      const utilization = capacity > 0 ? (allocated / capacity) * 100 : 0;
                      
                      return (
                        <tr key={resource.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {resource.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {resource.type}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {capacity} hrs
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {allocated.toFixed(0)} hrs
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <div className="flex items-center">
                              <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                                <div 
                                  className={`h-full ${getUtilizationColor(utilization)} rounded-full`} 
                                  style={{ width: `${Math.min(utilization, 100)}%` }}
                                ></div>
                              </div>
                              <span className={getUtilizationTextColor(utilization)}>
                                {utilization.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default MediaTypeUtilization;