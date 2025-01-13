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
      token_holders: {
        Row: {
          id: string
          wallet_address: string
          token_amount: number
          percentage: number
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          token_amount: number
          percentage: number
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          token_amount?: number
          percentage?: number
          last_updated?: string
          created_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}