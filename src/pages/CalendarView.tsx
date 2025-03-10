import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';
// @ts-ignore
import gantt from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { Button } from '../components/ui/Button';
import { Calendar, ChevronLeft, ChevronRight, List, Search } from 'lucide-react';
import { Input } from '../components/ui/Input';
import type { Brief, Campaign } from '../types';

// Helper function to ensure consistent date formatting for Gantt chart
const formatDateForGantt = (dateString: string): string => {
  try {
    // Parse the date string to ensure consistent format
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      // Return today's date as fallback
      return new Date().toISOString().split('T')[0];
    }
    
    // Format as YYYY-MM-DD which is what Gantt expects
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    // Return today's date as fallback
    return new Date().toISOString().split('T')[0];
  }
};

// Interface for Gantt task
interface GanttTask {
  id: string;
  text: string;
  start_date: string;
  end_date: string;
  duration?: number;
  progress?: number;
  priority?: string;
  resource?: string | null;
  campaign_id?: string | null;
  type?: string;
  campaign_type?: string;
  render?: string;
  color?: string;
  textColor?: string;
}

const CalendarView = () => {
  const ganttContainer = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('week');
  const [isFixingDates, setIsFixingDates] = useState(false);
  const [ganttInitialized, setGanttInitialized] = useState(false);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching data for calendar view...');
        
        // Fetch briefs
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select('*');
        
        if (briefsError) {
          console.error('Error fetching briefs:', briefsError);
          throw briefsError;
        }
        
        console.log(`Fetched ${briefsData?.length || 0} briefs`);
        
        // Fetch campaigns
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*');
        
        if (campaignsError) {
          console.error('Error fetching campaigns:', campaignsError);
          throw campaignsError;
        }
        
        console.log(`Fetched ${campaignsData?.length || 0} campaigns`);
        
        // Set state
        setBriefs(briefsData || []);
        setCampaigns(campaignsData || []);
        
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Initialize Gantt chart
  useEffect(() => {
    if (!ganttContainer.current) {
      console.log('Gantt container ref not available');
      return;
    }
    
    if (ganttInitialized) {
      console.log('Gantt already initialized, skipping');
      return;
    }
    
    console.log('Initializing Gantt chart...');
    
    try {
      // Clear any existing chart
      (gantt as any).clearAll();
      
      // Basic configuration
      (gantt as any).config.date_format = "%Y-%m-%d";
      (gantt as any).config.scale_height = 60;
      (gantt as any).config.min_column_width = 80;
      (gantt as any).config.duration_unit = "day";
      (gantt as any).config.row_height = 30;
      
      // Set current date as the initial date to display
      const today = new Date();
      (gantt as any).config.start_date = new Date(today.getFullYear(), today.getMonth(), 1);
      (gantt as any).config.end_date = new Date(today.getFullYear(), today.getMonth() + 3, 0);
      
      // Configure columns
      (gantt as any).config.columns = [
        { name: "text", label: "Task name", tree: true, width: 200 },
        { name: "start_date", label: "Start", align: "center", width: 80 },
        { name: "duration", label: "Duration", align: "center", width: 60 }
      ];
      
      // Initialize the chart
      (gantt as any).init(ganttContainer.current);
      
      // Create sample data
      const sampleTasks: GanttTask[] = createSampleTasks();
      
      // Log sample tasks
      console.log('Sample tasks for Gantt chart:', sampleTasks);
      
      // Parse the data
      (gantt as any).parse({
        data: sampleTasks,
        links: []
      });
      
      // Force render
      (gantt as any).render();
      
      // Mark as initialized
      setGanttInitialized(true);
      console.log('Gantt chart initialized successfully');
      
    } catch (error) {
      console.error('Error initializing Gantt chart:', error);
    }
  }, [ganttContainer.current]);
  
  // Update Gantt with real data when available
  useEffect(() => {
    if (!ganttInitialized || loading) {
      return;
    }
    
    if (briefs.length === 0 && campaigns.length === 0) {
      console.log('No real data available for Gantt chart');
      return;
    }
    
    console.log('Updating Gantt chart with real data...');
    
    try {
      // Prepare tasks from briefs and campaigns
      const tasks: GanttTask[] = [];
      
      // Add briefs
      briefs.forEach(brief => {
        try {
          const startDate = formatDateForGantt(brief.start_date);
          const endDate = formatDateForGantt(brief.due_date);
          
          tasks.push({
            id: brief.id,
            text: brief.title,
            start_date: startDate,
            end_date: endDate,
            priority: brief.priority,
            color: getPriorityColor(brief.priority),
            textColor: '#ffffff'
          });
        } catch (error) {
          console.error('Error processing brief for Gantt:', error, brief);
        }
      });
      
      // Add campaigns
      campaigns.forEach(campaign => {
        try {
          const startDate = formatDateForGantt(campaign.start_date);
          const endDate = formatDateForGantt(campaign.end_date);
          
          tasks.push({
            id: `campaign-${campaign.id}`,
            text: `${campaign.campaign_type}: ${campaign.name}`,
            start_date: startDate,
            end_date: endDate,
            type: 'campaign',
            campaign_type: campaign.campaign_type,
            color: getCampaignColor(campaign.campaign_type),
            textColor: '#ffffff'
          });
        } catch (error) {
          console.error('Error processing campaign for Gantt:', error, campaign);
        }
      });
      
      console.log(`Prepared ${tasks.length} tasks for Gantt chart`);
      
      // Clear existing data
      (gantt as any).clearAll();
      
      // Parse new data
      (gantt as any).parse({
        data: tasks,
        links: []
      });
      
      // Force render
      (gantt as any).render();
      
      console.log('Gantt chart updated with real data');
      
    } catch (error) {
      console.error('Error updating Gantt chart with real data:', error);
    }
  }, [briefs, campaigns, loading, ganttInitialized]);
  
  // Helper function to create sample tasks
  const createSampleTasks = (): GanttTask[] => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    return [
      {
        id: 'task-1',
        text: 'Sample Task 1',
        start_date: today.toISOString().split('T')[0],
        end_date: tomorrow.toISOString().split('T')[0],
        color: '#4CAF50',
        textColor: '#ffffff'
      },
      {
        id: 'task-2',
        text: 'Sample Task 2',
        start_date: tomorrow.toISOString().split('T')[0],
        end_date: nextWeek.toISOString().split('T')[0],
        color: '#2196F3',
        textColor: '#ffffff'
      },
      {
        id: 'task-3',
        text: 'Sample Task 3',
        start_date: nextWeek.toISOString().split('T')[0],
        end_date: nextMonth.toISOString().split('T')[0],
        color: '#FFC107',
        textColor: '#ffffff'
      }
    ];
  };
  
  // Helper function to get color based on priority
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent':
        return '#F44336'; // Red
      case 'high':
        return '#FF9800'; // Orange
      case 'medium':
        return '#FFC107'; // Amber
      case 'low':
        return '#4CAF50'; // Green
      default:
        return '#9E9E9E'; // Grey
    }
  };
  
  // Helper function to get color based on campaign type
  const getCampaignColor = (type: string): string => {
    switch (type) {
      case 'tradeshow':
        return '#E91E63'; // Pink
      case 'event':
        return '#2196F3'; // Blue
      case 'digital_campaign':
        return '#9C27B0'; // Purple
      case 'product_launch':
        return '#4CAF50'; // Green
      case 'seasonal_promotion':
        return '#FF9800'; // Orange
      default:
        return '#9E9E9E'; // Grey
    }
  };

  const handleViewModeChange = (mode: 'day' | 'week' | 'month' | 'quarter' | 'year') => {
    setViewMode(mode);
  };

  const handleFixAllDates = async () => {
    setIsFixingDates(true);
    // Implementation for fixing dates...
    setTimeout(() => setIsFixingDates(false), 1000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Calendar</h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search tasks..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* View mode buttons */}
            <div className="flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => handleViewModeChange('day')}
                className={`px-3 py-2 text-sm font-medium rounded-l-lg ${
                  viewMode === 'day'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-200`}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('week')}
                className={`px-3 py-2 text-sm font-medium ${
                  viewMode === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border-t border-b border-gray-200`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('month')}
                className={`px-3 py-2 text-sm font-medium ${
                  viewMode === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border-t border-b border-gray-200`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('quarter')}
                className={`px-3 py-2 text-sm font-medium ${
                  viewMode === 'quarter'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border-t border-b border-gray-200`}
              >
                Quarter
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange('year')}
                className={`px-3 py-2 text-sm font-medium rounded-r-lg ${
                  viewMode === 'year'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-200`}
              >
                Year
              </button>
            </div>
            
            <Link to="/briefs">
              <Button variant="outline" className="px-3 py-2">
                <List className="h-5 w-5" />
                <span className="ml-2">List View</span>
              </Button>
            </Link>
            
            {/* Fix Dates Button */}
            <Button 
              variant="outline" 
              className="px-3 py-2 text-amber-600 border-amber-300 hover:bg-amber-50"
              onClick={handleFixAllDates}
              disabled={isFixingDates}
            >
              <Calendar className="h-5 w-5" />
              <span className="ml-2">{isFixingDates ? 'Fixing Dates...' : 'Fix Calendar Dates'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 p-4 bg-white rounded-lg shadow">
        <div className="text-sm font-medium">Legend:</div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-400 rounded mr-2"></div>
          <span>Tradeshow</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-400 rounded mr-2"></div>
          <span>Event</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-purple-400 rounded mr-2"></div>
          <span>Digital Campaign</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-400 rounded mr-2"></div>
          <span>Product Launch</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-amber-400 rounded mr-2"></div>
          <span>Seasonal Promotion</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
          <span>Other</span>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white shadow rounded-lg p-4">
        {loading ? (
          <div className="flex items-center justify-center h-[600px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3">Loading calendar data...</span>
          </div>
        ) : (
          <div 
            ref={ganttContainer} 
            style={{ 
              height: '600px', 
              width: '100%',
              position: 'relative'
            }} 
            className="gantt-chart-container"
          />
        )}
      </div>
    </div>
  );
};

// Add global styles for Gantt chart
(() => {
  const style = document.createElement('style');
  style.innerHTML = `
    .gantt-chart-container {
      position: relative;
      overflow: hidden;
    }
    .gantt_task_line {
      border-radius: 4px;
      height: 20px !important;
    }
    .gantt_task_content {
      line-height: 20px !important;
      color: white;
      font-weight: bold;
    }
    .gantt_grid_data .gantt_cell {
      padding: 5px 6px;
    }
  `;
  document.head.appendChild(style);
})();

export default CalendarView;
