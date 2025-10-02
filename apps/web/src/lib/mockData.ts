import { Database } from '@/types/database.types'

export type MockListing = Database['public']['Tables']['listings']['Row']
export type MockProfile = Database['public']['Tables']['profiles']['Row']
export type MockUser = {
  id: string
  email: string
  created_at: string
}

// Mock data for development
export const mockListings: MockListing[] = [
  {
    id: '1',
    seller_id: '2',
    title: 'Vintage Læderjakke',
    description: 'Smuk vintage læderjakke i størrelse M. Perfekt til efteråret.',
    price_amount: 150000,
    currency: 'DKK',
    images: [
      'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400',
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400'
    ],
    status: 'active',
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    seller_id: '3',
    title: 'Gaming Headset',
    description: 'Professionelt gaming headset med mikrofon. Kun brugt få gange.',
    price_amount: 80000,
    currency: 'DKK',
    images: ['https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=400'],
    status: 'active',
    created_at: '2024-01-02T14:30:00Z'
  },
  {
    id: '3',
    seller_id: '2',
    title: 'Clean Code Bog',
    description: 'Robert C. Martins klassiker om ren kode. Paperback udgave.',
    price_amount: 25000,
    currency: 'DKK',
    images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400'],
    status: 'active',
    created_at: '2024-01-03T09:15:00Z'
  },
  {
    id: '4',
    seller_id: '3',
    title: 'Køkkenkniv Sæt',
    description: 'Professionelt knivsæt med 6 knive og skærebræt.',
    price_amount: 450000,
    currency: 'DKK',
    images: [
      'https://images.unsplash.com/photo-1612342268961-81cdfed4a14f?w=400'
    ],
    status: 'active',
    created_at: '2024-01-04T16:45:00Z'
  },
  {
    id: '5',
    seller_id: '2',
    title: 'Cykel',
    description: 'Mountain bike i good stand. Perfekt til terrænkørsel.',
    price_amount: 320000,
    currency: 'DKK',
    images: [
      'https://images.unsplash.com/photo-1558618047-5dd23c7aa3b0?w=400',
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400'
    ],
    status: 'sold',
    created_at: '2024-01-05T12:20:00Z'
  }
]

export const mockProfiles: MockProfile[] = [
  {
    id: '1',
    email: 'admin@test.com',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    email: 'seller1@test.com',
    role: 'user',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    email: 'seller2@test.com',
    role: 'user',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    email: 'buyer@test.com',
    role: 'user',
    created_at: '2024-01-01T00:00:00Z'
  }
]

export const mockUser: MockUser = {
  id: '4',
  email: 'buyer@test.com',
  created_at: '2024-01-01T00:00:00Z'
}

export const mockAuth = {
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    // Accept multiple secure login combinations
    const validLogins = [
      { email: 'admin@test.com', password: 'admin123' },
      { email: 'admin@test.com', password: 'password123' },
      { email: 'admin@test.com', password: 'test2024' },
      { email: 'seller1@test.com', password: 'seller123' },
      { email: 'buyer@test.com', password: 'buyer123' }
    ]
    
    const isValidLogin = validLogins.some(login => 
      login.email === email && login.password === password
    )
    
    if (isValidLogin) {
      return {
        data: {
          session: {
            user: { ...mockUser, email },
            access_token: 'mock-token'
          }
        },
        error: null
      }
    }
    return {
      data: { session: null },
      error: { message: 'Invalid credentials' }
    }
  },
  
  async signUp({ email, password }: { email: string; password: string }) {
    if (password.length < 6) {
      return {
        data: { user: null },
        error: { message: 'Password must be at least 6 characters' }
      }
    }
    return {
      data: {
        user: {
          id: 'new-user-id',
          email,
          created_at: new Date().toISOString()
        }
      },
      error: null
    }
  },
  
  async signOut() {
    return { error: null }
  },
  
  async getSession() {
    return {
      data: { 
        session: {
          user: mockUser,
          access_token: 'mock-token'
        }
      },
      error: null
    }
  },
  
  onAuthStateChange(callback: (event: string, session: any) => void) {
    const fakeSubscription = {
      unsubscribe: () => {}
    }
    return { data: { subscription: fakeSubscription } }
  }
}