import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Resource, Brief, Team } from '../types';
import { 
  BarChart3, 
  Users, 
  Briefcase, 
  PieChart, 
  TrendingUp, 
  Settings, 
  Calendar,
  Layers
} from 'lucide-react';
import ResourceOverview from '../components/resources/ResourceOverview';
import ResourceList from '../components/resources/ResourceList';
import TeamUtilization from '../components/teams/TeamUtilization';
import TeamManagement from '../components/teams/TeamManagement';
import MediaTypeUtilization from '../components/MediaTypeUtilization';
import ResourceForecast from '../components/ResourceForecast';
import CapacityPlanning from '../components/resources/CapacityPlanning';
import { useAuth } from '../contexts/AuthContext';

const ResourceHub = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState<Resource[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'resources' | 'teams' | 'media-types' | 'capacity' | 'forecast'
  >('overview');
  
  // Resource statistics
  const [totalResources, setTotalResources] = useState(0);
  const [internalResources, setInternalResources] = useState(0);
  const [agencyResources, setAgencyResources] = useState(0);
  const [freelancerResources, setFreelancerResources] = useState(0);
  const [totalHoursCapacity, setTotalHoursCapacity] = useState(0);
  const [totalHoursAllocated, setTotalHoursAllocated] = useState(0);
  const [overallocatedResources, setOverallocatedResources] = useState(0);
  const [mediaTypeStats, setMediaTypeStats] = useState<{ [key: string]: { count: number, capacity: number, allocated: number } }>({});

  const canManageResources = user?.role === 'admin' || user?.role === 'manager';

  // Fetch data from the API
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch resources with all necessary fields
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select('id, name, type, capacity_hours, hourly_rate, media_type, team_id, created_at, updated_at')
        .order('name');
      
      if (resourcesError) throw resourcesError;
      
      // Fetch briefs for resource utilization
      const { data: briefsData, error: briefsError } = await supabase
        .from('briefs')
        .select('id, title, status, start_date, due_date, resource_id, estimated_hours, brand_id, campaign_id, description')
        .order('due_date');
      
      if (briefsError) throw briefsError;
      
      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      
      if (teamsError) throw teamsError;
      
      setResources(resourcesData);
      setBriefs(briefsData);
      setTeams(teamsData);
      
      // Calculate statistics
      calculateStatistics(resourcesData, briefsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load resource data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (resources: Resource[], briefs: Brief[]) => {
    // Calculate basic resource counts by type
    const total = resources.length;
    const internal = resources.filter(r => r.type === 'internal').length;
    const agency = resources.filter(r => r.type === 'agency').length;
    const freelancer = resources.filter(r => r.type === 'freelancer').length;
    
    // Calculate capacity and allocation
    let totalCapacity = 0;
    let totalAllocated = 0;
    let overallocated = 0;
    
    // Media type statistics
    const mediaTypes: { [key: string]: { count: number, capacity: number, allocated: number } } = {};
    
    // Calculate for each resource
    resources.forEach(resource => {
      const capacity = resource.capacity_hours || 0;
      totalCapacity += capacity;
      
      // Calculate allocation from briefs
      const resourceBriefs = briefs.filter(brief => brief.resource_id === resource.id);
      const allocated = resourceBriefs.reduce((sum, brief) => sum + (brief.estimated_hours || 0), 0);
      totalAllocated += allocated;
      
      // Check if overallocated
      if (allocated > capacity && capacity > 0) {
        overallocated++;
      }
      
      // Update media type statistics
      if (resource.media_type) {
        if (!mediaTypes[resource.media_type]) {
          mediaTypes[resource.media_type] = { count: 0, capacity: 0, allocated: 0 };
        }
        mediaTypes[resource.media_type].count++;
        mediaTypes[resource.media_type].capacity += capacity;
        mediaTypes[resource.media_type].allocated += allocated;
      }
    });
    
    // Update state with calculated statistics
    setTotalResources(total);
    setInternalResources(internal);
    setAgencyResources(agency);
    setFreelancerResources(freelancer);
    setTotalHoursCapacity(totalCapacity);
    setTotalHoursAllocated(totalAllocated);
    setOverallocatedResources(overallocated);
    setMediaTypeStats(mediaTypes);
  };

  // Handle resource changes (create, update, delete)
  const handleResourceChange = () => {
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'resources', label: 'Resources', icon: Users },
    { id: 'teams', label: 'Teams', icon: Briefcase },
    { id: 'media-types', label: 'Media Types', icon: Layers },
    { id: 'capacity', label: 'Capacity', icon: PieChart },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Resource Management</h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center pb-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              `}
            >
              <tab.icon className="mr-2 h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content based on active tab */}
      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-500">Loading resource data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <ResourceOverview
                totalResources={totalResources}
                internalResources={internalResources}
                agencyResources={agencyResources}
                freelancerResources={freelancerResources}
                totalHoursCapacity={totalHoursCapacity}
                totalHoursAllocated={totalHoursAllocated}
                overallocatedResources={overallocatedResources}
                mediaTypeStats={mediaTypeStats}
                resources={resources}
                briefs={briefs}
              />
            )}
            
            {activeTab === 'resources' && (
              <ResourceList
                resources={resources}
                briefs={briefs}
                teams={teams}
                onResourceChange={handleResourceChange}
                canManageResources={canManageResources}
              />
            )}
            
            {activeTab === 'teams' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TeamManagement teams={teams} resources={resources} onTeamChange={handleResourceChange} />
                <TeamUtilization teams={teams} resources={resources} briefs={briefs} />
              </div>
            )}
            
            {activeTab === 'media-types' && (
              <MediaTypeUtilization resources={resources} briefs={briefs} />
            )}
            
            {activeTab === 'capacity' && (
              <CapacityPlanning resources={resources} briefs={briefs} />
            )}
            
            {activeTab === 'forecast' && (
              <ResourceForecast resources={resources} briefs={briefs} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResourceHub; 