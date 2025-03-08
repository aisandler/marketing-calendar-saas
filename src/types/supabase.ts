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
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'internal' | 'agency' | 'freelancer'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'internal' | 'agency' | 'freelancer'
          created_at?: string
        }
      }
      briefs: {
        Row: {
          id: string
          title: string
          channel: string
          start_date: string
          due_date: string
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
      }
    }
  }
}
