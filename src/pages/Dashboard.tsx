import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, Title, Text, BarChart, DonutChart } from '@tremor/react';
import { formatDate } from '../lib/utils';
import { Calendar as CalendarIcon, Users, FileText, Briefcase, AlertCircle, Clock, TrendingUp, Settings } from 'lucide-react';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Brief, Resource } from '../types';
import { DashboardCharts } from '../components/DashboardCharts';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@tremor/react';

interface Campaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  brand?: { name: string };
}

interface DashboardStats {
  totalBriefs: number;
  briefsByStatus: { [key: string]: number };
  resourceCapacity: Array<{
    name: string;
    assigned: number;
    capacity: number;
    utilization: number;
  }>;
  upcomingDeadlines: Array<Brief>;
  briefsByMediaType: Array<{
    mediaType: string;
    count: number;
  }>;
  pendingApprovals: number;
  campaigns: Array<Campaign>;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalBriefs: 0,
    briefsByStatus: {},
    resourceCapacity: [],
    upcomingDeadlines: [],
    briefsByMediaType: [],
    pendingApprovals: 0,
    campaigns: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'draft': '#818cf8', // indigo-400
      'pending_approval': '#fbbf24', // amber-400
      'in_progress': '#34d399', // emerald-400
      'completed': '#8b5cf6', // violet-500
      'on_hold': '#f87171', // red-400
    };
    return colors[status] || '#6b7280'; // gray-500 default
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch resources with capacity information
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('*')
          .order('name');

        if (resourcesError) throw resourcesError;

        // Fetch briefs with resource assignments
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select('*')
          .order('due_date');

        if (briefsError) throw briefsError;

        // Fetch campaigns
        const { data: campaigns, error: campaignsError } = await supabase
          .from('campaigns')
          .select(`
            id,
            name,
            start_date,
            end_date,
            status,
            brand:brands(name)
          `) as { data: Campaign[] | null; error: any };

        if (campaignsError) throw campaignsError;

        // Calculate statistics
        const statusCounts: { [key: string]: number } = {};
        const mediaTypeCounts: { [key: string]: number } = {};
        let pendingCount = 0;
        
        briefsData?.forEach(brief => {
          // Count by status
          statusCounts[brief.status] = (statusCounts[brief.status] || 0) + 1;
          if (brief.status === 'pending_approval') {
            pendingCount++;
          }
          
          // Count by media type (channel)
          const mediaType = brief.channel || 'Unspecified';
          mediaTypeCounts[mediaType] = (mediaTypeCounts[mediaType] || 0) + 1;
        });

        // Calculate resource capacity
        const resourceCapacity = (resourcesData || []).map(resource => {
          const assignedBriefs = briefsData?.filter(b => b.resource_id === resource.id && b.status !== 'cancelled') || [];
          const maxCapacity = resource.max_capacity || 5; // Default capacity if not set
          return {
            name: resource.name,
            assigned: assignedBriefs.length,
            capacity: maxCapacity,
            utilization: (assignedBriefs.length / maxCapacity) * 100
          };
        }).sort((a, b) => b.utilization - a.utilization); // Sort by utilization

        // Get upcoming deadlines (next 30 days for better calendar view)
        const now = new Date();
        const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const upcomingDeadlines = briefsData?.filter(brief => {
          const dueDate = new Date(brief.due_date);
          return dueDate >= now && dueDate <= nextMonth;
        }) || [];

        // Format media type data for chart with better grouping
        const briefsByMediaType = Object.entries(mediaTypeCounts)
          .map(([mediaType, count]) => ({
            mediaType: mediaType === 'Unspecified' ? 'Other' : mediaType,
            count
          }))
          .sort((a, b) => b.count - a.count); // Sort by count descending

        setStats({
          ...stats,
          totalBriefs: briefsData?.length || 0,
          briefsByStatus: statusCounts,
          resourceCapacity: resourceCapacity,
          upcomingDeadlines,
          briefsByMediaType,
          pendingApprovals: pendingCount,
          campaigns: campaigns || []
        });

        setResources(resourcesData);
        setBriefs(briefsData);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  const currentWeek = `${format(startOfWeek(new Date()), 'MMM d')} - ${format(endOfWeek(new Date()), 'MMM d, yyyy')}`;

  // Calculate additional metrics for new KPI cards
  const activeCampaignsCount = stats.campaigns.filter(campaign => campaign.status === 'active').length;
  
  // Calculate on-track vs late briefs
  const today = new Date();
  const onTrackBriefs = briefs.filter(brief => {
    const dueDate = new Date(brief.due_date);
    return dueDate >= today && ['approved', 'in_progress'].includes(brief.status);
  }).length;
  
  const lateBriefs = briefs.filter(brief => {
    const dueDate = new Date(brief.due_date);
    return dueDate < today && !['complete', 'cancelled'].includes(brief.status);
  }).length;
  
  const onTrackRatio = onTrackBriefs + lateBriefs > 0 
    ? Math.round((onTrackBriefs / (onTrackBriefs + lateBriefs)) * 100) 
    : 100;

  // Calculate overall resource utilization
  const totalResourceCapacity = resources.reduce((total, resource) => {
    return total + (resource.capacity_hours || 40);
  }, 0);
  
  const totalResourceUtilization = resources.reduce((total, resource) => {
    const assignedBriefs = briefs.filter(b => b.resource_id === resource.id && b.status !== 'cancelled');
    const assignedHours = assignedBriefs.reduce((sum, brief) => sum + (brief.estimated_hours || 0), 0);
    return total + assignedHours;
  }, 0);
  
  const utilizationPercent = totalResourceCapacity > 0 
    ? Math.round((totalResourceUtilization / totalResourceCapacity) * 100)
    : 0;

  // Improved calendar events for better visual appearance
  const calendarEvents = [
    // Brief events
    ...stats.upcomingDeadlines.map(brief => ({
      id: `brief-${brief.id}`,
      title: `📝 ${brief.title}`,
      start: new Date(brief.due_date).toISOString(),
      allDay: true,
      backgroundColor: getStatusColor(brief.status),
      borderColor: getStatusColor(brief.status),
      url: `/briefs/${brief.id}`,
      extendedProps: {
        type: 'brief',
        status: brief.status,
        channel: brief.channel
      }
    })),
    // Campaign events - limited to show only 30 days from start to improve appearance
    ...stats.campaigns.map(campaign => {
      const startDate = new Date(campaign.start_date);
      const endDate = campaign.end_date ? new Date(campaign.end_date) : new Date(startDate);
      
      // Limit campaigns to display only 30 days at most in the calendar view
      const displayEndDate = new Date(startDate);
      displayEndDate.setDate(displayEndDate.getDate() + 30);
      
      // Use the earlier of the actual end date or the 30-day limit
      const effectiveEndDate = endDate < displayEndDate ? endDate : displayEndDate;
      
      return {
        id: `campaign-${campaign.id}`,
        title: `🎯 ${campaign.name}`,
        start: startDate.toISOString(),
        end: effectiveEndDate.toISOString(),
        allDay: true,
        backgroundColor: '#3b82f660', // blue-500 with less opacity
        borderColor: '#3b82f6',
        url: `/campaigns/${campaign.id}`,
        extendedProps: {
          type: 'campaign',
          status: campaign.status,
          brand: campaign.brand?.name
        }
      };
    })
  ];

  console.log('Calendar Events:', calendarEvents); // Debug log

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
      {/* Page Header with Time Period */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500">Week of {currentWeek}</p>
        </div>
        <div className="mt-4 md:mt-0">
          {/* This could be expanded with time period selectors or view options */}
          <span className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
              Current Week
            </button>
          </span>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/briefs/create"
          className="flex items-center justify-center sm:justify-start space-x-3 p-3 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
            <FileText className="h-5 w-5" />
          </div>
          <div className="text-sm font-medium text-gray-900">Create Brief</div>
        </Link>
        
        <Link
          to="/campaigns/new"
          className="flex items-center justify-center sm:justify-start space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="text-sm font-medium text-gray-900">New Campaign</div>
        </Link>
        
        <Link
          to="/resources"
          className="flex items-center justify-center sm:justify-start space-x-3 p-3 rounded-lg hover:bg-violet-50 transition-colors"
        >
          <div className="p-2 rounded-lg bg-violet-100 text-violet-600">
            <Users className="h-5 w-5" />
          </div>
          <div className="text-sm font-medium text-gray-900">Manage Resources</div>
        </Link>
        
        <Link
          to="/settings"
          className="flex items-center justify-center sm:justify-start space-x-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors"
        >
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
            <Settings className="h-5 w-5" />
          </div>
          <div className="text-sm font-medium text-gray-900">Settings</div>
        </Link>
      </div>

      {/* Enhanced KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card 
          className="p-6 transform transition-all hover:scale-105 cursor-pointer shadow-md hover:shadow-xl"
          decoration="top"
          decorationColor="indigo"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg shadow-md">
              <FileText className="h-8 w-8 text-white animate-pulse" />
            </div>
            <div>
              <Text className="text-sm text-gray-500">Total Briefs</Text>
              <Title className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
                {stats.totalBriefs}
              </Title>
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 transform transition-all hover:scale-105 cursor-pointer shadow-md hover:shadow-xl"
          decoration="top"
          decorationColor="amber"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg shadow-md">
              <Clock className="h-8 w-8 text-white animate-pulse" />
            </div>
            <div>
              <Text className="text-sm text-gray-500">Pending Approval</Text>
              <Title className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-yellow-600">
                {stats.pendingApprovals}
              </Title>
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 transform transition-all hover:scale-105 cursor-pointer shadow-md hover:shadow-xl"
          decoration="top"
          decorationColor="blue"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
              <Briefcase className="h-8 w-8 text-white animate-pulse" />
            </div>
            <div>
              <Text className="text-sm text-gray-500">Active Campaigns</Text>
              <Title className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                {activeCampaignsCount}
              </Title>
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 transform transition-all hover:scale-105 cursor-pointer shadow-md hover:shadow-xl"
          decoration="top"
          decorationColor="emerald"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-md">
              <TrendingUp className="h-8 w-8 text-white animate-pulse" />
            </div>
            <div>
              <Text className="text-sm text-gray-500">On-Track Briefs</Text>
              <Title className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-600">
                {onTrackRatio}%
              </Title>
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 transform transition-all hover:scale-105 cursor-pointer shadow-md hover:shadow-xl"
          decoration="top"
          decorationColor="rose"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg shadow-md">
              <AlertCircle className="h-8 w-8 text-white animate-pulse" />
            </div>
            <div>
              <Text className="text-sm text-gray-500">Upcoming Deadlines</Text>
              <Title className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-pink-600">
                {stats.upcomingDeadlines.length}
              </Title>
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 transform transition-all hover:scale-105 cursor-pointer shadow-md hover:shadow-xl"
          decoration="top"
          decorationColor="violet"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg shadow-md">
              <Users className="h-8 w-8 text-white animate-pulse" />
            </div>
            <div>
              <Text className="text-sm text-gray-500">Resource Utilization</Text>
              <Title className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600">
                {utilizationPercent}%
              </Title>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Section with 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rest of the content will be updated in next steps */}
        
        {/* Enhanced Calendar View */}
        <Card 
          className="transform transition-all hover:scale-[1.01] shadow-md hover:shadow-xl lg:col-span-3"
          decoration="top"
          decorationColor="blue"
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <Title className="text-lg font-bold text-gray-900">Content Calendar</Title>
              <Text className="text-sm text-gray-500">Upcoming campaigns and brief deadlines</Text>
            </div>
            <div className="flex space-x-2">
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-blue-400"></span>
                <span className="text-xs text-gray-600">Campaigns</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                <span className="text-xs text-gray-600">Briefs</span>
              </div>
              <div className="ml-2 border-l pl-2 flex items-center space-x-3">
                <button
                  className="p-1 rounded hover:bg-gray-100"
                  title="Show/Hide Campaigns"
                  onClick={() => {
                    const calendarEl = document.querySelector('.fc') as HTMLElement;
                    // @ts-ignore - FullCalendar API is not fully typed
                    const calendarApi = calendarEl?.getApi?.();
                    if (calendarApi) {
                      // Toggle campaign visibility
                      const campaignEvents = calendarApi.getEvents()
                        .filter((event: any) => event.extendedProps.type === 'campaign');
                      
                      // Check if campaigns are currently visible
                      const isVisible = campaignEvents.length > 0 && 
                                      campaignEvents[0].display !== 'none';
                      
                      campaignEvents.forEach((event: any) => 
                        event.setProp('display', isVisible ? 'none' : 'block')
                      );
                    }
                  }}
                >
                  <Briefcase className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  className="p-1 rounded hover:bg-gray-100"
                  title="Show/Hide Briefs"
                  onClick={() => {
                    const calendarEl = document.querySelector('.fc') as HTMLElement;
                    // @ts-ignore - FullCalendar API is not fully typed
                    const calendarApi = calendarEl?.getApi?.();
                    if (calendarApi) {
                      // Toggle brief visibility
                      const briefEvents = calendarApi.getEvents()
                        .filter((event: any) => event.extendedProps.type === 'brief');
                      
                      // Check if briefs are currently visible
                      const isVisible = briefEvents.length > 0 && 
                                      briefEvents[0].display !== 'none';
                      
                      briefEvents.forEach((event: any) => 
                        event.setProp('display', isVisible ? 'none' : 'block')
                      );
                    }
                  }}
                >
                  <FileText className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4 bg-white rounded-lg border border-gray-100 p-1 h-[450px]">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={calendarEvents}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek'
              }}
              height="100%"
              eventClick={(info) => {
                info.jsEvent.preventDefault();
                if (info.event.url) {
                  window.location.href = info.event.url;
                }
              }}
              dayMaxEvents={3}
              eventDisplay="block"
              eventTimeFormat={{
                hour: 'numeric',
                minute: '2-digit',
                meridiem: 'short'
              }}
              eventContent={(eventInfo) => {
                const type = eventInfo.event.extendedProps.type;
                const status = eventInfo.event.extendedProps.status;
                return (
                  <div className="p-1">
                    <div className="font-medium truncate flex items-center">
                      {type === 'brief' ? '📝' : '🎯'} 
                      <span className="ml-1">{eventInfo.event.title.replace(/^(📝|🎯) /, '')}</span>
                    </div>
                    <div className="text-xs opacity-75 flex items-center justify-between">
                      <span>
                        {type === 'brief' ? eventInfo.event.extendedProps.channel : eventInfo.event.extendedProps.brand}
                      </span>
                      {type === 'brief' && status && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100">
                          {status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }}
              dayCellClassNames="hover:bg-blue-50"
              eventClassNames={(info) => {
                return info.event.extendedProps.type === 'brief' ? 'brief-event' : 'campaign-event';
              }}
            />
          </div>
        </Card>

        {/* Performance Analytics */}
        <div className="lg:col-span-3">
          <DashboardCharts resources={resources} briefs={briefs} />
        </div>

        {/* Upcoming Deadlines - Enhanced with Card Structure */}
        <Card 
          className="transform transition-all hover:scale-[1.01] shadow-md hover:shadow-xl lg:col-span-2"
          decoration="left"
          decorationColor="rose"
        >
          <div className="flex items-center justify-between mb-4">
            <Title className="text-lg font-bold text-gray-900">Upcoming Deadlines</Title>
            <Link to="/briefs" className="text-sm text-rose-600 hover:text-rose-800 font-medium">
              View All Briefs
            </Link>
          </div>
          <div className="mt-2">
            {stats.upcomingDeadlines.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {stats.upcomingDeadlines.slice(0, 5).map((brief) => (
                  <div key={brief.id} className="py-2.5">
                    <Link 
                      to={`/briefs/${brief.id}`} 
                      className="flex items-center justify-between hover:bg-rose-50 p-2.5 rounded-lg transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <Text className="font-medium text-gray-900 group-hover:text-rose-600 transition-colors truncate">
                          {brief.title}
                        </Text>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                                style={{ backgroundColor: `${getStatusColor(brief.status)}30`, color: getStatusColor(brief.status) }}>
                            {brief.status.replace('_', ' ')}
                          </span>
                          <Text className="text-sm text-gray-500 truncate">{brief.channel || 'No channel'}</Text>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <Text className="text-rose-600 font-medium">{formatDate(brief.due_date)}</Text>
                        <Text className="text-xs text-gray-500 mt-1">
                          {
                            (() => {
                              const dueDate = new Date(brief.due_date);
                              const today = new Date();
                              const diffTime = dueDate.getTime() - today.getTime();
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              
                              if (diffDays < 0) return 'Overdue';
                              if (diffDays === 0) return 'Due today';
                              if (diffDays === 1) return 'Due tomorrow';
                              return `Due in ${diffDays} days`;
                            })()
                          }
                        </Text>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Text className="text-gray-500">No upcoming deadlines</Text>
              </div>
            )}
          </div>
        </Card>

        {/* Team Workload - New Widget */}
        <Card 
          className="transform transition-all hover:scale-[1.01] shadow-md hover:shadow-xl"
          decoration="left"
          decorationColor="violet"
        >
          <div className="flex items-center justify-between mb-4">
            <Title className="text-lg font-bold text-gray-900">Team Workload</Title>
            <Link to="/resources" className="text-sm text-violet-600 hover:text-violet-800 font-medium">
              Manage Resources
            </Link>
          </div>

          <div className="space-y-4 mt-2">
            {resources.slice(0, 4).map(resource => {
              const assignedBriefs = briefs.filter(b => b.resource_id === resource.id && b.status !== 'cancelled');
              const capacity = resource.capacity_hours || 40;
              const assigned = assignedBriefs.reduce((total, brief) => total + (brief.estimated_hours || 0), 0);
              const utilization = Math.min(100, Math.round((assigned / capacity) * 100));
              const utilizationColor = 
                utilization > 90 ? 'bg-rose-500' : 
                utilization > 75 ? 'bg-amber-500' : 
                'bg-emerald-500';
              
              return (
                <div key={resource.id} className="p-2.5 hover:bg-violet-50 rounded-lg transition-all">
                  <div className="flex items-center justify-between">
                    <Text className="font-medium">{resource.name}</Text>
                    <Text className={`${
                      utilization > 90 ? 'text-rose-600' : 
                      utilization > 75 ? 'text-amber-600' : 
                      'text-emerald-600'
                    } font-medium`}>{utilization}%</Text>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                    <div 
                      className={`h-2 rounded-full ${utilizationColor}`}
                      style={{ width: `${utilization}%` }}
                    ></div>
                  </div>
                  <Text className="text-xs text-gray-500 mt-1">
                    {assigned}h of {capacity}h capacity
                  </Text>
                </div>
              );
            })}
            
            {resources.length > 0 ? (
              <div className="text-center pt-2">
                <Link
                  to="/resources"
                  className="text-sm text-violet-600 hover:text-violet-800 font-medium"
                >
                  View all resources
                </Link>
              </div>
            ) : (
              <Text className="text-gray-500 text-center py-3">No resources found</Text>
            )}
          </div>
        </Card>
        
        {/* Activity Feed and Personalized Tasks */}
        <Card
          className="transform transition-all hover:scale-[1.01] shadow-md hover:shadow-xl lg:col-span-3"
          decoration="bottom"
          decorationColor="indigo"
        >
          <TabGroup>
            <div className="flex items-center justify-between mb-4">
              <Title className="text-lg font-bold text-gray-900">My Dashboard</Title>
              <TabList variant="solid" className="mt-0">
                <Tab>Tasks</Tab>
                <Tab>Activity</Tab>
              </TabList>
            </div>
            
            <TabPanels>
              <TabPanel>
                {/* Assigned Tasks */}
                <div className="space-y-4 mt-2">
                  {/* For this demo, we use the available briefs where the current user is assigned */}
                  {/* In a real application, you would have a tasks table associated with users */}
                  {
                    briefs
                      .filter(brief => brief.status !== 'complete' && brief.status !== 'cancelled')
                      .slice(0, 5)
                      .map(brief => {
                        const dueDate = new Date(brief.due_date);
                        const today = new Date();
                        const isOverdue = dueDate < today;
                        
                        return (
                          <div key={brief.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <Link to={`/briefs/${brief.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                                  {brief.title}
                                </Link>
                                <div className="flex items-center mt-1 text-sm text-gray-500 space-x-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {brief.status.replace('_', ' ')}
                                  </span>
                                  <span>•</span>
                                  <span>{brief.channel || 'No channel'}</span>
                                </div>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {isOverdue ? 'Overdue' : formatDate(brief.due_date)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-2 flex justify-end space-x-2">
                              <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                View Details
                              </button>
                              {brief.status === 'pending_approval' && (
                                <button className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                  Approve
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                  }
                  
                  {briefs.filter(brief => brief.status !== 'complete' && brief.status !== 'cancelled').length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No pending tasks assigned to you</p>
                      <Link to="/briefs/create" className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Create a New Brief
                      </Link>
                    </div>
                  )}
                </div>
              </TabPanel>
              
              <TabPanel>
                {/* Activity Feed */}
                <div className="flow-root mt-2">
                  <ul className="-mb-8">
                    {briefs.slice(0, 5).map((brief, briefIdx) => (
                      <li key={brief.id}>
                        <div className="relative pb-8">
                          {briefIdx !== briefs.slice(0, 5).length - 1 ? (
                            <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                          ) : null}
                          <div className="relative flex items-start space-x-3">
                            <div>
                              <div className="relative px-1">
                                <div className="h-8 w-8 bg-indigo-100 rounded-full ring-8 ring-white flex items-center justify-center">
                                  <FileText className="h-4 w-4 text-indigo-500" />
                                </div>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div>
                                <div className="text-sm">
                                  <Link to={`/briefs/${brief.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                                    {brief.title}
                                  </Link>
                                </div>
                                <p className="mt-0.5 text-sm text-gray-500">
                                  Status changed to <span className="font-medium">{brief.status.replace('_', ' ')}</span>
                                </p>
                              </div>
                              <div className="mt-2 text-sm text-gray-500">
                                <p>{brief.channel || 'No channel'} • Due {formatDate(brief.due_date)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

