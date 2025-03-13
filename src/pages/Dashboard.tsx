import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, Title, Text, BarChart, DonutChart } from '@tremor/react';
import { formatDate } from '../lib/utils';
import { Calendar as CalendarIcon, Users, FileText, Briefcase, AlertCircle, Clock } from 'lucide-react';
import { startOfWeek, endOfWeek, format } from 'date-fns';

interface DashboardStats {
  totalBriefs: number;
  briefsByStatus: { [key: string]: number };
  resourceCapacity: Array<{
    name: string;
    assigned: number;
    capacity: number;
  }>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    due_date: string;
    status: string;
    brand?: { name: string };
  }>;
  briefsByBrand: Array<{
    brand: string;
    count: number;
  }>;
  pendingApprovals: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalBriefs: 0,
    briefsByStatus: {},
    resourceCapacity: [],
    upcomingDeadlines: [],
    briefsByBrand: [],
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch briefs with related data
        const { data: briefs, error: briefsError } = await supabase
          .from('briefs')
          .select(`
            *,
            brand:brands(name),
            resource:resources(name)
          `)
          .order('due_date', { ascending: true });

        if (briefsError) throw briefsError;

        // Fetch resources with their capacities
        const { data: resources, error: resourcesError } = await supabase
          .from('resources')
          .select('*');

        if (resourcesError) throw resourcesError;

        // Calculate statistics
        const statusCounts: { [key: string]: number } = {};
        const brandCounts: { [key: string]: number } = {};
        let pendingCount = 0;
        
        briefs?.forEach(brief => {
          // Count by status
          statusCounts[brief.status] = (statusCounts[brief.status] || 0) + 1;
          if (brief.status === 'pending_approval') {
            pendingCount++;
          }
          
          // Count by brand
          const brandName = brief.brand?.name || 'Unassigned';
          brandCounts[brandName] = (brandCounts[brandName] || 0) + 1;
        });

        // Calculate resource capacity
        const resourceCapacity = resources?.map(resource => {
          const assignedBriefs = briefs?.filter(b => b.resource_id === resource.id) || [];
          return {
            name: resource.name,
            assigned: assignedBriefs.length,
            capacity: resource.max_capacity || 5 // Default capacity if not set
          };
        });

        // Get upcoming deadlines (next 7 days)
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcomingDeadlines = briefs?.filter(brief => {
          const dueDate = new Date(brief.due_date);
          return dueDate >= now && dueDate <= nextWeek;
        }) || [];

        // Format brand data for chart
        const briefsByBrand = Object.entries(brandCounts).map(([brand, count]) => ({
          brand,
          count
        }));

        setStats({
          totalBriefs: briefs?.length || 0,
          briefsByStatus: statusCounts,
          resourceCapacity,
          upcomingDeadlines,
          briefsByBrand,
          pendingApprovals: pendingCount
        });

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

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card 
          className="p-6 transform transition-all hover:scale-105 cursor-pointer"
          decoration="top"
          decorationColor="indigo"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <Text className="text-sm text-gray-500">Total Briefs</Text>
              <Title className="text-2xl font-bold text-indigo-600">{stats.totalBriefs}</Title>
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 transform transition-all hover:scale-105 cursor-pointer"
          decoration="top"
          decorationColor="amber"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <div>
              <Text className="text-sm text-gray-500">Pending Approval</Text>
              <Title className="text-2xl font-bold text-amber-600">{stats.pendingApprovals}</Title>
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 transform transition-all hover:scale-105 cursor-pointer"
          decoration="top"
          decorationColor="emerald"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
              <CalendarIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <Text className="text-sm text-gray-500">Current Week</Text>
              <Title className="text-lg font-bold text-emerald-600">{currentWeek}</Title>
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 transform transition-all hover:scale-105 cursor-pointer"
          decoration="top"
          decorationColor="rose"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <Text className="text-sm text-gray-500">Upcoming Deadlines</Text>
              <Title className="text-2xl font-bold text-rose-600">{stats.upcomingDeadlines.length}</Title>
            </div>
          </div>
        </Card>

        <Card 
          className="p-6 transform transition-all hover:scale-105 cursor-pointer"
          decoration="top"
          decorationColor="violet"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <Text className="text-sm text-gray-500">Active Resources</Text>
              <Title className="text-2xl font-bold text-violet-600">{stats.resourceCapacity.length}</Title>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Capacity Chart */}
        <Card 
          className="transform transition-all hover:scale-[1.02]"
          decoration="left"
          decorationColor="blue"
        >
          <Title className="text-lg font-bold mb-4">Resource Capacity</Title>
          <BarChart
            className="mt-4 h-72"
            data={stats.resourceCapacity}
            index="name"
            categories={["assigned", "capacity"]}
            colors={["blue", "indigo"]}
            valueFormatter={(value: number) => `${value} briefs`}
            showLegend={true}
            showGridLines={false}
            startEndOnly={true}
          />
        </Card>

        {/* Briefs by Brand */}
        <Card 
          className="transform transition-all hover:scale-[1.02]"
          decoration="left"
          decorationColor="purple"
        >
          <Title className="text-lg font-bold mb-4">Briefs by Brand</Title>
          <DonutChart
            className="mt-4 h-72"
            data={stats.briefsByBrand}
            category="count"
            index="brand"
            colors={["indigo", "violet", "purple", "fuchsia", "pink"]}
            valueFormatter={(value: number) => `${value} briefs`}
            showLabel={true}
          />
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      <Card 
        className="transform transition-all hover:scale-[1.02]"
        decoration="bottom"
        decorationColor="rose"
      >
        <Title className="text-lg font-bold mb-4">Upcoming Deadlines</Title>
        <div className="mt-4">
          {stats.upcomingDeadlines.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {stats.upcomingDeadlines.map((brief) => (
                <div key={brief.id} className="py-3">
                  <Link 
                    to={`/briefs/${brief.id}`} 
                    className="flex items-center justify-between hover:bg-gradient-to-r hover:from-rose-50 hover:to-transparent p-3 rounded-lg transition-all"
                  >
                    <div>
                      <Text className="font-medium text-gray-900">{brief.title}</Text>
                      <Text className="text-gray-500">{brief.brand?.name}</Text>
                    </div>
                    <div className="text-right">
                      <Text className="text-rose-600 font-medium">{formatDate(brief.due_date)}</Text>
                      <Text className="text-gray-500">{brief.status.replace('_', ' ')}</Text>
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

