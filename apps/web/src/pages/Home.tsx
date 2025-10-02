import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, isDevMode } from '@/lib/supabase'
import { mockListings } from '@/lib/mockData'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils'
import { Database } from '@/types/database.types'
import { useAuth } from '@/hooks/useAuth'

type Listing = Database['public']['Tables']['listings']['Row']

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'created_at' | 'price_amount'>('created_at')

  useEffect(() => {
    fetchListings()
  }, [sortBy])

  const fetchListings = async () => {
    try {
      if (isDevMode) {
        const filteredListings = mockListings.filter(listing => listing.status === 'active')
        setListings(filteredListings)
      } else {
        let query = supabase
          .from('listings')
          .select('*')
          .eq('status', 'active')
          .order(sortBy, { ascending: sortBy === 'created_at' ? false : true })

        const { data, error } = await query

        if (error) console.error('Error fetching listings:', error)
        else setListings(data || [])
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
      if (isDevMode) {
        const filteredListings = mockListings.filter(listing => listing.status === 'active')
        setListings(filteredListings)
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredListings = listings.filter(
    (listing) =>
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="container mx-auto px-4 py-8"><div className="text-center">Loading...</div></div>

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="pt-16 pb-16 text-center ambient-glow">
            <h1 className="text-6xl font-bold mb-4 font-[Playfair Display] sensual-glow-text bg-gradient-to-r from-white via-[hsl(var(--crimson-glow))] to-[hsl(var(--neon-glow))] bg-clip-text text-transparent">
              Fet-Bay Marketplace
            </h1>
            <p className="text-xl text-muted-foreground mb-8 font-light">Discover exquisite treasures in an intimate marketplace</p>
            <div className="mx-auto max-w-sm mb-16">
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Search listings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'created_at' | 'price_amount')}
                  className="px-3 py-2 rounded-md bg-input border-border border"
                >
                  <option value="created_at">Newest First</option>
                  <option value="price_amount">Price: Low to High</option>
                </select>
              </div>
            </div>
            <div className="flex justify-center gap-6">
              <Button size="lg" className="pr-10 pl-10 py-6 text-lg font-[Playfair Display] neon-border sensual-glow">
                Explore Collection
              </Button>
              <Link to="/sell">
                <Button variant="outline" size="lg" className="pr-10 pl-10 py-6 text-lg font-[Playfair Display] border-[hsl(var(--crimson-glow))] hover:bg-[hsl(var(--crimson-glow))] hover:text-white sensory-hover">
                  Become a Vendor
                </Button>
              </Link>
            </div>
          </div>
          {filteredListings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? 'No listings found matching your search.' : 'No active listings available.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredListings.map((listing) => (
                <Card key={listing.id} className="overflow-hidden silky-card sensual-hover ambient-glow">
                  {listing.images.length > 0 && (
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"/>
                      <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--burgundy-deeper))] via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"/>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{listing.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{listing.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">{formatPrice(listing.price_amount, listing.currency)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            console.log('Home Buy Now clicked - user:', user?.id, 'user exists:', !!user)
                            if (!user) {
                              console.log('No user - redirecting to auth')
                              navigate('/auth')
                              return
                            }
                            console.log('Navigating to checkout:', listing.id)
                            navigate(`/checkout/${listing.id}`)
                          }}
                          className="flex-1 neon-border hover:bg-[hsl(var(--crimson-glow))] sensual-glow"
                        >
                          {user ? 'Buy Now' : 'Sign In to Buy'}
                        </Button>
                        <Button 
                          asChild 
                          variant="outline" 
                          className="flex-1 border-[hsl(var(--crimson-glow))] hover:bg-[hsl(var(--crimson-glow))] hover:text-white"
                        >
                          <Link to={`/listing/${listing.id}`}>Details</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
