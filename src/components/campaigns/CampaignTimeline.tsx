import React from 'react';
import { Link } from 'react-router-dom';
import { format, isAfter, isBefore, isToday, differenceInDays, addDays } from 'date-fns';

// Define the Campaign interface
interface Campaign {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'complete' | 'cancelled';
  brand?: {
    id: string;
    name: string;
  };
}

interface CampaignTimelineProps {
  campaigns: Campaign[];
  startDate?: Date;
  endDate?: Date;
  onCampaignClick?: (campaignId: string) => void;
}

const CampaignTimeline: React.FC<CampaignTimelineProps> = ({
  campaigns,
  startDate: propStartDate,
  endDate: propEndDate,
  onCampaignClick,
}) => {
  // Calculate the timeline range based on all campaigns
  const allCampaignDates = campaigns.flatMap(campaign => [
    new Date(campaign.start_date),
    new Date(campaign.end_date),
  ]);
  
  const earliest = propStartDate || (allCampaignDates.length > 0 
    ? new Date(Math.min(...allCampaignDates.map(d => d.getTime())))
    : new Date());
  
  const latest = propEndDate || (allCampaignDates.length > 0
    ? new Date(Math.max(...allCampaignDates.map(d => d.getTime())))
    : addDays(new Date(), 90));
  
  // Adjust dates to ensure at least 30 days are shown
  const minDaySpan = 30;
  const daySpan = differenceInDays(latest, earliest);
  const endDate = daySpan < minDaySpan ? addDays(earliest, minDaySpan) : latest;
  
  // Generate array of dates for the timeline
  const totalDays = differenceInDays(endDate, earliest);
  const today = new Date();
  
  // Calculate the status color
  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-200 border-gray-300';
      case 'active':
        return 'bg-green-100 border-green-200';
      case 'complete':
        return 'bg-blue-100 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 border-red-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };
  
  // Generate dates for month labels
  const months: { date: Date; width: number }[] = [];
  let currentDate = new Date(earliest);
  currentDate.setDate(1); // Start at the 1st of the month
  
  while (currentDate <= endDate) {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // Ensure the next month doesn't go past the end date
    const monthEndDate = isBefore(nextMonth, endDate) ? nextMonth : new Date(endDate);
    
    // Calculate the width percentage for this month
    const monthDays = differenceInDays(monthEndDate, currentDate);
    const widthPercentage = (monthDays / totalDays) * 100;
    
    months.push({
      date: new Date(currentDate),
      width: widthPercentage,
    });
    
    currentDate = nextMonth;
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Month labels */}
      <div className="flex border-b border-gray-200">
        {months.map((month, index) => (
          <div 
            key={index}
            className="text-xs font-medium text-gray-500 py-2 text-center"
            style={{ width: `${month.width}%` }}
          >
            {format(month.date, 'MMMM yyyy')}
          </div>
        ))}
      </div>
      
      {/* Timeline grid */}
      <div className="relative">
        {/* Today marker */}
        {isAfter(today, earliest) && isBefore(today, endDate) && (
          <div 
            className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
            style={{ 
              left: `${(differenceInDays(today, earliest) / totalDays) * 100}%`,
            }}
          >
            <div className="absolute top-0 -ml-[19px] px-1 py-0.5 rounded bg-red-500 text-white text-xs">
              Today
            </div>
          </div>
        )}
        
        {/* Campaign bars */}
        <div className="p-4 space-y-3">
          {campaigns.map(campaign => {
            const campaignStart = new Date(campaign.start_date);
            const campaignEnd = new Date(campaign.end_date);
            
            // Skip campaigns that are completely outside our range
            if (isAfter(campaignStart, endDate) || isBefore(campaignEnd, earliest)) {
              return null;
            }
            
            // Adjust start and end to fit within our timeline
            const displayStart = isBefore(campaignStart, earliest) ? earliest : campaignStart;
            const displayEnd = isAfter(campaignEnd, endDate) ? endDate : campaignEnd;
            
            // Calculate position and width
            const startOffset = differenceInDays(displayStart, earliest) / totalDays;
            const durationDays = differenceInDays(displayEnd, displayStart);
            const width = (durationDays / totalDays) * 100;
            
            return (
              <div key={campaign.id} className="relative h-12">
                <Link
                  to={`/campaigns/${campaign.id}`}
                  onClick={e => {
                    if (onCampaignClick) {
                      e.preventDefault();
                      onCampaignClick(campaign.id);
                    }
                  }}
                  className={`absolute h-8 rounded-md border ${getStatusColor(campaign.status)} 
                    hover:shadow-md transition-shadow duration-200 overflow-hidden`}
                  style={{
                    left: `${startOffset * 100}%`,
                    width: `${width}%`,
                    minWidth: '50px',
                  }}
                >
                  <div className="px-2 py-1 truncate flex items-center h-full">
                    <span className="font-medium text-sm truncate">
                      {campaign.name}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
          
          {campaigns.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-400">
              No campaigns to display on the timeline
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignTimeline; 