import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Resource, Brief } from '../types';
import MediaTypeUtilization from '../components/MediaTypeUtilization';
import ResourceForecast from '../components/ResourceForecast';
import { format } from 'date-fns';
import { BarChart3, Users, Briefcase, PieChart, TrendingUp } from 'lucide-react';

const ResourceDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'media-types' | 'capacity' | 'forecast'>('overview');
  
  // Resource statistics
  const [totalResources, setTotalResources] = useState(0);
  const [internalResources, setInternalResources] = useState(0);
  const [agencyResources, setAgencyResources] = useState(0);
  const [freelancerResources, setFreelancerResources] = useState(0);
  const [totalHoursCapacity, setTotalHoursCapacity] = useState(0);
  const [totalHoursAllocated, setTotalHoursAllocated] = useState(0);
  const [overallocatedResources, setOverallocatedResources] = useState(0);
  const [mediaTypeStats, setMediaTypeStats] = useState<{ [key: string]: { count: number, capacity: number, allocated: number } }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch resources with all necessary fields
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('id, name, type, capacity_hours, hourly_rate, media_type, created_at, updated_at')
          .order('name');
        
        if (resourcesError) throw resourcesError;
        
        // Fetch briefs for resource utilization
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select('id, title, status, start_date, due_date, resource_id, estimated_hours')
          .order('due_date');
        
        if (briefsError) throw briefsError;
        
        setResources(resourcesData);
        setBriefs(briefsData);
        
        // Calculate statistics
        calculateStatistics(resourcesData, briefsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load resource data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const calculateStatistics = (resources: Resource[], briefs: Brief[]) => {
    // Count resources by type
    const internal = resources.filter(r => r.type === 'internal').length;
    const agency = resources.filter(r => r.type === 'agency').length;
    const freelancer = resources.filter(r => r.type === 'freelancer').length;
    
    // Calculate total capacity
    const totalCapacity = resources.reduce((sum, r) => sum + (r.capacity_hours || 40), 0);
    
    // Calculate allocated hours and overallocated resources
    let allocatedHours = 0;
    let overallocated = 0;
    
    // Initialize media type statistics
    const mediaStats: { [key: string]: { count: number, capacity: number, allocated: number } } = {};
    
    // Process each resource
    resources.forEach(resource => {
      // Get briefs for this resource
      const resourceBriefs = briefs.filter(b => b.resource_id === resource.id);
      
      // Calculate allocated hours for this resource
      const resourceAllocated = resourceBriefs.reduce((sum, b) => sum + (b.estimated_hours || 0), 0);
      allocatedHours += resourceAllocated;
      
      // Check if overallocated
      const capacity = resource.capacity_hours || 40;
      if (resourceAllocated > capacity) {
        overallocated++;
      }
      
      // Process media type statistics
      const mediaType = resource.media_type || 'Unspecified';
      if (!mediaStats[mediaType]) {
        mediaStats[mediaType] = { count: 0, capacity: 0, allocated: 0 };
      }
      
      mediaStats[mediaType].count++;
      mediaStats[mediaType].capacity += capacity;
      mediaStats[mediaType].allocated += resourceAllocated;
    });
    
    // Save all statistics
    setTotalResources(resources.length);
    setInternalResources(internal);
    setAgencyResources(agency);
    setFreelancerResources(freelancer);
    setTotalHoursCapacity(totalCapacity);
    setTotalHoursAllocated(allocatedHours);
    setOverallocatedResources(overallocated);
    setMediaTypeStats(mediaStats);
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

  // Get top allocated resources
  const getTopAllocatedResources = () => {
    return resources
      .map(resource => {
        const allocated = briefs
          .filter(brief => brief.resource_id === resource.id)
          .reduce((sum, brief) => sum + (brief.estimated_hours || 0), 0);
        
        const capacity = resource.capacity_hours || 40;
        const utilization = capacity > 0 ? (allocated / capacity) * 100 : 0;
        
        return {
          ...resource,
          allocated,
          utilization
        };
      })
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md shadow-sm">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Resource Dashboard</h2>
            <p className="text-gray-600 mt-1">Comprehensive view of resource allocation and utilization</p>
          </div>
        </div>
        
        {/* Tabs Navigation */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PieChart className="inline-block h-5 w-5 mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('media-types')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'media-types'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="inline-block h-5 w-5 mr-2" />
              Media Type Utilization
            </button>
            <button
              onClick={() => setActiveTab('capacity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'capacity'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Briefcase className="inline-block h-5 w-5 mr-2" />
              Capacity Planning
            </button>
            <button
              onClick={() => setActiveTab('forecast')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'forecast'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="inline-block h-5 w-5 mr-2" />
              Resource Forecast
            </button>
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Resources */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-full p-3">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Resources
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {totalResources}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Internal: {internalResources}</span>
                  <span className="text-gray-500">Agency: {agencyResources}</span>
                  <span className="text-gray-500">Freelance: {freelancerResources}</span>
                </div>
              </div>
            </div>
            
            {/* Resource Utilization */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-emerald-100 rounded-full p-3">
                  <BarChart3 className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Overall Utilization
                    </dt>
                    <dd className="flex items-baseline">
                      <div className={`text-2xl font-semibold ${getUtilizationColor(totalHoursCapacity > 0 ? (totalHoursAllocated / totalHoursCapacity) * 100 : 0)}`}>
                        {totalHoursCapacity > 0 ? ((totalHoursAllocated / totalHoursCapacity) * 100).toFixed(1) : 0}%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="relative pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-blue-600">
                        {totalHoursAllocated} / {totalHoursCapacity} hours
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mt-2 text-xs flex rounded bg-gray-200">
                    <div 
                      style={{ width: `${Math.min((totalHoursAllocated / totalHoursCapacity) * 100, 100)}%` }} 
                      className={`${getUtilizationBgColor(totalHoursCapacity > 0 ? (totalHoursAllocated / totalHoursCapacity) * 100 : 0)} rounded`}>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Resource Status */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-full p-3">
                  <Briefcase className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Resource Status
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {overallocatedResources} <span className="text-sm text-red-500">overallocated</span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-green-500">Available: {totalResources - overallocatedResources}</span>
                  <span className="text-red-500">Overallocated: {overallocatedResources}</span>
                </div>
              </div>
            </div>
            
            {/* Media Types */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-full p-3">
                  <PieChart className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Media Types
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {Object.keys(mediaTypeStats).length}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4 border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-600">
                  {Object.keys(mediaTypeStats).slice(0, 3).map(type => (
                    <div key={type} className="flex justify-between items-center mt-1">
                      <span className="truncate">{type}</span>
                      <span className="font-medium">{mediaTypeStats[type].count}</span>
                    </div>
                  ))}
                  {Object.keys(mediaTypeStats).length > 3 && (
                    <div className="text-xs text-center mt-2 text-gray-500">
                      +{Object.keys(mediaTypeStats).length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Most Utilized Resources */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top 5 Most Utilized Resources</h3>
            </div>
            <div className="px-6 py-5">
              <div className="space-y-4">
                {getTopAllocatedResources().map(resource => {
                  return (
                    <div key={resource.id} className="group">
                      <div className="flex items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 w-40 truncate" title={resource.name}>
                          {resource.name}
                        </span>
                        <span className="text-xs ml-2 px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                          {resource.type}
                        </span>
                        <span className="text-xs ml-2 px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                          {resource.media_type || "Unspecified"}
                        </span>
                        <span className={`ml-auto text-sm font-medium ${getUtilizationColor(resource.utilization)}`}>
                          {resource.utilization.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getUtilizationBgColor(resource.utilization)}`} 
                          style={{ width: `${Math.min(resource.utilization, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {resource.allocated} / {resource.capacity_hours || 40} hours
                      </div>
                    </div>
                  );
                })}
                
                {resources.length === 0 && (
                  <div className="text-sm text-gray-500 text-center p-4">
                    No resources found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'media-types' && (
        <MediaTypeUtilization />
      )}
      
      {activeTab === 'capacity' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Capacity Planning</h3>
          
          <p className="text-gray-600 mb-6">
            Capacity planning helps you understand resource allocation over time and plan future projects more effectively.
          </p>
          
          {/* Resources by Media Type */}
          <div className="mb-8">
            <h4 className="text-md font-medium text-gray-800 mb-4">Resource Allocation by Media Type</h4>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Media Type
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Resources
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Capacity (hours)
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Allocated (hours)
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Utilization
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {Object.entries(mediaTypeStats).map(([mediaType, stats]) => {
                    const utilization = stats.capacity > 0 ? (stats.allocated / stats.capacity) * 100 : 0;
                    
                    return (
                      <tr key={mediaType}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {mediaType}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {stats.count}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {stats.capacity}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {stats.allocated.toFixed(0)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <div className="flex items-center">
                            <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                              <div 
                                className={`h-full ${getUtilizationBgColor(utilization)} rounded-full`} 
                                style={{ width: `${Math.min(utilization, 100)}%` }}
                              ></div>
                            </div>
                            <span className={getUtilizationColor(utilization)}>
                              {utilization.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  
                  {Object.keys(mediaTypeStats).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No media types found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Capacity Planning Guidance */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-md font-medium text-blue-800 mb-2">Capacity Planning Tips</h4>
            <ul className="list-disc pl-5 text-sm text-blue-700 space-y-2">
              <li>Aim to keep resource utilization between 70-80% to allow for unexpected work</li>
              <li>Resources with utilization above 90% are at risk of burnout or missed deadlines</li>
              <li>Consider adding resources or adjusting timelines for overallocated media types</li>
              <li>Balance workload across resources of the same media type when possible</li>
            </ul>
          </div>
        </div>
      )}
      
      {activeTab === 'forecast' && (
        <ResourceForecast />
      )}
    </div>
  );
};

export default ResourceDashboard;