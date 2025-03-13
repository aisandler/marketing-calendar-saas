import React from 'react';
import { Card, Title, BarChart, DonutChart } from '@tremor/react';
import { Brief, Resource } from '../types';

interface DashboardChartsProps {
  resources: Resource[];
  briefs: Brief[];
}

export const DashboardCharts = ({ resources, briefs }: DashboardChartsProps) => {
  // Calculate resource capacity data
  const resourceCapacityData = resources.map(resource => {
    const assignedBriefs = briefs.filter(b => b.resource_id === resource.id && b.status !== 'cancelled');
    const capacity = resource.capacity_hours || 40;
    const assigned = assignedBriefs.reduce((total, brief) => total + (brief.estimated_hours || 0), 0);
    
    return {
      name: resource.name,
      "Assigned Hours": assigned,
      "Total Capacity": capacity,
    };
  });

  // Calculate briefs by media type
  const briefsByMediaType = briefs.reduce((acc, brief) => {
    const resource = resources.find(r => r.id === brief.resource_id);
    const mediaType = resource?.media_type || 'Unspecified';
    acc[mediaType] = (acc[mediaType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mediaTypeData = Object.entries(briefsByMediaType).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <>
      {/* Resource Capacity Chart */}
      <Card 
        className="transform transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl"
        decoration="left"
        decorationColor="blue"
      >
        <Title className="text-lg font-bold mb-4">Resource Capacity</Title>
        <BarChart
          className="mt-4 h-72"
          data={resourceCapacityData}
          index="name"
          categories={["Assigned Hours", "Total Capacity"]}
          colors={["indigo", "emerald"]}
          valueFormatter={(value) => `${value}h`}
          yAxisWidth={48}
          showLegend={true}
          showGridLines={true}
        />
      </Card>

      {/* Briefs by Media Type Chart */}
      <Card 
        className="transform transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl"
        decoration="left"
        decorationColor="purple"
      >
        <Title className="text-lg font-bold mb-4">Briefs by Media Type</Title>
        <DonutChart
          className="mt-4 h-72"
          data={mediaTypeData}
          category="value"
          index="name"
          valueFormatter={(value) => `${value} briefs`}
          colors={["indigo", "emerald", "amber", "violet", "fuchsia"]}
          showLabel={true}
          showTooltip={true}
        />
      </Card>
    </>
  );
}; 