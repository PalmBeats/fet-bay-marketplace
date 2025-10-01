import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '../useAuth'
import { supabase } from '@/lib/supabase'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return loading state initially', () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })

    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBe(null)
    expect(result.current.profile).toBe(null)
  })

  it('should handle authenticated user', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    const mockProfile = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'user' as const,
      created_at: '2024-01-01T00:00:00Z',
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    })

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })

    const mockSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      })),
    }))

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    } as any)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.profile).toEqual(mockProfile)
    expect(result.current.isBanned).toBe(false)
    expect(result.current.isAdmin).toBe(false)
  })

  it('should handle banned user', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
    }

    const mockProfile = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'banned' as const,
      created_at: '2024-01-01T00:00:00Z',
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    })

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })

    const mockSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      })),
    }))

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    } as any)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isBanned).toBe(true)
    expect(result.current.isAdmin).toBe(false)
  })

  it('should handle admin user', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@example.com',
    }

    const mockProfile = {
      id: 'user-123',
      email: 'admin@example.com',
      role: 'admin' as const,
      created_at: '2024-01-01T00:00:00Z',
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    })

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    })

    const mockSelect = jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      })),
    }))

    mockSupabase.from.mockReturnValue({
      select: mockSelect,
    } as any)

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isBanned).toBe(false)
    expect(result.current.isAdmin).toBe(true)
  })
})
