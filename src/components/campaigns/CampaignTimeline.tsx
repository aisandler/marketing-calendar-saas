import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isAfter, isBefore, isToday, differenceInDays, addDays, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, addMonths, addQuarters, getMonth, getYear, getQuarter, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, getDate, isFirstDayOfMonth } from 'date-fns';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

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

type ZoomLevel = 'all' | 'quarter' | 'month';

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
  // State for zoom level and current view
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('all');
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());
  
  // Calculate the timeline range based on all campaigns
  const allCampaignDates = campaigns.flatMap(campaign => [
    new Date(campaign.start_date),
    new Date(campaign.end_date),
  ]);
  
  const globalEarliest = propStartDate || (allCampaignDates.length > 0 
    ? new Date(Math.min(...allCampaignDates.map(d => d.getTime())))
    : new Date());
  
  const globalLatest = propEndDate || (allCampaignDates.length > 0
    ? new Date(Math.max(...allCampaignDates.map(d => d.getTime())))
    : addDays(new Date(), 90));
  
  // Calculate actual timeline range based on zoom level
  const getTimelineRange = (): [Date, Date] => {
    if (zoomLevel === 'all') {
      const daySpan = differenceInDays(globalLatest, globalEarliest);
      const minDaySpan = 30;
      const endDate = daySpan < minDaySpan ? addDays(globalEarliest, minDaySpan) : globalLatest;
      return [globalEarliest, endDate];
    } else if (zoomLevel === 'month') {
      return [startOfMonth(currentViewDate), endOfMonth(currentViewDate)];
    } else if (zoomLevel === 'quarter') {
      return [startOfQuarter(currentViewDate), endOfQuarter(currentViewDate)];
    }
    return [globalEarliest, globalLatest];
  };
  
  const [earliest, endDate] = getTimelineRange();
  
  // Generate array of dates for the timeline
  const totalDays = differenceInDays(endDate, earliest);
  const today = new Date();
  
  // Calculate the status color
  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'active':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'complete':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
  
  // Handle zoom level change
  const handleZoomChange = (newZoomLevel: ZoomLevel) => {
    setZoomLevel(newZoomLevel);
    // If zooming from 'all' to a specific view, center on current date or midpoint of timeline
    if (zoomLevel === 'all' && newZoomLevel !== 'all') {
      if (isAfter(today, globalEarliest) && isBefore(today, globalLatest)) {
        setCurrentViewDate(today);
      } else {
        // Find midpoint between earliest and latest
        const midpointTime = globalEarliest.getTime() + (globalLatest.getTime() - globalEarliest.getTime()) / 2;
        setCurrentViewDate(new Date(midpointTime));
      }
    }
  };
  
  // Handle navigation
  const navigateTimeline = (direction: 'prev' | 'next') => {
    if (zoomLevel === 'month') {
      setCurrentViewDate(prev => 
        direction === 'prev' 
          ? addMonths(prev, -1) 
          : addMonths(prev, 1)
      );
    } else if (zoomLevel === 'quarter') {
      setCurrentViewDate(prev => 
        direction === 'prev' 
          ? addQuarters(prev, -1) 
          : addQuarters(prev, 1)
      );
    }
  };
  
  // Get title for current view
  const getViewTitle = () => {
    if (zoomLevel === 'all') {
      return 'All Campaigns';
    } else if (zoomLevel === 'month') {
      return format(currentViewDate, 'MMMM yyyy');
    } else if (zoomLevel === 'quarter') {
      return `Q${getQuarter(currentViewDate)} ${getYear(currentViewDate)}`;
    }
    return '';
  };
  
  // Generate time units for grid based on zoom level
  const getTimeUnits = () => {
    if (zoomLevel === 'month') {
      // For month view, show each day
      return eachDayOfInterval({ start: earliest, end: endDate }).map(date => ({
        date,
        isMainUnit: getDate(date) === 1 || getDate(date) % 7 === 1, // First day of month or week
        label: getDate(date).toString(),
        widthPercentage: (1 / totalDays) * 100,
      }));
    } else if (zoomLevel === 'quarter') {
      // For quarter view, show each week
      return eachWeekOfInterval(
        { start: earliest, end: endDate },
        { weekStartsOn: 1 } // Start weeks on Monday
      ).map(weekStart => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const adjustedEnd = isBefore(weekEnd, endDate) ? weekEnd : endDate;
        const daysInWeek = differenceInDays(adjustedEnd, weekStart) + 1;
        
        return {
          date: weekStart,
          isMainUnit: isFirstDayOfMonth(weekStart),
          label: `W${format(weekStart, 'w')}`,
          widthPercentage: (daysInWeek / totalDays) * 100,
        };
      });
    } else {
      // For all view, show each month (already calculated in months array)
      return months.map(month => ({
        date: month.date,
        isMainUnit: true,
        label: format(month.date, 'MMM'),
        widthPercentage: month.width,
      }));
    }
  };
  
  const timeUnits = getTimeUnits();
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Zoom and Navigation Controls */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex space-x-2 items-center">
          <button
            onClick={() => handleZoomChange('all')}
            className={`px-2 py-1 text-xs rounded ${zoomLevel === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            All
          </button>
          <button
            onClick={() => handleZoomChange('quarter')}
            className={`px-2 py-1 text-xs rounded ${zoomLevel === 'quarter' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Quarter
          </button>
          <button
            onClick={() => handleZoomChange('month')}
            className={`px-2 py-1 text-xs rounded ${zoomLevel === 'month' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Month
          </button>
        </div>
        
        <div className="font-medium">{getViewTitle()}</div>
        
        <div className="flex space-x-2">
          {zoomLevel !== 'all' && (
            <>
              <button
                onClick={() => navigateTimeline('prev')}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigateTimeline('next')}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={() => handleZoomChange(zoomLevel === 'month' ? 'quarter' : zoomLevel === 'quarter' ? 'all' : 'quarter')}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label={zoomLevel === 'month' || zoomLevel === 'quarter' ? "Zoom Out" : "Zoom In"}
          >
            {zoomLevel === 'month' || zoomLevel === 'quarter' ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
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
      
      {/* Time Unit Grid */}
      <div className="flex border-b border-gray-200 h-6">
        {timeUnits.map((unit, index) => (
          <div 
            key={index}
            className={`relative border-r border-gray-100 ${unit.isMainUnit ? 'border-gray-300' : ''}`}
            style={{ width: `${unit.widthPercentage}%` }}
          >
            {unit.isMainUnit && (
              <span className="absolute top-1 left-1 text-[10px] text-gray-500">
                {unit.label}
              </span>
            )}
          </div>
        ))}
      </div>
      
      {/* Timeline grid */}
      <div className="relative">
        {/* Grid lines */}
        <div className="absolute inset-0 flex pointer-events-none">
          {timeUnits.map((unit, index) => (
            <div 
              key={index}
              className={`border-r ${unit.isMainUnit ? 'border-gray-300' : 'border-gray-100'}`}
              style={{ width: `${unit.widthPercentage}%` }}
            />
          ))}
        </div>
        
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
        <div className="p-4 space-y-3 relative">
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