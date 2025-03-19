import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, Title, Text, BarChart, DonutChart } from '@tremor/react';
import { formatDate } from '../lib/utils';
import { Calendar as CalendarIcon, Users, FileText, Briefcase, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Brief, Resource } from '../types';
import { DashboardCharts } from '../components/DashboardCharts';

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
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 via-white to-purple-50 min-h-screen">
      {/* Enhanced KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card 
          className="p-6 transform transition-all hover:scale-105 cursor-pointer shadow-lg hover:shadow-xl"
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
          className="p-6 transform transition-all hover:scale-105 cursor-pointer shadow-lg hover:shadow-xl"
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
          className="p-6 transform transition-all hover:scale-105 cursor-pointer shadow-lg hover:shadow-xl"
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
          className="p-6 transform transition-all hover:scale-105 cursor-pointer shadow-lg hover:shadow-xl"
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
          className="p-6 transform transition-all hover:scale-105 cursor-pointer shadow-lg hover:shadow-xl"
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
          className="p-6 transform transition-all hover:scale-105 cursor-pointer shadow-lg hover:shadow-xl"
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

      {/* Calendar and Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar View */}
        <Card 
          className="transform transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl col-span-2"
          decoration="left"
          decorationColor="blue"
        >
          <div className="flex justify-between items-center mb-4">
            <Title className="text-lg font-bold">Upcoming Deliverables</Title>
            <div className="flex space-x-2">
              {/* Calendar filters */}
              <div className="flex items-center space-x-1">
                <input 
                  type="checkbox" 
                  id="show-campaigns" 
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  defaultChecked
                  onChange={(e) => {
                    // Safe access to FullCalendar API
                    const calendarEl = document.querySelector('.fc') as HTMLElement;
                    // @ts-ignore - FullCalendar API is not fully typed
                    const calendarApi = calendarEl?.getApi?.();
                    if (calendarApi) {
                      if (e.target.checked) {
                        calendarApi.getEvents()
                          .filter((event: any) => event.extendedProps.type === 'campaign')
                          .forEach((event: any) => event.setProp('display', 'block'));
                      } else {
                        calendarApi.getEvents()
                          .filter((event: any) => event.extendedProps.type === 'campaign')
                          .forEach((event: any) => event.setProp('display', 'none'));
                      }
                    }
                  }}
                />
                <label htmlFor="show-campaigns" className="text-sm text-gray-600">
                  Campaigns
                </label>
              </div>
              <div className="flex items-center space-x-1">
                <input 
                  type="checkbox" 
                  id="show-briefs" 
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  defaultChecked
                  onChange={(e) => {
                    // Safe access to FullCalendar API
                    const calendarEl = document.querySelector('.fc') as HTMLElement;
                    // @ts-ignore - FullCalendar API is not fully typed
                    const calendarApi = calendarEl?.getApi?.();
                    if (calendarApi) {
                      if (e.target.checked) {
                        calendarApi.getEvents()
                          .filter((event: any) => event.extendedProps.type === 'brief')
                          .forEach((event: any) => event.setProp('display', 'block'));
                      } else {
                        calendarApi.getEvents()
                          .filter((event: any) => event.extendedProps.type === 'brief')
                          .forEach((event: any) => event.setProp('display', 'none'));
                      }
                    }
                  }}
                />
                <label htmlFor="show-briefs" className="text-sm text-gray-600">
                  Briefs
                </label>
              </div>
            </div>
          </div>
          <div className="mt-4 h-[400px]">
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
                return (
                  <div className="p-1">
                    <div className="font-medium truncate">{eventInfo.event.title}</div>
                    <div className="text-xs opacity-75">
                      {type === 'brief' ? eventInfo.event.extendedProps.channel : eventInfo.event.extendedProps.brand}
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </Card>

        {/* Resource Capacity and Media Type Charts */}
        <DashboardCharts resources={resources} briefs={briefs} />
      </div>

      {/* Enhanced Upcoming Deadlines */}
      <Card 
        className="transform transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl"
        decoration="bottom"
        decorationColor="rose"
      >
        <Title className="text-lg font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-rose-600 to-pink-600">
          Upcoming Deadlines
        </Title>
        <div className="mt-4">
          {stats.upcomingDeadlines.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {stats.upcomingDeadlines.map((brief) => (
                <div key={brief.id} className="py-3">
                  <Link 
                    to={`/briefs/${brief.id}`} 
                    className="flex items-center justify-between hover:bg-gradient-to-r hover:from-rose-50 hover:to-transparent p-3 rounded-lg transition-all group"
                  >
                    <div>
                      <Text className="font-medium text-gray-900 group-hover:text-rose-600 transition-colors">
                        {brief.title}
                      </Text>
                      <Text className="text-gray-500">{brief.channel}</Text>
                    </div>
                    <div className="text-right">
                      <Text className="text-rose-600 font-medium">{formatDate(brief.due_date)}</Text>
                      <Text 
                        className="text-gray-500 px-2 py-1 rounded-full text-sm"
                        style={{ backgroundColor: `${getStatusColor(brief.status)}20` }}
                      >
                        {brief.status.replace('_', ' ')}
                      </Text>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <Text className="text-gray-500 text-center py-8">No upcoming deadlines</Text>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;

