import { createClient } from '@supabase/supabase-js'
import { mockAuth } from './mockData'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Development mode - only use mock data when no real Supabase connection
const DEV_MODE = import.meta.env.DEV && (!supabaseUrl || !supabaseAnonKey) && import.meta.env.VITE_INDEV_MODE !== 'FALSE'

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
