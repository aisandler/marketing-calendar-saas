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

interface MarketingCalendarProps {
  briefs: Array<{
    id: string;
    title: string;
    start_date: string;
    due_date: string;
    status: string;
    brand?: { name: string };
    resource?: { name: string };
  }>;
  campaigns?: Array<{
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
    brand?: { name: string };
  }>;
}

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'pending_approval':
      return 'bg-amber-100 text-amber-800';
    case 'approved':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
      return 'bg-indigo-100 text-indigo-800';
    case 'review':
      return 'bg-purple-100 text-purple-800';
    case 'complete':
      return 'bg-emerald-100 text-emerald-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'active':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const MarketingCalendar: React.FC<MarketingCalendarProps> = ({ briefs, campaigns = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCampaigns, setShowCampaigns] = useState(true);
  const [showBriefs, setShowBriefs] = useState(true);
  
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

  // Helper to get briefs for a specific day
  const getBriefsForDay = (date: Date) => {
    if (!showBriefs) return [];
    
    return briefs.filter(brief => {
      const briefStart = new Date(brief.start_date);
      const briefEnd = new Date(brief.due_date);
      
      // Check if this date falls within the brief's duration
      return date >= briefStart && date <= briefEnd;
    });
  };
  
  // Helper to get campaigns for a specific day
  const getCampaignsForDay = (date: Date) => {
    if (!showCampaigns) return [];
    
    return campaigns.filter(campaign => {
      const campaignStart = new Date(campaign.start_date);
      const campaignEnd = new Date(campaign.end_date);
      
      // Check if this date falls within the campaign's duration
      return date >= campaignStart && date <= campaignEnd;
    });
  };
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prevMonth => 
      direction === 'prev' ? subMonths(prevMonth, 1) : addMonths(prevMonth, 1)
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Calendar header */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex justify-between sm:justify-end items-center gap-4">
          <div className="flex gap-3 text-sm">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showBriefs}
                onChange={() => setShowBriefs(!showBriefs)}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Briefs
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showCampaigns}
                onChange={() => setShowCampaigns(!showCampaigns)}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Campaigns
            </label>
          </div>
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
            const dayBriefs = getBriefsForDay(day);
            const dayCampaigns = getCampaignsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const items = [
              ...dayCampaigns.map(campaign => ({ 
                type: 'campaign', 
                id: campaign.id, 
                title: campaign.name,
                status: campaign.status,
                url: `/campaigns/${campaign.id}`
              })),
              ...dayBriefs.map(brief => ({ 
                type: 'brief', 
                id: brief.id, 
                title: brief.title,
                status: brief.status,
                url: `/briefs/${brief.id}`
              }))
            ];
            
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
                  {items.slice(0, 3).map(item => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      to={item.url}
                      className={`block text-xs truncate mb-1 px-1 py-0.5 rounded ${getStatusColor(item.status)} ${
                        item.type === 'campaign' ? 'border-l-2 border-indigo-400' : 'border-l-2 border-emerald-400'
                      }`}
                    >
                      {item.type === 'campaign' ? '📅 ' : '📝 '}{item.title}
                    </Link>
                  ))}
                  {items.length > 3 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{items.length - 3} more
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

export default MarketingCalendar; 