import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPrice } from '@/lib/utils'
import { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Listing = Database['public']['Tables']['listings']['Row']

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
  const navigate = useNavigate()
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [banReason, setBanReason] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      navigate('/auth')
      return
    }

    if (!isAdmin) {
      navigate('/')
      return
    }

    fetchAdminData()
  }, [user, isAdmin, authLoading, navigate])

  const fetchAdminData = async () => {
    try {
      // Fetch metrics
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const metricsResponse = await fetch('/functions/v1/admin-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'metrics' }),
      })

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json()
        setMetrics(metricsData)
      }

      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('Error fetching users:', usersError)
      } else {
        setUsers(usersData || [])
      }

      // Fetch listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })

      if (listingsError) {
        console.error('Error fetching listings:', listingsError)
      } else {
        setListings(listingsData || [])
      }
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/functions/v1/admin-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action,
          user_id: action.includes('user') ? targetId : undefined,
          listing_id: action.includes('listing') ? targetId : undefined,
          reason,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Action failed')
      }

      alert('Action completed successfully')
      fetchAdminData() // Refresh data
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
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, listings, and view platform metrics
        </p>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(metrics.total_sales)}</div>
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
              <CardTitle className="text-sm font-medium">Sales (30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(metrics.recent_sales_30_days)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_users}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Users Management */}
        <Card>
          <CardHeader>
            <CardTitle>Users Management</CardTitle>
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
            <CardTitle>Listings Management</CardTitle>
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
                      {formatPrice(listing.price_amount, listing.currency)} • Status: {listing.status}
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

      {/* Top Sellers */}
      {metrics && metrics.top_sellers.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Top Sellers</CardTitle>
            <CardDescription>
              Best performing sellers on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.top_sellers.map((seller, index) => (
                <div key={seller.seller_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">#{index + 1} {seller.seller_email}</p>
                    <p className="text-sm text-muted-foreground">
                      {seller.total_orders} orders • {formatPrice(seller.total_sales)} total sales
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(seller.avg_sale_amount)}</p>
                    <p className="text-sm text-muted-foreground">avg. sale</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
