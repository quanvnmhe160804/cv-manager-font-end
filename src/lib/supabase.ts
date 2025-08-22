import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Candidate {
  id: string
  user_id: string
  full_name: string
  applied_position: string
  status: 'New' | 'Interviewing' | 'Hired' | 'Rejected'
  resume_url: string
  created_at: string
}

export interface CreateCandidateData {
  full_name: string
  applied_position: string
  status: 'New' | 'Interviewing' | 'Hired' | 'Rejected'
  resume_url: string
}
