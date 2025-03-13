import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { Resource, Brief, Team } from '../../types';
import { format } from 'date-fns';

interface TeamUtilizationData {
  team: Team;
  resourceCount: number;
  totalCapacity: number;
  totalAllocated: number;
  utilization: number;
  resources: Resource[];
}

const TeamUtilization = () => {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [teamUtilizationData, setTeamUtilizationData] = useState<TeamUtilizationData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('name');

        if (teamsError) {
          throw teamsError;
        }

        // Fetch resources with team information
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('id, name, type, capacity_hours, hourly_rate, media_type, team_id, created_at')
          .order('name');

        if (resourcesError) {
          throw resourcesError;
        }

        // Fetch briefs with resource assignments
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select('id, title, status, start_date, due_date, resource_id, estimated_hours')
          .not('resource_id', 'is', null);

        if (briefsError) {
          throw briefsError;
        }

        setTeams(teamsData);
        setResources(resourcesData);
        setBriefs(briefsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load team utilization data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate team utilization data
  useEffect(() => {
    if (teams.length === 0 || resources.length === 0) return;

    const calculateTeamUtilization = () => {
      // Group resources by team
      const resourcesByTeam: Record<string, Resource[]> = {};
      
      // Include unassigned as a "team"
      resourcesByTeam['unassigned'] = [];
      
      // Add actual teams
      teams.forEach(team => {
        resourcesByTeam[team.id] = [];
      });
      
      // Group resources into teams
      resources.forEach(resource => {
        if (resource.team_id && resourcesByTeam[resource.team_id]) {
          resourcesByTeam[resource.team_id].push(resource);
        } else {
          resourcesByTeam['unassigned'].push(resource);
        }
      });
      
      // Calculate utilization for each team
      const utilizationData: TeamUtilizationData[] = teams.map(team => {
        const teamResources = resourcesByTeam[team.id] || [];
        
        // Calculate total capacity for the team
        const teamCapacity = teamResources.reduce((total, resource) => {
          return total + (resource.capacity_hours || 40);
        }, 0);
        
        // Calculate total allocation
        let totalAllocated = 0;
        teamResources.forEach(resource => {
          const resourceBriefs = briefs.filter(brief => brief.resource_id === resource.id);
          const resourceAllocation = resourceBriefs.reduce((total, brief) => {
            return total + (brief.estimated_hours || 0);
          }, 0);
          totalAllocated += resourceAllocation;
        });
        
        // Calculate utilization percentage
        const utilization = teamCapacity > 0 ? (totalAllocated / teamCapacity) * 100 : 0;
        
        return {
          team,
          resourceCount: teamResources.length,
          totalCapacity: teamCapacity,
          totalAllocated,
          utilization,
          resources: teamResources
        };
      });
      
      // Add unassigned resources as a special "team"
      const unassignedResources = resourcesByTeam['unassigned'] || [];
      const unassignedCapacity = unassignedResources.reduce((total, resource) => {
        return total + (resource.capacity_hours || 40);
      }, 0);
      
      let unassignedAllocated = 0;
      unassignedResources.forEach(resource => {
        const resourceBriefs = briefs.filter(brief => brief.resource_id === resource.id);
        const resourceAllocation = resourceBriefs.reduce((total, brief) => {
          return total + (brief.estimated_hours || 0);
        }, 0);
        unassignedAllocated += resourceAllocation;
      });
      
      const unassignedUtilization = unassignedCapacity > 0 ? (unassignedAllocated / unassignedCapacity) * 100 : 0;
      
      if (unassignedResources.length > 0) {
        utilizationData.push({
          team: {
            id: 'unassigned',
            name: 'Unassigned Resources',
            created_at: ''
          },
          resourceCount: unassignedResources.length,
          totalCapacity: unassignedCapacity,
          totalAllocated: unassignedAllocated,
          utilization: unassignedUtilization,
          resources: unassignedResources
        });
      }
      
      // Sort by utilization (highest first)
      utilizationData.sort((a, b) => b.utilization - a.utilization);
      
      setTeamUtilizationData(utilizationData);
    };
    
    calculateTeamUtilization();
  }, [teams, resources, briefs]);

  // Filter utilization data based on selected team
  const filteredUtilizationData = useMemo(() => {
    if (!selectedTeam) return teamUtilizationData;
    return teamUtilizationData.filter(data => data.team.id === selectedTeam);
  }, [teamUtilizationData, selectedTeam]);

  // Calculate resource allocation for a resource
  const getResourceAllocation = (resourceId: string) => {
    const resourceBriefs = briefs.filter(brief => brief.resource_id === resourceId);
    return resourceBriefs.reduce((total, brief) => {
      return total + (brief.estimated_hours || 0);
    }, 0);
  };

  // Function to get color based on utilization percentage
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Team Utilization</h3>
          <p className="text-sm text-gray-500">Resource allocation and utilization by team</p>
        </div>
        
        {/* Team Filter */}
        <div>
          <select
            value={selectedTeam || ''}
            onChange={(e) => setSelectedTeam(e.target.value || null)}
            className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All Teams</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
            <option value="unassigned">Unassigned Resources</option>
          </select>
        </div>
      </div>
      
      {/* Team Utilization Overview */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Team Utilization Overview</h3>
        </div>
        <div className="bg-white overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredUtilizationData.map(data => (
              <li key={data.team.id} className="px-4 py-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-medium text-gray-900">{data.team.name}</h4>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">{data.resourceCount} resources</span>
                    <span className={`text-sm font-medium ${getUtilizationTextColor(data.utilization)}`}>
                      {data.utilization.toFixed(1)}% utilized
                    </span>
                  </div>
                </div>
                
                {/* Team utilization bar */}
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <div 
                    className={`h-full ${getUtilizationColor(data.utilization)}`}
                    style={{ width: `${Math.min(data.utilization, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-500">
                    {data.totalAllocated.toFixed(0)} / {data.totalCapacity.toFixed(0)} hours allocated
                  </span>
                  {data.utilization > 90 && (
                    <span className="text-red-600 font-medium">Overallocated</span>
                  )}
                  {data.utilization < 50 && data.resourceCount > 0 && (
                    <span className="text-emerald-600 font-medium">Capacity available</span>
                  )}
                </div>
                
                {/* Resources within this team */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Resources in this team</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.resources.map(resource => {
                      const capacity = resource.capacity_hours || 40;
                      const allocated = getResourceAllocation(resource.id);
                      const utilization = (allocated / capacity) * 100;
                      
                      return (
                        <div key={resource.id} className="bg-white rounded-md shadow-sm p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{resource.name}</span>
                            <span className={`text-xs font-medium ${getUtilizationTextColor(utilization)}`}>
                              {utilization.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mb-2">
                            <span className="capitalize">{resource.type}</span>
                            {resource.media_type && (
                              <>
                                <span className="mx-1">•</span>
                                <span>{resource.media_type}</span>
                              </>
                            )}
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getUtilizationColor(utilization)}`}
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {allocated.toFixed(0)} / {capacity} hours
                          </div>
                        </div>
                      );
                    })}
                    
                    {data.resources.length === 0 && (
                      <div className="col-span-2 text-sm text-gray-500 text-center py-2">
                        No resources in this team.
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
            
            {filteredUtilizationData.length === 0 && (
              <li className="px-4 py-5 text-center text-sm text-gray-500">
                No teams found.
              </li>
            )}
          </ul>
        </div>
      </div>
      
      {/* Team Utilization Insights */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Team Utilization Insights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Most Utilized Teams */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-md font-medium text-blue-800 mb-3">Most Utilized Teams</h4>
            <ul className="space-y-2">
              {teamUtilizationData
                .filter(data => data.resourceCount > 0)
                .sort((a, b) => b.utilization - a.utilization)
                .slice(0, 3)
                .map(data => (
                  <li key={data.team.id} className="flex justify-between items-center">
                    <span className="text-sm text-blue-700">{data.team.name}</span>
                    <span className={`text-sm font-medium ${getUtilizationTextColor(data.utilization)}`}>
                      {data.utilization.toFixed(1)}%
                    </span>
                  </li>
                ))}
              
              {teamUtilizationData.filter(data => data.resourceCount > 0).length === 0 && (
                <li className="text-sm text-blue-700">No team utilization data available.</li>
              )}
            </ul>
          </div>
          
          {/* Least Utilized Teams */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="text-md font-medium text-emerald-800 mb-3">Available Capacity</h4>
            <ul className="space-y-2">
              {teamUtilizationData
                .filter(data => data.resourceCount > 0)
                .sort((a, b) => a.utilization - b.utilization)
                .slice(0, 3)
                .map(data => (
                  <li key={data.team.id} className="flex justify-between items-center">
                    <span className="text-sm text-emerald-700">{data.team.name}</span>
                    <span className="text-sm text-emerald-700">
                      {(data.totalCapacity - data.totalAllocated).toFixed(0)} hrs available
                    </span>
                  </li>
                ))}
              
              {teamUtilizationData.filter(data => data.resourceCount > 0).length === 0 && (
                <li className="text-sm text-emerald-700">No team capacity data available.</li>
              )}
            </ul>
          </div>
        </div>
        
        {/* Utilization Distribution */}
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Team Utilization Distribution</h4>
          
          {teamUtilizationData.length > 0 ? (
            (() => {
              // First filter teams with resources and capacity
              const teamsWithCapacity = teamUtilizationData
                .filter(data => data.resourceCount > 0 && data.totalCapacity > 0)
                .sort((a, b) => b.utilization - a.utilization);
              
              // Only proceed if there are valid teams after filtering
              if (teamsWithCapacity.length === 0) {
                return (
                  <div className="text-center text-sm text-gray-500 p-4 border border-gray-200 rounded-md">
                    No teams with capacity and resources available.
                  </div>
                );
              }
              
              // Pre-calculate total capacity once to avoid recalculation in map
              const totalTeamCapacity = teamsWithCapacity.reduce((sum, team) => 
                sum + team.totalCapacity, 0);
              
              // Only proceed if total capacity is greater than zero
              if (totalTeamCapacity <= 0) {
                return (
                  <div className="text-center text-sm text-gray-500 p-4 border border-gray-200 rounded-md">
                    Total team capacity is zero.
                  </div>
                );
              }
              
              return (
                <div className="h-10 bg-gray-200 rounded-full overflow-hidden">
                  {teamsWithCapacity.map((data, index) => {
                    const widthPercentage = (data.totalCapacity / totalTeamCapacity) * 100;
                    
                    return (
                      <div 
                        key={data.team.id}
                        className={`h-full inline-block relative ${getUtilizationColor(data.utilization)}`}
                        style={{ width: `${widthPercentage}%` }}
                        title={`${data.team.name}: ${data.utilization.toFixed(1)}%`}
                      >
                        {widthPercentage > 10 && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                            {data.team.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()
          ) : (
            <div className="text-center text-sm text-gray-500 p-4 border border-gray-200 rounded-md">
              No team utilization data available.
            </div>
          )}
          
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-3">
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
        </div>
      </div>
    </div>
  );
};

export default TeamUtilization;