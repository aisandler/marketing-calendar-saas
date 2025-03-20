import React, { useState } from 'react';
import { Resource, Brief, Team } from '../../types';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

interface ResourceListProps {
  resources: Resource[];
  briefs: Brief[];
  teams: Team[];
  onResourceChange: () => void;
  canManageResources: boolean;
}

const ResourceList: React.FC<ResourceListProps> = ({
  resources,
  briefs,
  teams,
  onResourceChange,
  canManageResources
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterMediaType, setFilterMediaType] = useState<string>('all');
  
  // Filter resources based on search and filters
  const filteredResources = resources.filter(resource => {
    // Apply search filter
    const matchesSearch = searchTerm === '' || 
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resource.media_type && resource.media_type.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply type filter
    const matchesType = filterType === 'all' || resource.type === filterType;
    
    // Apply team filter
    const matchesTeam = filterTeam === 'all' || resource.team_id === filterTeam;
    
    // Apply media type filter
    const matchesMediaType = filterMediaType === 'all' || 
      (resource.media_type && resource.media_type === filterMediaType);
    
    return matchesSearch && matchesType && matchesTeam && matchesMediaType;
  });
  
  // Get unique media types for filter dropdown
  const mediaTypes = Array.from(new Set(resources.filter(r => r.media_type).map(r => r.media_type)));
  
  // Calculate resource utilization
  const getResourceUtilization = (resourceId: string) => {
    const resourceBriefs = briefs.filter(brief => brief.resource_id === resourceId);
    const allocatedHours = resourceBriefs.reduce((sum, brief) => sum + (brief.estimated_hours || 0), 0);
    return allocatedHours;
  };
  
  // Get utilization percentage
  const getUtilizationPercentage = (resource: Resource) => {
    const capacity = resource.capacity_hours || 0;
    if (capacity === 0) return 0;
    
    const allocated = getResourceUtilization(resource.id);
    return Math.round((allocated / capacity) * 100);
  };
  
  // Get team name
  const getTeamName = (teamId: string | null | undefined) => {
    if (!teamId) return '-';
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : '-';
  };
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-medium text-gray-900 mb-4 sm:mb-0">Resources</h2>
        
        {canManageResources && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Resource
          </button>
        )}
      </div>
      
      {/* Search and filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md text-sm"
          />
        </div>
        
        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">All Types</option>
            <option value="internal">Internal</option>
            <option value="agency">Agency</option>
            <option value="freelancer">Freelancer</option>
          </select>
        </div>
        
        <div>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">All Teams</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <select
            value={filterMediaType}
            onChange={(e) => setFilterMediaType(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">All Media Types</option>
            {mediaTypes.map(mediaType => (
              <option key={mediaType} value={mediaType}>{mediaType}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Resources list */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Media Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Capacity
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilization
              </th>
              {canManageResources && (
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredResources.map(resource => {
              const utilization = getResourceUtilization(resource.id);
              const utilizationPercentage = getUtilizationPercentage(resource);
              
              return (
                <tr key={resource.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 capitalize">{resource.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{getTeamName(resource.team_id)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{resource.media_type || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{resource.capacity_hours || 0} hrs/week</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            utilizationPercentage > 100 
                              ? 'bg-red-500' 
                              : utilizationPercentage > 85 
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-medium ${
                        utilizationPercentage > 100 
                          ? 'text-red-700' 
                          : utilizationPercentage > 85 
                            ? 'text-amber-700'
                            : 'text-green-700'
                      }`}>
                        {utilizationPercentage}% ({utilization}/{resource.capacity_hours || 0})
                      </span>
                    </div>
                  </td>
                  {canManageResources && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setCurrentResource(resource);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setCurrentResource(resource);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            {filteredResources.length === 0 && (
              <tr>
                <td colSpan={canManageResources ? 7 : 6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No resources found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Add Resource Form Modal - will be implemented in a separate update */}
      
      {/* Edit Resource Form Modal - will be implemented in a separate update */}
      
      {/* Delete Confirmation Modal - will be implemented in a separate update */}
    </div>
  );
};

export default ResourceList; 