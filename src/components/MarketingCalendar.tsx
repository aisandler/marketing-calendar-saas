import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Link } from 'react-router-dom';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  url?: string;
  extendedProps: {
    type: 'brief' | 'campaign';
    status: string;
    brand?: string;
    resource?: string;
  };
}

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
    title: string;
    start_date: string;
    end_date: string;
    status: string;
    brand?: { name: string };
  }>;
}

const getStatusColor = (status: string): { bg: string; border: string } => {
  switch (status.toLowerCase()) {
    case 'draft':
      return { bg: '#E5E7EB', border: '#9CA3AF' };
    case 'pending_approval':
      return { bg: '#FEF3C7', border: '#F59E0B' };
    case 'approved':
      return { bg: '#D1FAE5', border: '#10B981' };
    case 'in_progress':
      return { bg: '#DBEAFE', border: '#3B82F6' };
    case 'review':
      return { bg: '#FEE2E2', border: '#EF4444' };
    case 'complete':
      return { bg: '#A7F3D0', border: '#059669' };
    case 'cancelled':
      return { bg: '#F3F4F6', border: '#6B7280' };
    default:
      return { bg: '#E5E7EB', border: '#9CA3AF' };
  }
};

const MarketingCalendar: React.FC<MarketingCalendarProps> = ({ briefs, campaigns = [] }) => {
  const events: CalendarEvent[] = [
    ...briefs.map(brief => ({
      id: `brief-${brief.id}`,
      title: brief.title,
      start: brief.start_date,
      end: brief.due_date,
      url: `/briefs/${brief.id}`,
      backgroundColor: getStatusColor(brief.status).bg,
      borderColor: getStatusColor(brief.status).border,
      extendedProps: {
        type: 'brief' as const,
        status: brief.status,
        brand: brief.brand?.name,
        resource: brief.resource?.name
      }
    })),
    ...campaigns.map(campaign => ({
      id: `campaign-${campaign.id}`,
      title: campaign.title,
      start: campaign.start_date,
      end: campaign.end_date,
      url: `/campaigns/${campaign.id}`,
      backgroundColor: '#FDF2F8',
      borderColor: '#EC4899',
      extendedProps: {
        type: 'campaign' as const,
        status: campaign.status,
        brand: campaign.brand?.name
      }
    }))
  ];

  const renderEventContent = (eventInfo: any) => {
    const { event } = eventInfo;
    return (
      <div className="p-1">
        <div className="font-semibold text-sm truncate">
          {event.extendedProps.type === 'campaign' ? '📅 ' : '📝 '}
          {event.title}
        </div>
        <div className="text-xs truncate text-gray-600">
          {event.extendedProps.brand && `${event.extendedProps.brand} • `}
          {event.extendedProps.type === 'brief' && event.extendedProps.resource && 
            `${event.extendedProps.resource} • `}
          {event.extendedProps.status.replace('_', ' ')}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek'
        }}
        events={events}
        eventContent={renderEventContent}
        height="auto"
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          if (info.event.url) {
            window.location.href = info.event.url;
          }
        }}
      />
    </div>
  );
};

export default MarketingCalendar; 