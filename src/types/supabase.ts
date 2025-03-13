export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string | null
        }
      },
      campaigns: {
        Row: {
          id: string
          name: string
          description: string | null
          brand_id: string
          start_date: string
          end_date: string
          status: 'draft' | 'active' | 'complete' | 'cancelled'
          created_by: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          brand_id: string
          start_date: string
          end_date: string
          status?: 'draft' | 'active' | 'complete' | 'cancelled'
          created_by: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          brand_id?: string
          start_date?: string
          end_date?: string
          status?: 'draft' | 'active' | 'complete' | 'cancelled'
          created_by?: string
          created_at?: string
          updated_at?: string | null
        }
      },
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'admin' | 'manager' | 'contributor'
          created_at: string
          avatar_url: string | null
        }
        Insert: {
          id: string
          name: string
          email: string
          role: 'admin' | 'manager' | 'contributor'
          created_at?: string
          avatar_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'admin' | 'manager' | 'contributor'
          created_at?: string
          avatar_url?: string | null
        }
      }
      resources: {
        Row: {
          id: string
          name: string
          type: 'internal' | 'agency' | 'freelancer'
          capacity_hours: number | null
          hourly_rate: number | null
          media_type: string | null
          team_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          type: 'internal' | 'agency' | 'freelancer'
          capacity_hours?: number | null
          hourly_rate?: number | null
          media_type?: string | null
          team_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: 'internal' | 'agency' | 'freelancer'
          capacity_hours?: number | null
          hourly_rate?: number | null
          media_type?: string | null
          team_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      briefs: {
        Row: {
          id: string
          title: string
          channel: string
          start_date: string
          due_date: string
          campaign_id: string | null
          brand_id: string
          resource_id: string | null
          approver_id: string | null
          status: 'draft' | 'pending_approval' | 'approved' | 'in_progress' | 'review' | 'complete' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          description: string | null
          specifications: Json | null
          estimated_hours: number | null
          expenses: number | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          channel: string
          start_date: string
          due_date: string
          campaign_id?: string | null
          brand_id: string
          resource_id?: string | null
          approver_id?: string | null
          status?: 'draft' | 'pending_approval' | 'approved' | 'in_progress' | 'review' | 'complete' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          description?: string | null
          specifications?: Json | null
          estimated_hours?: number | null
          expenses?: number | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          channel?: string
          start_date?: string
          due_date?: string
          campaign_id?: string | null
          brand_id?: string
          resource_id?: string | null
          approver_id?: string | null
          status?: 'draft' | 'pending_approval' | 'approved' | 'in_progress' | 'review' | 'complete' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          description?: string | null
          specifications?: Json | null
          estimated_hours?: number | null
          expenses?: number | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      tradeshows: {
        Row: {
          id: string
          name: string
          start_date: string
          end_date: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          start_date: string
          end_date: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_date?: string
          end_date?: string
          description?: string | null
          created_at?: string
        }
      }
      history: {
        Row: {
          id: string
          brief_id: string
          changed_by: string
          previous_state: Json
          new_state: Json
          created_at: string
        }
        Insert: {
          id?: string
          brief_id: string
          changed_by: string
          previous_state: Json
          new_state: Json
          created_at?: string
        }
        Update: {
          id?: string
          brief_id?: string
          changed_by?: string
          previous_state?: Json
          new_state?: Json
          created_at?: string
        }
      },
      teams: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
    }
  }
}
