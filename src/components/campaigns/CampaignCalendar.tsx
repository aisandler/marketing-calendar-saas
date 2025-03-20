import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  getDay, 
  isToday,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

interface CampaignCalendarProps {
  campaigns: Campaign[];
  initialDate?: Date;
  onCampaignClick?: (campaignId: string) => void;
}

const CampaignCalendar: React.FC<CampaignCalendarProps> = ({
  campaigns,
  initialDate,
  onCampaignClick,
}) => {
  const [currentMonth, setCurrentMonth] = useState(initialDate || new Date());
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get all days in the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = monthStart;
  const endDate = monthEnd;
  
  // Create array of date objects for all days in month
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Calculate the actual grid: start on Sunday of the week containing the first of the month
  const startDay = getDay(monthStart); // 0 (Sunday) to 6 (Saturday)
  
  // Get campaigns that occur during this month
  const visibleCampaigns = campaigns.filter(campaign => {
    const campaignStart = new Date(campaign.start_date);
    const campaignEnd = new Date(campaign.end_date);
    
    // Campaign starts before end of month AND ends after start of month
    return campaignStart <= monthEnd && campaignEnd >= monthStart;
  });
  
  // Helper to get campaigns for a specific day
  const getCampaignsForDay = (date: Date) => {
    return visibleCampaigns.filter(campaign => {
      const campaignStart = new Date(campaign.start_date);
      const campaignEnd = new Date(campaign.end_date);
      
      // Check if this date falls within the campaign's duration
      return date >= campaignStart && date <= campaignEnd;
    });
  };
  
  // Calculate the status color
  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-indigo-100 text-indigo-800';
      case 'complete':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prevMonth => 
      direction === 'prev' ? subMonths(prevMonth, 1) : addMonths(prevMonth, 1)
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Calendar header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => navigateMonth('prev')}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="p-4">
        {/* Days of week header */}
        <div className="grid grid-cols-7 mb-2">
          {daysOfWeek.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before the start of month */}
          {Array.from({ length: startDay }).map((_, index) => (
            <div key={`empty-start-${index}`} className="h-24 bg-gray-50 rounded-md" />
          ))}
          
          {/* Days of the month */}
          {daysInMonth.map(day => {
            const dayCampaigns = getCampaignsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            
            return (
              <div
                key={day.toISOString()}
                className={`h-24 border rounded-md overflow-hidden ${
                  isToday(day) ? 'border-blue-500' : 'border-gray-200'
                } ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}`}
              >
                <div className={`text-right p-1 ${
                  isToday(day) ? 'bg-blue-50' : ''
                }`}>
                  <span className={`text-sm font-medium inline-block rounded-full w-6 h-6 text-center leading-6 ${
                    isToday(day) ? 'bg-blue-500 text-white' : 'text-gray-700'
                  }`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="p-1 overflow-y-auto max-h-16">
                  {dayCampaigns.slice(0, 3).map(campaign => (
                    <Link
                      key={campaign.id}
                      to={`/campaigns/${campaign.id}`}
                      onClick={e => {
                        if (onCampaignClick) {
                          e.preventDefault();
                          onCampaignClick(campaign.id);
                        }
                      }}
                      className={`block text-xs truncate mb-1 px-1 py-0.5 rounded ${getStatusColor(campaign.status)}`}
                    >
                      {campaign.name}
                    </Link>
                  ))}
                  {dayCampaigns.length > 3 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{dayCampaigns.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CampaignCalendar; 