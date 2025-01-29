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
      sms_templates: {
        Row: {
          id: string
          name: string
          content: string
          description: string | null
          variables: string[]
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          content: string
          description?: string | null
          variables?: string[]
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          content?: string
          description?: string | null
          variables?: string[]
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sms_batch_log: {
        Row: {
          id: string
          batch_id: string
          date_utc: string
          targets: string
          status: string | null
          message: string
          error: string | null
          variables: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          batch_id: string
          date_utc?: string
          targets: string
          status?: string | null
          message: string
          error?: string | null
          variables?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          batch_id?: string
          date_utc?: string
          targets?: string
          status?: string | null
          message?: string
          error?: string | null
          variables?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      sms_batches: {
        Row: {
          id: string
          name: string
          template_id: string | null
          status: string
          total_recipients: number
          completed_count: number
          failed_count: number
          external_batch_id: string | null
          scheduled_for: string | null
          completed_at: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          template_id?: string | null
          status: string
          total_recipients?: number
          completed_count?: number
          failed_count?: number
          external_batch_id?: string | null
          scheduled_for?: string | null
          completed_at?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          template_id?: string | null
          status?: string
          total_recipients?: number
          completed_count?: number
          failed_count?: number
          external_batch_id?: string | null
          scheduled_for?: string | null
          completed_at?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}