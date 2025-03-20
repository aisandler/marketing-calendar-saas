import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isSameMonth, addMonths, subMonths } from 'date-fns';
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
  
  // Generate timeline dates
  const timelineDates = useMemo(() => {
    const dates = [];
    const startDate = subMonths(currentDate, Math.floor(timelineRange / 2));
    
    for (let i = 0; i < timelineRange; i++) {
      const date = addMonths(startDate, i);
      dates.push(date);
    }
    
    return dates;
  }, [currentDate, timelineRange]);
  
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
        
        // Check if brief spans this month
        const briefStartsBeforeMonthEnd = startDate <= addMonths(date, 1);
        const briefEndsAfterMonthStart = dueDate >= date;
        
        if (briefStartsBeforeMonthEnd && briefEndsAfterMonthStart) {
          grouped[monthKey].push(brief);
        }
      });
    });
    
    return grouped;
  }, [briefs, timelineDates]);
  
  // Get relative position and width for a brief within a month
  const getBriefStyle = (brief: Brief, monthDate: Date) => {
    const startOfMonth = new Date(monthDate);
    startOfMonth.setDate(1);
    
    const endOfMonth = new Date(monthDate);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0); // Last day of month
    
    const daysInMonth = endOfMonth.getDate();
    
    const briefStart = parseISO(brief.start_date);
    const briefEnd = parseISO(brief.due_date);
    
    // Constrain brief to current month
    const effectiveStart = briefStart < startOfMonth ? startOfMonth : briefStart;
    const effectiveEnd = briefEnd > endOfMonth ? endOfMonth : briefEnd;
    
    // Calculate position as percentage of month
    const startPosition = (effectiveStart.getDate() - 1) / daysInMonth * 100;
    
    // Calculate width as percentage of month
    const daysDuration = (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24) + 1;
    const widthPercentage = (daysDuration / daysInMonth) * 100;
    
    return {
      left: `${startPosition}%`,
      width: `${widthPercentage}%`,
      backgroundColor: getStatusColor(brief.status),
      borderLeft: `4px solid ${getStatusColor(brief.status)}`,
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
      <div className="mt-6">
        {timelineDates.map((monthDate, index) => (
          <div key={format(monthDate, 'yyyy-MM')} className="mb-6">
            <div className="flex items-center mb-2">
              <h3 className="text-lg font-medium">
                {format(monthDate, 'MMMM yyyy')}
              </h3>
            </div>
            
            {/* Month Timeline */}
            <div className="relative mt-2 border border-gray-200 rounded-md bg-gray-50 h-10">
              {/* Day markers */}
              <div className="absolute top-0 left-0 w-full h-full flex">
                {Array.from({ length: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate() }).map((_, dayIndex) => (
                  <div 
                    key={dayIndex} 
                    className="flex-1 border-r border-gray-200 last:border-r-0"
                  >
                    {(dayIndex + 1) % 5 === 0 && (
                      <div className="text-xs text-gray-500 absolute -top-5" style={{ left: `${(dayIndex + 0.5) / new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate() * 100}%` }}>
                        {dayIndex + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Briefs */}
            <div className="relative mt-2">
              {briefsByMonth[format(monthDate, 'yyyy-MM')].map((brief, briefIndex) => (
                <div 
                  key={`${brief.id}-${index}`} 
                  className="mt-1 relative h-8 flex items-center"
                >
                  <div 
                    className="absolute h-6 rounded-sm border-l-4 shadow-sm flex items-center overflow-hidden text-xs"
                    style={getBriefStyle(brief, monthDate)}
                  >
                    <Link 
                      to={`/briefs/${brief.id}`}
                      className="pl-2 pr-1 w-full h-full flex items-center hover:bg-opacity-90 transition-colors truncate"
                    >
                      {brief.title}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BriefsTimeline; 