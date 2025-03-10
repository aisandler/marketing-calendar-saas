export type UserRole = 'admin' | 'manager' | 'contributor';

export type BriefStatus = 
  | 'draft' 
  | 'pending_approval' 
  | 'approved' 
  | 'in_progress' 
  | 'review' 
  | 'complete' 
  | 'cancelled';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ResourceType = 'internal' | 'agency' | 'freelancer';

export type CampaignType = 'tradeshow' | 'product_launch' | 'seasonal_promotion' | 'digital_campaign' | 'event' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  avatar_url: string | null;
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  created_at: string;
}

export interface Brief {
  id: string;
  title: string;
  channel: string;
  start_date: string;
  due_date: string;
  resource_id: string | null;
  approver_id: string | null;
  campaign_id: string | null;
  status: BriefStatus;
  priority: Priority;
  description: string | null;
  specifications: any | null;
  estimated_hours: number | null;
  expenses: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  campaign_type: CampaignType;
  start_date: string;
  end_date: string;
  location: string | null;
  description: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface History {
  id: string;
  brief_id: string;
  changed_by: string;
  previous_state: any;
  new_state: any;
  created_at: string;
}
