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

const CalendarView = () => {
  const ganttContainer = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('week');
  const [isFixingDates, setIsFixingDates] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all briefs with no limit
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select('*');
        
        if (briefsError) throw briefsError;
        
        // Debug log
        console.log('Briefs fetched:', briefsData?.length || 0);
        if (briefsData?.length > 0) {
          console.log('Sample brief:', briefsData[0]);
        }
        
        // Fetch all campaigns with no limit
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select('*');
        
        if (campaignsError) throw campaignsError;
        
        // Debug log
        console.log('Campaigns fetched:', campaignsData?.length || 0);
        if (campaignsData?.length > 0) {
          console.log('Sample campaign:', campaignsData[0]);
        }
        
        // Fetch resources
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('*');
        
        if (resourcesError) throw resourcesError;
        
        // Fix any corrupted dates in campaigns
        const fixedCampaigns = (campaignsData || []).map(campaign => {
          // Check if dates are in the distant past (likely corrupted)
          const startDate = new Date(campaign.start_date);
          const endDate = new Date(campaign.end_date);
          
          // If dates are before 2020, they're likely corrupted
          if (startDate.getFullYear() < 2020 || endDate.getFullYear() < 2020) {
            console.warn(`Found campaign with suspicious dates: ${campaign.name}`, {
              original_start: campaign.start_date,
              original_end: campaign.end_date
            });
            
            // Create a corrected date in the current year
            const currentYear = new Date().getFullYear();
            const correctedStartMonth = startDate.getMonth();
            const correctedStartDay = startDate.getDate();
            const correctedEndMonth = endDate.getMonth();
            const correctedEndDay = endDate.getDate();
            
            // Create new date objects with the current year but same month/day
            const correctedStart = new Date(currentYear, correctedStartMonth, correctedStartDay);
            const correctedEnd = new Date(currentYear, correctedEndMonth, correctedEndDay);
            
            // If end date is before start date after correction, add a year to end date
            if (correctedEnd < correctedStart) {
              correctedEnd.setFullYear(currentYear + 1);
            }
            
            // Format as ISO strings
            const fixedStartDate = correctedStart.toISOString().split('T')[0];
            const fixedEndDate = correctedEnd.toISOString().split('T')[0];
            
            console.log(`Corrected dates for ${campaign.name}:`, {
              fixed_start: fixedStartDate,
              fixed_end: fixedEndDate
            });
            
            // Update the campaign in the database
            updateCampaignDates(campaign.id, fixedStartDate, fixedEndDate);
            
            return {
              ...campaign,
              start_date: fixedStartDate,
              end_date: fixedEndDate
            };
          }
          
          return campaign;
        });
        
        // Set state
        setBriefs(briefsData as Brief[] || []);
        setCampaigns(fixedCampaigns as Campaign[] || []);
        setResources(resourcesData || []);
        
        // Debug log
        console.log('State set with briefs:', briefsData?.length || 0, 'campaigns:', fixedCampaigns?.length || 0);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Helper function to update campaign dates in the database
    const updateCampaignDates = async (campaignId: string, startDate: string, endDate: string) => {
      try {
        const { error } = await supabase
          .from('campaigns')
          .update({
            start_date: startDate,
            end_date: endDate,
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId);
        
        if (error) {
          console.error(`Error updating campaign ${campaignId}:`, error);
        } else {
          console.log(`Successfully updated campaign ${campaignId} with corrected dates`);
        }
      } catch (error) {
        console.error(`Error updating campaign ${campaignId}:`, error);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (!ganttContainer.current || loading) {
      console.log('Gantt container not ready or still loading');
      return;
    }

    console.log('Initializing Gantt chart with data', { 
      briefs: briefs.length, 
      campaigns: campaigns.length 
    });

    // Clear previous chart if it exists
    (gantt as any).clearAll();

    // Initialize Gantt chart
    (gantt as any).init(ganttContainer.current);
    
    // Configure Gantt
    (gantt as any).config.date_format = "%Y-%m-%d";
    (gantt as any).config.scale_height = 60;
    (gantt as any).config.min_column_width = 80;
    (gantt as any).config.duration_unit = "day";
    
    // Set current date as the initial date to display
    const today = new Date();
    (gantt as any).config.start_date = new Date(today.getFullYear(), today.getMonth(), 1);
    (gantt as any).config.end_date = new Date(today.getFullYear(), today.getMonth() + 3, 0);
    
    // Fix for year selection in lightbox (date editor)
    // Set the year range to current year +/- 10 years
    const currentYear = new Date().getFullYear();
    (gantt as any).config.year_range = [currentYear - 10, currentYear + 10];
    
    // Configure the lightbox (task editor)
    (gantt as any).config.lightbox.sections = [
      { name: "description", height: 70, map_to: "text", type: "textarea", focus: true },
      { name: "time", height: 72, map_to: "auto", type: "duration" }
    ];
    
    // Enable task editing
    (gantt as any).config.readonly = false;
    
    // Handle task double click to navigate to brief detail
    (gantt as any).attachEvent("onTaskDblClick", function(id: string) {
      // Only navigate for brief tasks, not campaigns
      if (!id.toString().includes('campaign-')) {
        window.location.href = `/briefs/${id}`;
      }
      return true; // Returning true allows the default lightbox to open
    });
    
    // Configure timeline scale based on view mode
    switch (viewMode) {
      case 'day':
        (gantt as any).config.scale_unit = "day";
        (gantt as any).config.step = 1;
        (gantt as any).templates.date_scale = (date: Date) => {
          return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        };
        break;
      case 'week':
        (gantt as any).config.scale_unit = "week";
        (gantt as any).config.step = 1;
        (gantt as any).templates.date_scale = (date: Date) => {
          const endDate = new Date(date);
          endDate.setDate(endDate.getDate() + 6);
          return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        };
        break;
      case 'month':
        (gantt as any).config.scale_unit = "month";
        (gantt as any).config.step = 1;
        (gantt as any).templates.date_scale = (date: Date) => {
          return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        };
        break;
      case 'quarter':
        (gantt as any).config.scale_unit = "month";
        (gantt as any).config.step = 3;
        (gantt as any).templates.date_scale = (date: Date) => {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          return `Q${quarter} ${date.getFullYear()}`;
        };
        break;
      case 'year':
        (gantt as any).config.scale_unit = "year";
        (gantt as any).config.step = 1;
        (gantt as any).templates.date_scale = (date: Date) => {
          return date.getFullYear().toString();
        };
        break;
    }
    
    // Configure columns
    (gantt as any).config.columns = [
      { name: "text", label: "Task name", tree: true, width: 200 },
      { name: "start_date", label: "Start", align: "center", width: 80 },
      { name: "duration", label: "Duration", align: "center", width: 60 }
    ];
    
    // Custom styling for campaigns based on type
    (gantt as any).templates.task_class = function(start: Date, end: Date, task: any) {
      if (task.type === 'campaign') {
        return `campaign-task campaign-${task.campaign_type}`;
      } else if (task.priority) {
        return `${task.priority}-priority-task`;
      }
      return 'normal-task';
    };
    
    // Create tasks data structure with proper type checking
    interface GanttTask {
      id: string;
      text: string;
      start_date: string;
      end_date: string;
      duration: number;
      progress: number;
      priority: string;
      resource?: string | null;
      campaign_id?: string | null;
      type?: string;
      campaign_type?: string;
      render?: string;
    }

    const tasksData: GanttTask[] = [];
    
    // Add briefs to tasks
    if (briefs && briefs.length > 0) {
      console.log('Adding briefs to Gantt chart:', briefs.length);
      
      briefs.filter(brief => {
        // Filter briefs based on search query
        if (searchQuery) {
          return (
            brief.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            brief.description?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        return true;
      }).forEach(brief => {
        try {
          // Format dates consistently for Gantt chart
          const startDate = formatDateForGantt(brief.start_date);
          const endDate = formatDateForGantt(brief.due_date);
          
          // Debug for dates
          console.log(`Brief ${brief.id} dates:`, { 
            original: { start: brief.start_date, end: brief.due_date },
            formatted: { start: startDate, end: endDate }
          });
          
          // Calculate duration in days
          const start = new Date(startDate);
          const end = new Date(endDate);
          const durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
          
          tasksData.push({
            id: brief.id,
            text: brief.title,
            start_date: startDate,
            end_date: endDate,
            duration: durationDays,
            progress: brief.status === 'complete' ? 1 : 
                      brief.status === 'review' ? 0.9 :
                      brief.status === 'in_progress' ? 0.5 :
                      brief.status === 'approved' ? 0.3 :
                      brief.status === 'pending_approval' ? 0.1 : 0,
            priority: brief.priority,
            resource: brief.resource_id,
            campaign_id: brief.campaign_id
          });
        } catch (error) {
          console.error('Error adding brief to Gantt chart:', error, { brief });
        }
      });
    } else {
      console.warn('No briefs available for Gantt chart');
    }
    
    // Add campaigns to tasks
    if (campaigns && campaigns.length > 0) {
      console.log('Adding campaigns to Gantt chart:', campaigns.length);
      
      campaigns.forEach(campaign => {
        try {
          // Format dates consistently for Gantt chart
          const startDate = formatDateForGantt(campaign.start_date);
          const endDate = formatDateForGantt(campaign.end_date);
          
          // Debug for dates
          console.log(`Campaign ${campaign.id} dates:`, { 
            original: { start: campaign.start_date, end: campaign.end_date },
            formatted: { start: startDate, end: endDate }
          });
          
          // Calculate duration in days
          const start = new Date(startDate);
          const end = new Date(endDate);
          const durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
          
          tasksData.push({
            id: `campaign-${campaign.id}`,
            text: `${campaign.campaign_type.charAt(0).toUpperCase() + campaign.campaign_type.slice(1)}: ${campaign.name}`,
            start_date: startDate,
            end_date: endDate,
            duration: durationDays,
            progress: 0,
            priority: 'urgent',
            type: 'campaign',
            campaign_type: campaign.campaign_type,
            render: 'split'  // Use split rendering to ensure proper coloring
          });
        } catch (error) {
          console.error('Error adding campaign to Gantt chart:', error, { campaign });
        }
      });
    } else {
      console.warn('No campaigns available for Gantt chart');
    }
    
    const tasks = {
      data: tasksData,
      links: []
    };
    
    // Filter tasks based on search query
    if (searchQuery) {
      tasks.data = tasks.data.filter(task => 
        task.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Log tasks for debugging
    console.log('Tasks to render:', tasks.data.length, 'items');
    if (tasks.data.length === 0) {
      console.warn('No tasks to display in Gantt chart');
    } else {
      console.log('First 3 task samples:', tasks.data.slice(0, 3));
    }
    
    // Add some sample tasks for testing if no real tasks are available
    if (tasks.data.length === 0) {
      console.log('Adding sample tasks for testing');
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      tasks.data.push({
        id: 'sample-1',
        text: 'Sample Task 1',
        start_date: today.toISOString().split('T')[0],
        end_date: tomorrow.toISOString().split('T')[0],
        duration: 1,
        progress: 0.5,
        priority: 'high'
      });
      
      tasks.data.push({
        id: 'sample-2',
        text: 'Sample Task 2',
        start_date: tomorrow.toISOString().split('T')[0],
        end_date: nextWeek.toISOString().split('T')[0],
        duration: 7,
        progress: 0.2,
        priority: 'medium'
      });
      
      console.log('Added sample tasks:', tasks.data);
    }
    
    // Initialize chart with tasks data
    try {
      (gantt as any).parse(tasks);
      console.log('Gantt chart initialized successfully');
    } catch (error) {
      console.error('Error initializing Gantt chart:', error);
    }
    
    // Add custom CSS for campaign types
    const style = document.createElement('style');
    style.innerHTML = `
      .gantt_task_line.campaign-task {
        border-radius: 4px;
      }
      .gantt_task_line.campaign-tradeshow {
        background-color: #f87171 !important;
        border-color: #ef4444 !important;
      }
      .gantt_task_line.campaign-event {
        background-color: #60a5fa !important;
        border-color: #3b82f6 !important;
      }
      .gantt_task_line.campaign-digital_campaign {
        background-color: #a78bfa !important;
        border-color: #8b5cf6 !important;
      }
      .gantt_task_line.campaign-product_launch {
        background-color: #34d399 !important;
        border-color: #10b981 !important;
      }
      .gantt_task_line.campaign-seasonal_promotion {
        background-color: #fbbf24 !important;
        border-color: #f59e0b !important;
      }
      .gantt_task_line.campaign-other {
        background-color: #9ca3af !important;
        border-color: #6b7280 !important;
      }
      .gantt_task_line.high-priority-task {
        background-color: #f87171 !important;
        border-color: #ef4444 !important;
      }
      .gantt_task_line.medium-priority-task {
        background-color: #fbbf24 !important;
        border-color: #f59e0b !important;
      }
      .gantt_task_line.low-priority-task {
        background-color: #60a5fa !important;
        border-color: #3b82f6 !important;
      }
      .gantt_task_line.normal-task {
        background-color: #9ca3af !important;
        border-color: #6b7280 !important;
      }
    `;
    document.head.appendChild(style);
    
    // After rendering, try to ensure visibility by updating layout
    setTimeout(() => {
      try {
        (gantt as any).render();
        console.log('Forced Gantt chart re-render');
      } catch (error) {
        console.error('Error re-rendering Gantt chart:', error);
      }
    }, 500);
    
    // Cleanup
    return () => {
      document.head.removeChild(style);
      (gantt as any).clearAll();
    };
  }, [briefs, campaigns, loading, viewMode, searchQuery]);

  // Add a separate effect to reinitialize the chart when the component updates
  useEffect(() => {
    // This will run when the component mounts
    return () => {
      // This will run when the component unmounts
      if (gantt) {
        (gantt as any).clearAll();
      }
    };
  }, []);

  const handleViewModeChange = (mode: 'day' | 'week' | 'month' | 'quarter' | 'year') => {
    setViewMode(mode);
  };

  // Function to manually fix all campaign dates
  const handleFixAllDates = async () => {
    try {
      setIsFixingDates(true);
      
      // Fetch all campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*');
      
      if (campaignsError) throw campaignsError;
      
      // Count of fixed campaigns
      let fixedCount = 0;
      
      // Process each campaign
      for (const campaign of campaignsData || []) {
        // Check if dates are in the distant past (likely corrupted)
        const startDate = new Date(campaign.start_date);
        const endDate = new Date(campaign.end_date);
        
        // If dates are before 2020, they're likely corrupted
        if (startDate.getFullYear() < 2020 || endDate.getFullYear() < 2020) {
          // Create a corrected date in the current year
          const currentYear = new Date().getFullYear();
          const correctedStartMonth = startDate.getMonth();
          const correctedStartDay = startDate.getDate();
          const correctedEndMonth = endDate.getMonth();
          const correctedEndDay = endDate.getDate();
          
          // Create new date objects with the current year but same month/day
          const correctedStart = new Date(currentYear, correctedStartMonth, correctedStartDay);
          const correctedEnd = new Date(currentYear, correctedEndMonth, correctedEndDay);
          
          // If end date is before start date after correction, add a year to end date
          if (correctedEnd < correctedStart) {
            correctedEnd.setFullYear(currentYear + 1);
          }
          
          // Format as ISO strings
          const fixedStartDate = correctedStart.toISOString().split('T')[0];
          const fixedEndDate = correctedEnd.toISOString().split('T')[0];
          
          // Update the campaign in the database
          const { error } = await supabase
            .from('campaigns')
            .update({
              start_date: fixedStartDate,
              end_date: fixedEndDate,
              updated_at: new Date().toISOString()
            })
            .eq('id', campaign.id);
          
          if (!error) {
            fixedCount++;
          }
        }
      }
      
      // Refresh data
      if (fixedCount > 0) {
        // Fetch updated campaigns
        const { data: updatedCampaigns } = await supabase
          .from('campaigns')
          .select('*');
        
        setCampaigns(updatedCampaigns as Campaign[]);
        
        alert(`Successfully fixed dates for ${fixedCount} campaigns. Please refresh the page to see the changes.`);
      } else {
        alert('No campaigns with corrupted dates were found.');
      }
    } catch (error) {
      console.error('Error fixing campaign dates:', error);
      alert('An error occurred while fixing campaign dates. Please check the console for details.');
    } finally {
      setIsFixingDates(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
      <div className="bg-white shadow rounded-lg p-4 overflow-x-auto">
        <div 
          ref={ganttContainer} 
          style={{ 
            height: '600px', 
            width: '100%', 
            minWidth: '800px' 
          }} 
          className="gantt-container"
        />
      </div>
    </div>
  );
};

// Add this CSS to fix styling issues
const fixGanttStyles = () => {
  const style = document.createElement('style');
  style.innerHTML = `
    .gantt-container {
      position: relative;
      overflow: visible;
    }
    .gantt_task_line {
      border-radius: 4px !important;
      height: 14px !important;
    }
    .gantt_grid_data .gantt_cell {
      padding: 5px 6px;
    }
    .gantt_grid_head_cell {
      padding: 5px 6px;
    }
  `;
  document.head.appendChild(style);
};

// Execute once when component is first loaded
fixGanttStyles();

export default CalendarView;
