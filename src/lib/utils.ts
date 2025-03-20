import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function calculateResourceAllocation(
  briefs: any[],
  resourceId: string,
  startDate: string,
  endDate: string
): number {
  // Filter briefs by resource and date range
  const relevantBriefs = briefs.filter(
    (brief) => 
      brief.resource_id === resourceId &&
      new Date(brief.due_date) >= new Date(startDate) &&
      new Date(brief.start_date) <= new Date(endDate)
  );

  // Calculate total estimated hours
  return relevantBriefs.reduce((total, brief) => 
    total + (brief.estimated_hours || 0), 0);
}

export function isResourceOverallocated(
  briefs: any[],
  resourceId: string,
  startDate: string,
  endDate: string,
  threshold = 40 // Default weekly threshold
): boolean {
  const totalHours = calculateResourceAllocation(
    briefs, resourceId, startDate, endDate
  );
  
  // Calculate weeks between dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const weeks = Math.ceil(days / 7);
  
  // Check if hours exceed threshold
  return totalHours > (threshold * weeks);
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'low':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-blue-100 text-blue-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'urgent':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
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
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get a color based on the channel/media type
 */
export const getChannelColor = (channel: string | null): string => {
  if (!channel) return '#e5e7eb'; // Default gray
  
  const channelLower = channel.toLowerCase();
  
  if (channelLower.includes('website') || channelLower.includes('web')) {
    return '#3b82f6'; // blue-500
  } else if (channelLower.includes('video') || channelLower.includes('youtube')) {
    return '#ef4444'; // red-500
  } else if (channelLower.includes('email')) {
    return '#f59e0b'; // amber-500
  } else if (channelLower.includes('social') || channelLower.includes('media')) {
    return '#10b981'; // emerald-500
  } else if (channelLower.includes('print')) {
    return '#6366f1'; // indigo-500
  } else if (channelLower.includes('design')) {
    return '#ec4899'; // pink-500
  } else if (channelLower.includes('instagram')) {
    return '#d946ef'; // fuchsia-500
  } else if (channelLower.includes('facebook')) {
    return '#2563eb'; // blue-600
  } else if (channelLower.includes('linkedin')) {
    return '#1d4ed8'; // blue-700
  } else if (channelLower.includes('twitter')) {
    return '#60a5fa'; // blue-400
  } else if (channelLower.includes('blog')) {
    return '#0ea5e9'; // sky-500
  } else if (channelLower.includes('podcast')) {
    return '#7c3aed'; // violet-600
  }
  
  return '#6b7280'; // Default gray-500
};

/**
 * Calculate a progress percentage based on the brief status
 */
export const getProgressPercentage = (status: string): number => {
  const statusMap: {[key: string]: number} = {
    'draft': 10,
    'pending_approval': 25,
    'approved': 40,
    'in_progress': 60,
    'review': 80,
    'complete': 100,
    'cancelled': 0
  };
  
  return statusMap[status] || 0;
};

/**
 * Calculate days remaining until due date
 */
export const getDaysRemaining = (dueDate: string | Date): string => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'}`;
  } else if (diffDays === 0) {
    return 'Due today';
  } else if (diffDays === 1) {
    return 'Due tomorrow';
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else {
    return `Due in ${Math.floor(diffDays / 7)} ${Math.floor(diffDays / 7) === 1 ? 'week' : 'weeks'}`;
  }
};
