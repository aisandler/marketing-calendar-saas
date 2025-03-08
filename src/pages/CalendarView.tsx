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
import type { Brief, Tradeshow } from '../types';

const CalendarView = () => {
  const ganttContainer = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [tradeshows, setTradeshows] = useState<Tradeshow[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('week');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch briefs
        const { data: briefsData, error: briefsError } = await supabase
          .from('briefs')
          .select('*');
        
        if (briefsError) throw briefsError;
        
        // Fetch tradeshows
        const { data: tradeshowsData, error: tradeshowsError } = await supabase
          .from('tradeshows')
          .select('*');
        
        if (tradeshowsError) throw tradeshowsError;
        
        // Fetch resources
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('*');
        
        if (resourcesError) throw resourcesError;
        
        // Set state
        setBriefs(briefsData as Brief[]);
        setTradeshows(tradeshowsData as Tradeshow[]);
        setResources(resourcesData || []);
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    if (!ganttContainer.current || loading) return;

    // Initialize Gantt chart
    (gantt as any).init(ganttContainer.current);
    
    // Configure Gantt
    (gantt as any).config.date_format = "%Y-%m-%d";
    (gantt as any).config.scale_height = 60;
    (gantt as any).config.min_column_width = 80;
    (gantt as any).config.duration_unit = "day";
    
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
    
    // Custom styling for tradeshows (high priority)
    (gantt as any).templates.task_class = (start: Date, end: Date, task: any) => {
      if (task.type === 'tradeshow') {
        return 'tradeshow-task';
      }
      
      switch (task.priority) {
        case 'urgent':
          return 'urgent-task';
        case 'high':
          return 'high-priority-task';
        case 'medium':
          return 'medium-priority-task';
        case 'low':
          return 'low-priority-task';
        default:
          return '';
      }
    };
    
    // Prepare data for Gantt chart
    const tasks = {
      data: [
        ...briefs.map(brief => ({
          id: brief.id,
          text: brief.title,
          start_date: brief.start_date,
          end_date: brief.due_date,
          duration: Math.ceil((new Date(brief.due_date).getTime() - new Date(brief.start_date).getTime()) / (1000 * 3600 * 24)),
          progress: brief.status === 'complete' ? 1 : brief.status === 'in_progress' ? 0.5 : 0,
          priority: brief.priority,
          resource: brief.resource_id,
          type: 'brief'
        })),
        ...tradeshows.map(tradeshow => ({
          id: `tradeshow-${tradeshow.id}`,
          text: `Tradeshow: ${tradeshow.name}`,
          start_date: tradeshow.start_date,
          end_date: tradeshow.end_date,
          duration: Math.ceil((new Date(tradeshow.end_date).getTime() - new Date(tradeshow.start_date).getTime()) / (1000 * 3600 * 24)),
          progress: 0,
          priority: 'urgent', // Tradeshows always have highest priority
          type: 'tradeshow'
        }))
      ],
      links: [] // No links between tasks for now
    };
    
    // Filter tasks based on search query
    if (searchQuery) {
      tasks.data = tasks.data.filter(task => 
        task.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Initialize chart
    (gantt as any).parse(tasks);
    
    // Add custom CSS
    const style = document.createElement('style');
    style.innerHTML = `
      .gantt_task_line.tradeshow-task {
        background-color: #f87171;
        border-color: #ef4444;
      }
      .gantt_task_line.urgent-task {
        background-color: #fecaca;
        border-color: #f87171;
      }
      .gantt_task_line.high-priority-task {
        background-color: #fed7aa;
        border-color: #fb923c;
      }
      .gantt_task_line.medium-priority-task {
        background-color: #bfdbfe;
        border-color: #60a5fa;
      }
      .gantt_task_line.low-priority-task {
        background-color: #bbf7d0;
        border-color: #4ade80;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
      (gantt as any).clearAll();
    };
  }, [loading, briefs, tradeshows, viewMode, searchQuery]);

  const handleViewModeChange = (mode: 'day' | 'week' | 'month' | 'quarter' | 'year') => {
    setViewMode(mode);
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
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-400 rounded mr-2"></div>
            <span>Tradeshow</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-200 rounded mr-2"></div>
            <span>Urgent</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-200 rounded mr-2"></div>
            <span>High Priority</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-200 rounded mr-2"></div>
            <span>Medium Priority</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-200 rounded mr-2"></div>
            <span>Low Priority</span>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white shadow rounded-lg p-4">
        <div ref={ganttContainer} style={{ height: '600px', width: '100%' }} />
      </div>
    </div>
  );
};

export default CalendarView;
