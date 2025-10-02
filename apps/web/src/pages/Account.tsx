import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDate } from '@/lib/utils'
import { Database } from '@/types/database.types'

type Listing = Database['public']['Tables']['listings']['Row']
type Order = Database['public']['Tables']['orders']['Row'] & {
  listings: Listing
  shipping_addresses: Database['public']['Tables']['shipping_addresses']['Row'] | null
}
type ConnectAccount = Database['public']['Tables']['connect_accounts']['Row']

export default function Account() {
  const navigate = useNavigate()
  const { user, isBanned, loading: authLoading } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [connectAccount, setConnectAccount] = useState<ConnectAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [creatingConnectLink, setCreatingConnectLink] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    console.log('Account useEffect - user:', user?.id, 'authLoading:', authLoading)
    
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('Account: Auth still loading, waiting...')
      return
    }
    
    // Auth finished loading
    if (!user) {
      console.log('Account: No user after auth load, redirecting to auth')
      navigate('/auth')
      return
    }

    console.log('Account: User found, fetching data')
    fetchAccountData()
  }, [user, authLoading, navigate])

  const fetchAccountData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Fetch user's listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (listingsError) {
        console.error('Error fetching listings:', listingsError)
      } else {
        setListings(listingsData || [])
      }

      // Fetch user's orders (as buyer)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          listings (*),
          shipping_addresses (*)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })

      if (ordersError) {
        console.error('Error fetching orders:', ordersError)
      } else {
        setOrders(ordersData || [])
      }

      // Fetch connect account
      const { data: connectData, error: connectError } = await supabase
        .from('connect_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (connectError && connectError.code !== 'PGRST116') {
        console.error('Error fetching connect account:', connectError)
      } else {
        setConnectAccount(connectData)
      }
    } catch (error) {
      console.error('Error fetching account data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateConnectLink = async () => {
    if (!user) return

    setCreatingConnectLink(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/auth')
        return
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      console.log('Creating connect link with token:', session.access_token ? 'present' : 'missing')
      console.log('Function URL:', `${supabaseUrl}/functions/v1/create-connect-link`)
      
      const response = await fetch(`${supabaseUrl}/functions/v1/create-connect-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          return_url: window.location.origin + '/account'
        })
      })
      
      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      const result = await response.json()
      console.log('Response result:', result)

      if (!response.ok) {
        console.error('Full error response:', result)
        throw new Error(result.error || 'Failed to create connect link')
      }

      // Redirect to Stripe onboarding
      window.location.href = result.url
    } catch (error) {
      console.error('Error creating connect link:', error)
      alert('Failed to create payment setup link. Please try again.')
    } finally {
      setCreatingConnectLink(false)
    }
  }

  const handleDeleteListing = async (listingId: string) => {
    if (!user) return

    const confirmed = confirm('Are you sure you want to delete this listing? This action cannot be undone.')
    if (!confirmed) return

    setDeletingId(listingId)
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)
        .eq('seller_id', user.id) // Security: only delete own listings

      if (error) {
        throw error
      }

      // Remove from local state
      setListings(prev => prev.filter(listing => listing.id !== listingId))
      alert('Listing deleted successfully!')
    } catch (error) {
      console.error('Error deleting listing:', error)
      alert('Failed to delete listing. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Account</h1>
        <p className="text-muted-foreground">
          Manage your listings, orders, and payment settings
        </p>
      </div>

      {isBanned && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-destructive mb-2">Account Banned</h2>
              <p className="text-muted-foreground">
                Your account has been banned. You cannot create new listings or make purchases.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Setup</CardTitle>
            <CardDescription>
              Set up your payment account to receive payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connectAccount ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Status:</span>
                  <span className={`text-sm font-medium ${
                    connectAccount.charges_enabled ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {connectAccount.charges_enabled ? 'Ready to receive payments' : 'Setup required'}
                  </span>
                </div>
                {!connectAccount.charges_enabled && (
                  <Button onClick={handleCreateConnectLink} disabled={creatingConnectLink}>
                    {creatingConnectLink ? 'Loading...' : 'Complete Setup'}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You need to set up a payment account to receive payments from buyers.
                </p>
                <Button onClick={handleCreateConnectLink} disabled={creatingConnectLink}>
                  {creatingConnectLink ? 'Loading...' : 'Set Up Payments'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common actions for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link to="/sell">Create New Listing</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Browse Listings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* My Listings */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>My Listings</CardTitle>
          <CardDescription>
            Items you have listed for sale
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">You haven't created any listings yet.</p>
              <Button asChild>
                <Link to="/sell">Create Your First Listing</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => (
                <div key={listing.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{listing.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(listing.price_amount, listing.currency)} • {formatDate(listing.created_at)}
                    </p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      listing.status === 'active' ? 'bg-green-100 text-green-800' :
                      listing.status === 'sold' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {listing.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/listing/${listing.id}`}>View</Link>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteListing(listing.id)}
                      disabled={deletingId === listing.id}
                    >
                      {deletingId === listing.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Orders */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>My Orders</CardTitle>
          <CardDescription>
            Items you have purchased
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">You haven't made any purchases yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{order.listings.title}</h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      order.status === 'paid' ? 'bg-green-100 text-green-800' :
                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'refunded' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(order.amount, order.currency)} • {formatDate(order.created_at)}
                  </p>
                  {order.shipping_addresses && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Shipping to: {order.shipping_addresses.name}, {order.shipping_addresses.city}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seller Orders (orders for my listings) */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Orders for My Listings</CardTitle>
          <CardDescription>
            Orders placed on items you're selling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              This feature will show orders placed on your listings with buyer shipping addresses.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
