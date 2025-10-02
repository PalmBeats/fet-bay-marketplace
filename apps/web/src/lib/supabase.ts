import { createClient } from '@supabase/supabase-js'
import { mockAuth } from './mockData'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Development mode - use mock data for local development
const DEV_MODE = import.meta.env.DEV

if (!DEV_MODE && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = DEV_MODE 
  ? ({
      ...createClient('https://fake.supabase.co', 'fake-key'),
      auth: mockAuth
    } as any)
  : createClient(supabaseUrl!, supabaseAnonKey!)

// Development mode flag
export const isDevMode = DEV_MODE
