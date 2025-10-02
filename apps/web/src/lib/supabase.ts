import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Development mode - use mock data when Supabase is not available
const DEV_MODE = import.meta.env.DEV && (!supabaseUrl || supabaseUrl.includes('localhost:54321'))

if (!DEV_MODE && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = DEV_MODE 
  ? createClient(
      'https://fake.supabase.co', // Dummy URL 
      'fake-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    )
  : createClient(supabaseUrl!, supabaseAnonKey!)

// Development mode flag
export const isDevMode = DEV_MODE
