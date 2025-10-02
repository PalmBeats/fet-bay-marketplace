import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPrice } from '@/lib/utils'

interface AdminMetrics {
  total_sales: number
  total_orders: number
  recent_sales_30_days: number
  active_listings: number
  sold_listings: number
  total_users: number
  top_sellers: Array<{
    seller_id: string
    seller_email: string
    total_orders: number
    total_sales: number
    avg_sale_amount: number
  }>
}

export default function Admin() {
  console.log('=== ADMIN COMPONENT STARTED ===')
  const navigate = useNavigate()
  const { user, profile, isAdmin, loading: authLoading } = useAuth()
  
  console.log('Admin render - user:', user, 'profile:', profile, 'isAdmin:', isAdmin, 'authLoading:', authLoading)
  
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [banReason, setBanReason] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  useEffect(() => {
    console.log('Admin useEffect - authLoading:', authLoading, 'user:', user, 'profile:', profile, 'isAdmin:', isAdmin)
    
    if (authLoading) {
      console.log('Still loading auth...')
      return
    }

    if (!user) {
      console.log('No user - redirecting to auth')
      navigate('/auth')
      return
    }

    if (!profile) {
      console.log('No profile yet - waiting...')
      return
    }

    if (profile.role !== 'admin') {
      console.log('User is not admin - profile role:', profile.role, '- redirecting to home')
      navigate('/')
      return
    }

    console.log('User is admin - fetching admin data, profile role:', profile.role)
    fetchAdminData()
  }, [user, profile, authLoading, navigate])

  const fetchAdminData = async () => {
    try {
      console.log('fetchAdminData started')
      
      const usersResult = await supabase.from('profiles').select('*')
      const listingsResult = await supabase.from('listings').select('*')
      
      console.log('Users result:', usersResult.data?.length)
      console.log('Listings result:', listingsResult.data?.length)

      const simpleMetrics = {
        total_sales: 0,
        total_orders: 0,
        recent_sales_30_days: 0,
        active_listings: listingsResult.data?.length || 0,
        sold_listings: 0,
        total_users: usersResult.data?.length || 0,
        top_sellers: []
      }

      setMetrics(simpleMetrics)
      setUsers(usersResult.data || [])
      setListings(listingsResult.data || [])
      
      console.log('fetchAdminData completed')
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdminAction = async (action: string, targetId: string, reason?: string) => {
    if (!user) return

    setActionLoading(action)
    try {
      if (action === 'ban_user') {
        const { error } = await supabase
          .from('profiles')
          .update({ role: 'banned' })
          .eq('id', targetId)
        
        if (error) throw error
      } else if (action === 'unban_user') {
        const { error } = await supabase
          .from('profiles')
          .update({ role: 'user' })
          .eq('id', targetId)
        
        if (error) throw error
      } else if (action === 'hide_listing') {
        const { error } = await supabase
          .from('listings')
          .update({ status: 'hidden' })
          .eq('id', targetId)
        
        if (error) throw error
      } else if (action === 'unhide_listing') {
        const { error } = await supabase
          .from('listings')
          .update({ status: 'active' })
          .eq('id', targetId)
        
        if (error) throw error
      }

      alert('Action completed successfully')
      fetchAdminData()
    } catch (error) {
      console.error('Error performing admin action:', error)
      alert(`Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setActionLoading(null)
      setBanReason('')
      setSelectedUser(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading Admin Dashboard...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🔧 Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, listings, and view platform metrics
        </p>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_users}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.active_listings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_orders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(metrics.total_sales)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Users Management */}
        <Card>
          <CardHeader>
            <CardTitle>👥 Users Management</CardTitle>
            <CardDescription>
              Manage user accounts and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((userProfile) => (
                <div key={userProfile.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{userProfile.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Role: {userProfile.role} • Joined: {new Date(userProfile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {userProfile.role === 'banned' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdminAction('unban_user', userProfile.id)}
                        disabled={actionLoading === 'unban_user'}
                      >
                        {actionLoading === 'unban_user' ? 'Loading...' : 'Unban'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedUser(userProfile.id)
                        }}
                        disabled={actionLoading === 'ban_user'}
                      >
                        Ban
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Ban Reason Dialog */}
            {selectedUser && (
              <div className="mt-4 p-4 border rounded-lg bg-muted">
                <Label htmlFor="banReason">Ban Reason</Label>
                <Input
                  id="banReason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason for ban"
                  className="mt-2"
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() => handleAdminAction('ban_user', selectedUser, banReason)}
                    disabled={!banReason.trim() || actionLoading === 'ban_user'}
                  >
                    {actionLoading === 'ban_user' ? 'Loading...' : 'Confirm Ban'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(null)
                      setBanReason('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Listings Management */}
        <Card>
          <CardHeader>
            <CardTitle>📝 Listings Management</CardTitle>
            <CardDescription>
              Manage marketplace listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {listings.map((listing) => (
                <div key={listing.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{listing.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {listing.price_amount} {listing.currency} • Status: {listing.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {listing.status === 'hidden' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdminAction('unhide_listing', listing.id)}
                        disabled={actionLoading === 'unhide_listing'}
                      >
                        {actionLoading === 'unhide_listing' ? 'Loading...' : 'Unhide'}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAdminAction('hide_listing', listing.id)}
                        disabled={actionLoading === 'hide_listing'}
                      >
                        {actionLoading === 'hide_listing' ? 'Loading...' : 'Hide'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}