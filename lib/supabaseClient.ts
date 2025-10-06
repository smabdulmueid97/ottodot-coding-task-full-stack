import { createClient } from '@supabase/supabase-js'

export type Database = {
  public: {
    Tables: {
      math_problem_sessions: {
        Row: {
          id: string
          created_at: string
          problem_text: string
          final_answer: number
        }
        Insert: {
          id?: string
          created_at?: string
          problem_text: string
          final_answer: number
        }
        Update: {
          id?: string
          created_at?: string
          problem_text?: string
          final_answer?: number
        }
        Relationships: []
      }
      math_problem_submissions: {
        Row: {
          id: string
          created_at: string
          session_id: string
          user_answer: number
          is_correct: boolean
          feedback: string
        }
        Insert: {
          id?: string
          created_at?: string
          session_id: string
          user_answer: number
          is_correct: boolean
          feedback: string
        }
        Update: {
          id?: string
          created_at?: string
          session_id?: string
          user_answer?: number
          is_correct?: boolean
          feedback?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
