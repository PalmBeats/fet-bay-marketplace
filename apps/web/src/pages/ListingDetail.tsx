import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDate } from '@/lib/utils'
import { Database } from '@/types/database.types'

type Listing = Database['public']['Tables']['listings']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isBanned } = useAuth()
  const [listing, setListing] = useState<Listing | null>(null)
  const [seller, setSeller] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchListing()
    }
  }, [id])

  const fetchListing = async () => {
    try {
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single()

      if (listingError) {
        console.error('Error fetching listing:', listingError)
        return
      }

      setListing(listingData)

      // Fetch seller profile
      const { data: sellerData, error: sellerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', listingData.seller_id)
        .single()

      if (sellerError) {
        console.error('Error fetching seller:', sellerError)
      } else {
        setSeller(sellerData)
      }
    } catch (error) {
      console.error('Error fetching listing:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBuy = () => {
    if (!user) {
      navigate('/auth')
      return
    }
    if (isBanned) {
      alert('Your account is banned. You cannot make purchases.')
      return
    }
    navigate(`/checkout/${id}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Listing not found</h1>
          <Button asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isOwner = user?.id === listing.seller_id

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          {listing.images.length > 0 ? (
            <div className="aspect-square bg-muted rounded-lg overflow-hidden">
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">No image available</span>
            </div>
          )}
          
          {listing.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {listing.images.slice(1).map((image, index) => (
                <div key={index} className="aspect-square bg-muted rounded overflow-hidden">
                  <img
                    src={image}
                    alt={`${listing.title} ${index + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
            <p className="text-2xl font-bold text-primary mb-4">
              {formatPrice(listing.price_amount, listing.currency)}
            </p>
            <p className="text-muted-foreground">
              Listed on {formatDate(listing.created_at)}
            </p>
          </div>

          {listing.description && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>
          )}

          {seller && (
            <Card>
              <CardHeader>
                <CardTitle>Seller Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Listed by: {seller.email}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {isOwner ? (
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-muted-foreground mb-2">This is your listing</p>
                <Button asChild variant="outline">
                  <Link to="/account">Manage Listings</Link>
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  onClick={handleBuy} 
                  className="w-full py-6 text-lg font-[Playfair Display] neon-border sensual-glow hover:bg-[hsl(var(--crimson-glow))]" 
                  size="lg"
                  disabled={listing.status !== 'active'}
                >
                  {listing.status === 'active' ? 'Buy Now - Complete Purchase' : 'Sold Out'}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  Secure checkout powered by Stripe
                </div>
              </>
            )}
            
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Back to Marketplace</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
