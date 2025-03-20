import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isAfter, isBefore, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { getStatusColor } from '../lib/utils';

interface Brief {
  id: string;
  title: string;
  start_date: string;
  due_date: string;
  status: string;
  channel: string;
  brand?: { id: string; name: string };
  resource?: { id: string; name: string };
  created_by_user?: { id: string; name: string };
}

interface BriefsTimelineProps {
  briefs: Brief[];
}

const BriefsTimeline: React.FC<BriefsTimelineProps> = ({ briefs }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [timelineRange, setTimelineRange] = React.useState(3); // Months to show
  
  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Generate timeline dates - centering on current date
  const timelineDates = useMemo(() => {
    const dates = [];
    let startDate;
    
    // Calculate the starting date to center the current month
    if (timelineRange % 2 === 0) {
      // For even numbers of months, put current month in the first half
      startDate = subMonths(currentDate, Math.floor(timelineRange / 2) - 1);
    } else {
      // For odd numbers of months, center exactly
      startDate = subMonths(currentDate, Math.floor(timelineRange / 2));
    }
    
    // Adjust to start of month
    startDate = startOfMonth(startDate);
    
    for (let i = 0; i < timelineRange; i++) {
      const date = addMonths(startDate, i);
      dates.push(date);
    }
    
    return dates;
  }, [currentDate, timelineRange]);
  
  // Get media type color
  const getMediaTypeColor = (channel: string | null): string => {
    if (!channel) return "#e5e7eb"; // gray-200
    
    const channelLower = channel.toLowerCase();
    
    if (channelLower.includes('website') || channelLower.includes('web')) {
      return "#dbeafe"; // blue-100
    } else if (channelLower.includes('video')) {
      return "#f3e8ff"; // purple-100
    } else if (channelLower.includes('email')) {
      return "#fef3c7"; // amber-100
    } else if (channelLower.includes('social') && channelLower.includes('media')) {
      return "#dcfce7"; // green-100
    } else if (channelLower.includes('print')) {
      return "#e0e7ff"; // indigo-100
    } else if (channelLower.includes('design')) {
      return "#fce7f3"; // pink-100
    } else if (channelLower.includes('image') || channelLower.includes('photo')) {
      return "#d1fae5"; // emerald-100
    } else if (channelLower.includes('youtube')) {
      return "#fee2e2"; // red-100
    } else if (channelLower.includes('instagram')) {
      return "#fce7f3"; // pink-100
    } else if (channelLower.includes('facebook')) {
      return "#dbeafe"; // blue-100
    } else if (channelLower.includes('linkedin')) {
      return "#bfdbfe"; // blue-200
    } else if (channelLower.includes('twitter')) {
      return "#dbeafe"; // blue-100
    }
    
    // Default color
    return "#f3f4f6"; // gray-100
  };
  
  // Get media type border color
  const getMediaTypeBorderColor = (channel: string | null): string => {
    if (!channel) return "#9ca3af"; // gray-400
    
    const channelLower = channel.toLowerCase();
    
    if (channelLower.includes('website') || channelLower.includes('web')) {
      return "#3b82f6"; // blue-500
    } else if (channelLower.includes('video')) {
      return "#a855f7"; // purple-500
    } else if (channelLower.includes('email')) {
      return "#f59e0b"; // amber-500
    } else if (channelLower.includes('social') && channelLower.includes('media')) {
      return "#22c55e"; // green-500
    } else if (channelLower.includes('print')) {
      return "#6366f1"; // indigo-500
    } else if (channelLower.includes('design')) {
      return "#ec4899"; // pink-500
    } else if (channelLower.includes('image') || channelLower.includes('photo')) {
      return "#10b981"; // emerald-500
    } else if (channelLower.includes('youtube')) {
      return "#ef4444"; // red-500
    } else if (channelLower.includes('instagram')) {
      return "#ec4899"; // pink-500
    } else if (channelLower.includes('facebook')) {
      return "#2563eb"; // blue-600
    } else if (channelLower.includes('linkedin')) {
      return "#1d4ed8"; // blue-700
    } else if (channelLower.includes('twitter')) {
      return "#60a5fa"; // blue-400
    }
    
    // Default color
    return "#6b7280"; // gray-500
  };
  
  // Group briefs by month
  const briefsByMonth = useMemo(() => {
    const grouped: Record<string, Brief[]> = {};
    
    // Initialize empty arrays for each month in our timeline
    timelineDates.forEach(date => {
      const monthKey = format(date, 'yyyy-MM');
      grouped[monthKey] = [];
    });
    
    // Assign briefs to months
    briefs.forEach(brief => {
      const startDate = parseISO(brief.start_date);
      const dueDate = parseISO(brief.due_date);
      
      // Add brief to each month it spans
      timelineDates.forEach(date => {
        const monthKey = format(date, 'yyyy-MM');
        
        // Month start and end
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        
        // Check if brief spans this month
        const briefStartsBeforeMonthEnd = isBefore(startDate, monthEnd) || startDate.getTime() === monthEnd.getTime();
        const briefEndsAfterMonthStart = isAfter(dueDate, monthStart) || dueDate.getTime() === monthStart.getTime();
        
        if (briefStartsBeforeMonthEnd && briefEndsAfterMonthStart) {
          grouped[monthKey].push(brief);
        }
      });
    });
    
    // Sort briefs within each month by start date
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        // First by start date
        const startDateA = new Date(a.start_date).getTime();
        const startDateB = new Date(b.start_date).getTime();
        if (startDateA !== startDateB) {
          return startDateA - startDateB;
        }
        
        // Then by duration (shorter tasks first)
        const durationA = new Date(a.due_date).getTime() - new Date(a.start_date).getTime();
        const durationB = new Date(b.due_date).getTime() - new Date(b.start_date).getTime();
        return durationA - durationB;
      });
    });
    
    return grouped;
  }, [briefs, timelineDates]);
  
  // Get relative position and width for a brief within a month
  const getBriefStyle = (brief: Brief, monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const daysInMonth = monthEnd.getDate();
    
    const briefStart = parseISO(brief.start_date);
    const briefEnd = parseISO(brief.due_date);
    
    // Constrain brief to current month
    const effectiveStart = isBefore(briefStart, monthStart) ? monthStart : briefStart;
    const effectiveEnd = isAfter(briefEnd, monthEnd) ? monthEnd : briefEnd;
    
    // Calculate position as percentage of month
    const startPosition = ((effectiveStart.getDate() - 1) / daysInMonth) * 100;
    
    // Calculate width as percentage of month
    const daysDuration = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const widthPercentage = (daysDuration / daysInMonth) * 100;
    
    // Ensure minimum width for visibility
    const minWidth = 8; // percentage
    const adjustedWidth = Math.max(widthPercentage, minWidth);
    
    return {
      left: `${startPosition}%`,
      width: `${adjustedWidth}%`,
      backgroundColor: getMediaTypeColor(brief.channel),
      borderLeft: `4px solid ${getMediaTypeBorderColor(brief.channel)}`
    };
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-lg font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </div>
        <div className="flex items-center space-x-2">
          <select 
            className="rounded border-gray-300 text-sm py-1 px-2"
            value={timelineRange}
            onChange={(e) => setTimelineRange(Number(e.target.value))}
          >
            <option value={1}>1 Month</option>
            <option value={3}>3 Months</option>
            <option value={6}>6 Months</option>
            <option value={12}>12 Months</option>
          </select>
        </div>
      </div>
      
      {/* Timeline Grid */}
      <div className="mt-6 overflow-x-auto">
        <div className="min-w-max">
          {timelineDates.map((monthDate, index) => (
            <div key={format(monthDate, 'yyyy-MM')} className="mb-8">
              <div className="flex items-center mb-2">
                <h3 className="text-lg font-medium">
                  {format(monthDate, 'MMMM yyyy')}
                </h3>
              </div>
              
              {/* Month Timeline */}
              <div className="relative mt-2 border border-gray-200 rounded-md bg-gray-50 h-10">
                {/* Day markers */}
                <div className="absolute top-0 left-0 w-full h-full flex">
                  {Array.from({ length: endOfMonth(monthDate).getDate() }).map((_, dayIndex) => (
                    <div 
                      key={dayIndex} 
                      className="flex-1 border-r border-gray-200 last:border-r-0 relative"
                    >
                      {(dayIndex + 1) % 5 === 0 && (
                        <div className="text-xs text-gray-500 absolute -top-5 -translate-x-1/2" style={{ left: `${100 / endOfMonth(monthDate).getDate() * (dayIndex + 1)}%` }}>
                          {dayIndex + 1}
                        </div>
                      )}
                      {/* Add day number at the bottom of the bar */}
                      {(dayIndex + 1) === 1 && (
                        <div className="text-xs text-gray-500 absolute -bottom-5 -translate-x-1/2" style={{ left: '0' }}>
                          1
                        </div>
                      )}
                      {(dayIndex + 1) === endOfMonth(monthDate).getDate() && (
                        <div className="text-xs text-gray-500 absolute -bottom-5 -translate-x-1/2" style={{ left: '100%' }}>
                          {endOfMonth(monthDate).getDate()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Current day indicator */}
                {isBefore(monthDate, currentDate) && isAfter(endOfMonth(monthDate), currentDate) && (
                  <div 
                    className="absolute top-0 bottom-0 w-px bg-red-500 z-10" 
                    style={{ 
                      left: `${(currentDate.getDate() - 1) / endOfMonth(monthDate).getDate() * 100}%`,
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-red-500 absolute top-0 -translate-x-1/2"></div>
                  </div>
                )}
              </div>
              
              {/* Briefs */}
              <div className="relative mt-6 pb-4">
                {briefsByMonth[format(monthDate, 'yyyy-MM')].map((brief, briefIndex) => (
                  <div 
                    key={`${brief.id}-${index}-${briefIndex}`} 
                    className="mt-1 relative h-8 flex items-center overflow-visible mb-1"
                  >
                    <div 
                      className="absolute h-6 rounded-sm shadow-sm flex items-center overflow-hidden text-xs hover:shadow-md transition-shadow"
                      style={getBriefStyle(brief, monthDate)}
                      title={`${brief.title} (${format(parseISO(brief.start_date), 'MMM d')} - ${format(parseISO(brief.due_date), 'MMM d')})`}
                    >
                      <Link 
                        to={`/briefs/${brief.id}`}
                        className="pl-2 pr-1 w-full h-full flex items-center hover:bg-opacity-90 transition-colors truncate text-gray-800"
                      >
                        {brief.title}
                      </Link>
                    </div>
                  </div>
                ))}
                
                {/* Empty state message */}
                {briefsByMonth[format(monthDate, 'yyyy-MM')].length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-2">
                    No briefs scheduled for this month
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-6 border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Media Types</h4>
        <div className="flex flex-wrap gap-3">
          {['Website', 'Video', 'Email', 'Social Media', 'Print', 'Design', 'Image'].map(type => (
            <div key={type} className="flex items-center text-xs">
              <div 
                className="w-4 h-4 rounded-sm mr-1"
                style={{ 
                  backgroundColor: getMediaTypeColor(type),
                  borderLeft: `3px solid ${getMediaTypeBorderColor(type)}`
                }}
              ></div>
              <span>{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BriefsTimeline; 