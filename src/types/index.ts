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

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  avatar_url: string | null;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  capacity_hours?: number; // Weekly capacity in hours (default 40)
  hourly_rate?: number; // Optional hourly rate for cost calculation
  media_type?: string; // Optional media type for categorization
  team_id?: string; // Reference to team
  team?: Team; // Optional team data
  created_at: string;
  updated_at?: string;
}

export interface Brief {
  id: string;
  title: string;
  status: BriefStatus;
  start_date: string;
  due_date: string;
  channel?: string;
  campaign_id?: string;
  brand_id: string;
  resource_id?: string;
  approver_id?: string;
  priority?: Priority;
  description?: string;
  specifications?: any;
  estimated_hours?: number;
  expenses?: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  resource?: {
    name: string;
  } | null;
}

export interface Tradeshow {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  description: string | null;
  created_at: string;
}

export interface History {
  id: string;
  brief_id: string;
  changed_by: string;
  previous_state: any;
  new_state: any;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  brand_id: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'complete' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
  brand?: Brand;
}
