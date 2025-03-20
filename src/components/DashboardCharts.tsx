import React from 'react';
import { Card, Title, BarChart, DonutChart, AreaChart, Text, Legend, TabGroup, TabList, Tab, TabPanels, TabPanel } from '@tremor/react';
import { Brief, Resource, Campaign, BriefStatus } from '../types';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';

interface DashboardChartsProps {
  resources: Resource[];
  briefs: Brief[];
  campaigns?: Campaign[];
}

// Define the resource type data interface
interface ResourceTypeData {
  name: string;
  "Completion Rate": number;
  "Total Briefs": number;
}

export const DashboardCharts = ({ resources, briefs, campaigns = [] }: DashboardChartsProps) => {
  // 1. Resource capacity utilization
  const resourceCapacityData = resources
    .map(resource => {
      const assignedBriefs = briefs.filter(b => b.resource_id === resource.id && b.status !== 'cancelled');
      const capacity = resource.capacity_hours || 40;
      const assigned = assignedBriefs.reduce((total, brief) => total + (brief.estimated_hours || 0), 0);
      
      return {
        name: resource.name,
        "Assigned Hours": assigned,
        "Available Hours": capacity - assigned,
        "Utilization": Math.min(100, Math.round((assigned / capacity) * 100)),
      };
    })
    .sort((a, b) => b.Utilization - a.Utilization)
    .slice(0, 8); // Show only top 8 resources for clarity

  // 2. Brief status distribution
  const statusCounts = briefs.reduce((acc, brief) => {
    acc[brief.status] = (acc[brief.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.replace('_', ' '),
    value: count
  }));

  // 3. Brief trend data (last 6 months)
  const now = new Date();
  const monthlyBriefData = [];
  
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthName = format(monthDate, 'MMM yyyy');
    
    const monthBriefs = briefs.filter(brief => {
      const createdDate = new Date(brief.created_at || '');
      return createdDate >= monthStart && createdDate <= monthEnd;
    });
    
    // Count by status
    const drafted = monthBriefs.filter(b => b.status === 'draft').length;
    const inProgress = monthBriefs.filter(b => ['approved', 'in_progress', 'review'].includes(b.status)).length;
    const completed = monthBriefs.filter(b => b.status === 'complete').length;
    
    monthlyBriefData.push({
      month: monthName,
      "Drafted": drafted,
      "In Progress": inProgress,
      "Completed": completed,
    });
  }

  // 4. Brief completion by resource type
  const resourceTypeData: ResourceTypeData[] = [];
  
  const briefsByResourceType = briefs.reduce((acc, brief) => {
    const resource = resources.find(r => r.id === brief.resource_id);
    if (resource) {
      acc[resource.type] = acc[resource.type] || { total: 0, completed: 0 };
      acc[resource.type].total += 1;
      if (brief.status === 'complete') {
        acc[resource.type].completed += 1;
      }
    }
    return acc;
  }, {} as Record<string, { total: number, completed: number }>);
  
  Object.entries(briefsByResourceType).forEach(([type, data]) => {
    resourceTypeData.push({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      "Completion Rate": Math.round((data.completed / data.total) * 100),
      "Total Briefs": data.total
    });
  });

  // 5. Media type distribution
  const mediaTypeCounts = briefs.reduce((acc, brief) => {
    const resource = resources.find(r => r.id === brief.resource_id);
    const mediaType = resource?.media_type || brief.channel || 'Unspecified';
    acc[mediaType] = (acc[mediaType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mediaTypeData = Object.entries(mediaTypeCounts)
    .map(([name, value]) => ({
      name: name === 'Unspecified' ? 'Other' : name,
      value
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6); // Show top 6 for clarity
  
  // Status color mapping for consistency
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'blue',
      'pending_approval': 'amber',
      'approved': 'cyan',
      'in_progress': 'emerald',
      'review': 'purple',
      'complete': 'indigo',
      'cancelled': 'rose',
    };
    return colors[status] || 'gray';
  };

  return (
    <>
      {/* Tabbed charts for maximum space utilization */}
      <Card className="col-span-2 shadow-lg hover:shadow-xl transition-shadow">
        <TabGroup>
          <div className="flex items-center justify-between">
            <Title className="text-lg font-bold">Performance Analytics</Title>
            <TabList variant="solid" className="mt-0">
              <Tab>Resource Allocation</Tab>
              <Tab>Brief Status</Tab>
              <Tab>Trends</Tab>
            </TabList>
          </div>
            
          <TabPanels>
            {/* Resource Allocation Tab */}
            <TabPanel>
              <div className="mt-4">
                <Legend
                  categories={["Assigned Hours", "Available Hours"]}
                  colors={["indigo", "emerald"]}
                  className="mb-2"
                />
                
                <Text className="text-sm text-gray-500 mb-4">
                  Resource utilization across teams showing assigned vs available capacity
                </Text>
                
                <BarChart
                  className="mt-4 h-72"
                  data={resourceCapacityData}
                  index="name"
                  categories={["Assigned Hours", "Available Hours"]}
                  colors={["indigo", "emerald"]}
                  valueFormatter={(value) => `${value}h`}
                  stack={true}
                  yAxisWidth={48}
                  showLegend={false}
                  showGridLines={true}
                />
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {resourceCapacityData.slice(0, 4).map((resource) => (
                    <Card key={resource.name} decoration="top" decorationColor={resource.Utilization > 85 ? "rose" : resource.Utilization > 60 ? "amber" : "emerald"}>
                      <Text className="text-sm font-medium truncate">{resource.name}</Text>
                      <Title className={`text-lg ${resource.Utilization > 85 ? "text-rose-600" : resource.Utilization > 60 ? "text-amber-600" : "text-emerald-600"}`}>
                        {resource.Utilization}% Utilized
                      </Title>
                    </Card>
                  ))}
                </div>
              </div>
            </TabPanel>
            
            {/* Brief Status Tab */}
            <TabPanel>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Text className="text-sm text-gray-500 mb-4">
                    Distribution of briefs by current status
                  </Text>
                  <DonutChart
                    className="mt-2 h-60"
                    data={statusData}
                    category="value"
                    index="name"
                    valueFormatter={(value) => `${value} briefs`}
                    colors={["blue", "amber", "cyan", "emerald", "purple", "indigo", "rose"]}
                    showAnimation={true}
                    showLabel={true}
                    showTooltip={true}
                    label="Total Briefs"
                  />
                </div>
                
                <div>
                  <Text className="text-sm text-gray-500 mb-4">
                    Brief distribution by media type
                  </Text>
                  <DonutChart
                    className="mt-2 h-60"
                    data={mediaTypeData}
                    category="value"
                    index="name"
                    valueFormatter={(value) => `${value} briefs`}
                    colors={["indigo", "emerald", "amber", "violet", "fuchsia", "cyan"]}
                    showAnimation={true}
                    showLabel={true}
                    label="By Media Type"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Card className="mt-2">
                    <Title className="text-base">Brief Completion by Resource Type</Title>
                    <BarChart
                      className="mt-4 h-40"
                      data={resourceTypeData}
                      index="name"
                      categories={["Completion Rate"]}
                      colors={["emerald"]}
                      valueFormatter={(value) => `${value}%`}
                      showLegend={false}
                    />
                  </Card>
                </div>
              </div>
            </TabPanel>
            
            {/* Trends Tab */}
            <TabPanel>
              <div className="mt-4">
                <Text className="text-sm text-gray-500 mb-4">
                  Brief creation and completion trends over the last 6 months
                </Text>
                <Legend
                  categories={["Drafted", "In Progress", "Completed"]}
                  colors={["blue", "amber", "emerald"]}
                  className="mb-2"
                />
                <AreaChart
                  className="h-72"
                  data={monthlyBriefData}
                  index="month"
                  categories={["Drafted", "In Progress", "Completed"]}
                  colors={["blue", "amber", "emerald"]}
                  valueFormatter={(value) => `${value} briefs`}
                  showLegend={false}
                  showGridLines={true}
                  showAnimation={true}
                />
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </Card>
    </>
  );
}; 