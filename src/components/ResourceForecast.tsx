import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Resource, Brief } from '../types';
import { format, addWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays } from 'date-fns';

interface ResourceWithAllocation {
  id: string;
  name: string;
  type: string;
  media_type?: string;
  capacity_hours?: number;
  weekly_allocation: {
    [key: string]: number; // week start date -> hours
  };
  total_allocated: number;
  utilization_percentage: number;
}

interface ForecastWeek {
  startDate: Date;
  endDate: Date;
  label: string;
}

const ResourceForecast = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forecastWeeks, setForecastWeeks] = useState<ForecastWeek[]>([]);
  const [resourceAllocations, setResourceAllocations] = useState<ResourceWithAllocation[]>([]);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterMediaType, setFilterMediaType] = useState<string | null>(null);
  const [showOverallocatedOnly, setShowOverallocatedOnly] = useState(false);
  const [availableMediaTypes, setAvailableMediaTypes] = useState<string[]>([]);

  // Number of weeks to forecast - default to 8 weeks
  const numberOfWeeks = 8;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch resources with necessary fields
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('id, name, type, capacity_hours, hourly_rate, media_type, created_at')
          .order('name');

        if (resourcesError) {
          throw resourcesError;
        }

        // Fetch briefs with estimated_hours and dates
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select('id, title, status, start_date, due_date, resource_id, estimated_hours')
          .not('resource_id', 'is', null)
          .not('estimated_hours', 'is', null);

        if (briefsError) {
          throw briefsError;
        }

        setResources(resourcesData);
        setBriefs(briefsData);

        // Extract unique media types
        const mediaTypes = Array.from(
          new Set(
            resourcesData
              .filter(resource => resource.media_type)
              .map(resource => resource.media_type)
          )
        ).sort() as string[];
        
        setAvailableMediaTypes(mediaTypes);

        // Generate forecast weeks
        const today = new Date();
        const startDate = startOfWeek(today);
        const weeks: ForecastWeek[] = [];

        for (let i = 0; i < numberOfWeeks; i++) {
          const weekStart = addWeeks(startDate, i);
          const weekEnd = endOfWeek(weekStart);
          weeks.push({
            startDate: weekStart,
            endDate: weekEnd,
            label: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`
          });
        }

        setForecastWeeks(weeks);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load resource and brief data');
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate resource allocations whenever resources, briefs, or forecast weeks change
  useEffect(() => {
    if (resources.length === 0 || briefs.length === 0 || forecastWeeks.length === 0) return;

    calculateResourceAllocations();
  }, [resources, briefs, forecastWeeks, filterType, filterMediaType, showOverallocatedOnly]);

  const calculateResourceAllocations = () => {
    // Filter resources based on selection
    let filteredResources = [...resources];
    
    if (filterType) {
      filteredResources = filteredResources.filter(r => r.type === filterType);
    }
    
    if (filterMediaType) {
      filteredResources = filteredResources.filter(r => r.media_type === filterMediaType);
    }

    // Calculate allocation for each resource and week
    const allocations: ResourceWithAllocation[] = filteredResources.map(resource => {
      const weeklyAllocation: { [key: string]: number } = {};
      let totalAllocated = 0;

      // Initialize weekly allocation with zeros
      forecastWeeks.forEach(week => {
        const weekKey = format(week.startDate, 'yyyy-MM-dd');
        weeklyAllocation[weekKey] = 0;
      });

      // Calculate allocation for each brief assigned to this resource
      const resourceBriefs = briefs.filter(brief => brief.resource_id === resource.id);
      
      resourceBriefs.forEach(brief => {
        // Check for valid dates
        if (!brief.start_date || !brief.due_date) return;
        
        try {
          const briefStartDate = new Date(brief.start_date);
          const briefEndDate = new Date(brief.due_date);
          
          // Check for invalid dates (NaN)
          if (isNaN(briefStartDate.getTime()) || isNaN(briefEndDate.getTime())) return;
          
          // Ensure start date is before or equal to end date
          if (briefStartDate > briefEndDate) return;
          
          const briefDuration = eachDayOfInterval({ start: briefStartDate, end: briefEndDate });
          
          // Estimate hours per day based on total hours and duration
          const estimatedHours = brief.estimated_hours || 0;
          const hoursPerDay = briefDuration.length > 0 ? estimatedHours / briefDuration.length : 0;
          
          // Distribute hours across days that fall within our forecast weeks
          briefDuration.forEach(day => {
            forecastWeeks.forEach(week => {
              if (day >= week.startDate && day <= week.endDate) {
                const weekKey = format(week.startDate, 'yyyy-MM-dd');
                weeklyAllocation[weekKey] += hoursPerDay;
                totalAllocated += hoursPerDay;
              }
            });
          });
        } catch (err) {
          console.error('Error processing brief dates:', err);
        }
      });

      // Calculate utilization as a percentage of capacity
      const capacity = resource.capacity_hours || 40;
      const utilizationPercentage = (totalAllocated / (capacity * numberOfWeeks)) * 100;

      return {
        ...resource,
        weekly_allocation: weeklyAllocation,
        total_allocated: totalAllocated,
        utilization_percentage: utilizationPercentage
      };
    });

    // Further filter by overallocation if needed
    let finalAllocations = allocations;
    if (showOverallocatedOnly) {
      finalAllocations = allocations.filter(resource => {
        // Check if any week exceeds capacity
        const capacity = resource.capacity_hours || 40;
        return Object.values(resource.weekly_allocation).some(weekHours => weekHours > capacity);
      });
    }

    // Sort by utilization percentage (highest first)
    finalAllocations.sort((a, b) => b.utilization_percentage - a.utilization_percentage);
    
    setResourceAllocations(finalAllocations);
  };

  // Get color based on utilization percentage
  const getUtilizationColor = (percentage: number) => {
    if (percentage < 50) return 'bg-emerald-500';
    if (percentage < 75) return 'bg-blue-500';
    if (percentage < 90) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Get text color based on utilization percentage
  const getUtilizationTextColor = (percentage: number) => {
    if (percentage < 50) return 'text-emerald-700';
    if (percentage < 75) return 'text-blue-700';
    if (percentage < 90) return 'text-amber-700';
    return 'text-red-700';
  };

  // Check if a week is overallocated
  const isWeekOverallocated = (weekHours: number, capacity: number) => {
    return weekHours > capacity;
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
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Resource Allocation Forecast</h2>
        <p className="text-gray-600 mb-6">
          This forecast shows projected resource allocation over the next {numberOfWeeks} weeks based on brief start and due dates.
        </p>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Resource Type Filter */}
          <div>
            <label htmlFor="resource-type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Resource Type
            </label>
            <select
              id="resource-type-filter"
              value={filterType || ''}
              onChange={(e) => setFilterType(e.target.value || null)}
              className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="internal">Internal</option>
              <option value="agency">Agency</option>
              <option value="freelancer">Freelancer</option>
            </select>
          </div>
          
          {/* Media Type Filter */}
          <div>
            <label htmlFor="media-type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Media Type
            </label>
            <select
              id="media-type-filter"
              value={filterMediaType || ''}
              onChange={(e) => setFilterMediaType(e.target.value || null)}
              className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Media Types</option>
              {availableMediaTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          
          {/* Overallocated Filter */}
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showOverallocatedOnly}
                onChange={(e) => setShowOverallocatedOnly(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Show overallocated only</span>
            </label>
          </div>
          
          {/* Reset button */}
          <div className="flex items-end ml-auto">
            <button
              onClick={() => {
                setFilterType(null);
                setFilterMediaType(null);
                setShowOverallocatedOnly(false);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reset Filters
            </button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 bg-emerald-500 rounded-sm mr-1" />
            <span>Under 50%</span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 bg-blue-500 rounded-sm mr-1" />
            <span>50-75%</span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 bg-amber-500 rounded-sm mr-1" />
            <span>75-90%</span>
          </div>
          <div className="flex items-center text-xs">
            <div className="w-3 h-3 bg-red-500 rounded-sm mr-1" />
            <span>Over 90%</span>
          </div>
        </div>
        
        {/* Resource Forecast Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-10">
                  Resource
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 whitespace-nowrap bg-gray-50">
                  Type & Media
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 whitespace-nowrap bg-gray-50">
                  Weekly Capacity
                </th>
                {forecastWeeks.map((week, index) => (
                  <th key={index} scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {week.label}
                  </th>
                ))}
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 whitespace-nowrap bg-gray-50">
                  Overall
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {resourceAllocations.length > 0 ? (
                resourceAllocations.map((resource) => {
                  const capacity = resource.capacity_hours || 40;
                  
                  return (
                    <tr key={resource.id}>
                      <td className="py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 whitespace-nowrap border-r">
                        {resource.name}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="capitalize">{resource.type}</span>
                          <span className="text-xs text-gray-400">{resource.media_type || 'Unspecified'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {capacity} hrs
                      </td>
                      {forecastWeeks.map((week, index) => {
                        const weekKey = format(week.startDate, 'yyyy-MM-dd');
                        const allocatedHours = resource.weekly_allocation[weekKey] || 0;
                        const weekUtilizationPercent = (allocatedHours / capacity) * 100;
                        const weekOverallocated = isWeekOverallocated(allocatedHours, capacity);
                        
                        return (
                          <td 
                            key={index} 
                            className={`px-3 py-4 text-sm whitespace-nowrap ${weekOverallocated ? 'bg-red-50' : ''}`}
                          >
                            <div className="flex flex-col">
                              <span className={getUtilizationTextColor(weekUtilizationPercent)}>
                                {allocatedHours.toFixed(1)} hrs
                              </span>
                              <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                                <div 
                                  className={`h-full ${getUtilizationColor(weekUtilizationPercent)} rounded-full`}
                                  style={{ width: `${Math.min(weekUtilizationPercent, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-3 py-4 text-sm whitespace-nowrap bg-gray-50">
                        <div className="flex items-center">
                          <span className={`font-medium ${getUtilizationTextColor(resource.utilization_percentage)}`}>
                            {resource.utilization_percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3 + forecastWeeks.length + 1} className="px-3 py-4 text-sm text-center text-gray-500">
                    No resources match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resource Allocation Insights */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-3">
          Resource Forecasting Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Overallocation Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-amber-800 mb-2">Overallocation Warnings</h4>
            <div className="text-sm text-amber-700">
              {resourceAllocations.filter(r => {
                const capacity = r.capacity_hours || 40;
                return Object.values(r.weekly_allocation).some(hours => hours > capacity);
              }).length > 0 ? (
                <>
                  <p className="mb-2">
                    {resourceAllocations.filter(r => {
                      const capacity = r.capacity_hours || 40;
                      return Object.values(r.weekly_allocation).some(hours => hours > capacity);
                    }).length} resources are overallocated in the upcoming weeks.
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    {resourceAllocations
                      .filter(r => {
                        const capacity = r.capacity_hours || 40;
                        return Object.values(r.weekly_allocation).some(hours => hours > capacity);
                      })
                      .slice(0, 3)
                      .map(r => (
                        <li key={r.id}>{r.name}</li>
                      ))}
                    {resourceAllocations.filter(r => {
                      const capacity = r.capacity_hours || 40;
                      return Object.values(r.weekly_allocation).some(hours => hours > capacity);
                    }).length > 3 && (
                      <li>...and {resourceAllocations.filter(r => {
                        const capacity = r.capacity_hours || 40;
                        return Object.values(r.weekly_allocation).some(hours => hours > capacity);
                      }).length - 3} more</li>
                    )}
                  </ul>
                </>
              ) : (
                <p>No resources are currently overallocated in the forecasted period.</p>
              )}
            </div>
          </div>
          
          {/* Media Type Insights */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Media Type Utilization</h4>
            <div className="text-sm text-blue-700">
              {availableMediaTypes.length > 0 ? (
                <div className="space-y-2">
                  {availableMediaTypes.map(mediaType => {
                    const resourcesWithType = resourceAllocations.filter(r => r.media_type === mediaType);
                    if (resourcesWithType.length === 0) return null;
                    
                    const avgUtilization = resourcesWithType.reduce((sum, r) => sum + r.utilization_percentage, 0) / resourcesWithType.length;
                    
                    return (
                      <div key={mediaType} className="flex justify-between items-center">
                        <span>{mediaType}:</span>
                        <span className={getUtilizationTextColor(avgUtilization)}>
                          {avgUtilization.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>No media types defined for resources.</p>
              )}
            </div>
          </div>
          
          {/* Resource Availability */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-emerald-800 mb-2">Resource Availability</h4>
            <div className="text-sm text-emerald-700">
              {resourceAllocations.length > 0 ? (
                <>
                  <p className="mb-2">Resources with high availability:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {resourceAllocations
                      .filter(r => r.utilization_percentage < 50)
                      .slice(0, 5)
                      .map(r => (
                        <li key={r.id}>
                          {r.name} ({r.utilization_percentage.toFixed(1)}% utilized)
                        </li>
                      ))}
                    {resourceAllocations.filter(r => r.utilization_percentage < 50).length === 0 && (
                      <li>No resources with low utilization found.</li>
                    )}
                  </ul>
                </>
              ) : (
                <p>No resource data available.</p>
              )}
            </div>
          </div>
        </div>

        {/* What-If Planning Section */}
        <div className="mt-8 p-4 border border-gray-200 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-3">Forecast Planning</h4>
          <p className="text-sm text-gray-600 mb-4">
            Use this forecast to make informed decisions about resource allocation and project planning:
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
            <li>Identify potential bottlenecks in the next {numberOfWeeks} weeks</li>
            <li>Plan new briefs around resource availability</li>
            <li>Consider reallocating work for overallocated resources</li>
            <li>Adjust project timelines to balance workload</li>
            <li>Identify potential needs for additional resources or contractors</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResourceForecast;