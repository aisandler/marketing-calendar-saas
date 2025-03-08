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
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
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
