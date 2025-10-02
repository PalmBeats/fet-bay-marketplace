import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, isDevMode } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import { mockAuth, mockUser, mockProfiles } from '@/lib/mockData'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDevMode) {
      // Development mode - simulate a logged-in user
      setUser(mockUser as User)
      setProfile(mockProfiles[0])
      setLoading(false)
      return
    }

    console.log('Starting auth initialization...')

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Session:', session?.user?.id)
      setUser(session?.user ?? null)
      if (session?.user) {
        console.log('Initial session - setting user:', session.user.id)
        // Immediate profile creation for UI responsiveness
        const tempProfile = {
          id: session.user.id,
          email: session.user.email || 'user@example.com',
          role: 'user' as const,
          created_at: new Date().toISOString()
        } as Profile

        setProfile(tempProfile)
        setLoading(false)

        // Try to fetch real profile (don't wait)
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data: realProfile }) => {
            if (realProfile) {
              setProfile(realProfile)
            }
          })
          .catch(() => {
            // Ignore errors - keep temp profile
          })
      } else {
        setLoading(false)
      }
    }).catch((error) => {
      console.error('Error getting session:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)
      setUser(session?.user ?? null)
      if (session?.user) {
        console.log('Setting user state to:', session.user.id)
        
        // Immediate profile creation
        const tempProfile = {
          id: session.user.id,
          email: session.user.email || 'user@example.com',
          role: 'user' as const,
          created_at: new Date().toISOString()
        } as Profile

        console.log('Setting profile state to:', tempProfile.id)
        setProfile(tempProfile)
        setLoading(false)

        // Try to fetch real profile
        supabase.from('profiles').select('*').eq('id', session.user.id).single()
          .then(({ data: realProfile }) => {
            if (realProfile) {
              console.log('Updated with real profile:', realProfile.id)
              setProfile(realProfile)
            }
          })
          .catch(() => {
            // Ignore errors - keep temp profile
          })
      } else {
        console.log('No session, clearing state')
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (isDevMode) {
      const result = await mockAuth.signInWithPassword({ email, password })
      if (result.data.session) {
        setUser(result.data.session.user as User)
        setProfile(mockProfiles[0])
      }
      return result
    }

    const result = await supabase.auth.signInWithPassword({ email, password })
    if (result.data.user) {
      // Immediate profile creation
      const tempProfile = {
        id: result.data.user.id,
        email: result.data.user.email || 'user@example.com',
        role: 'user' as const,
        created_at: new Date().toISOString()
      } as Profile

      setUser(result.data.user as User)
      setProfile(tempProfile)

      // Try to fetch real profile
      supabase.from('profiles').select('*').eq('id', result.data.user.id).single()
        .then(({ data: realProfile }) => {
          if (realProfile) {
            setProfile(realProfile)
          }
        })
        .catch(() => {
          // Ignore errors
        })
    }
    return result
  }

  const signUp = async (email: string, password: string) => {
    if (isDevMode) {
      const result = await mockAuth.signUp({ email, password })
      if (result.data.user) {
        setUser(result.data.user as User)
        setProfile(mockProfiles[0])
      }
      return result
    }

    const result = await supabase.auth.signUp({ email, password })
    if (result.data.user) {
      // Immediate profile creation
      const tempProfile = {
        id: result.data.user.id,
        email: result.data.user.email || 'user@example.com',
        role: 'user' as const,
        created_at: new Date().toISOString()
      } as Profile

      setUser(result.data.user as User)
      setProfile(tempProfile)
    }
    return result
  }

  const signOut = async () => {
    if (isDevMode) {
      await mockAuth.signOut()
      setUser(null)
      setProfile(null)
    } else {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    }
  }

  const isBanned = profile?.role === 'banned'
  const isAdmin = profile?.role === 'admin'

  return {
    user,
    profile,
    loading,
    isBanned,
    isAdmin,
    signIn,
    signUp,
    signOut,
  }
}