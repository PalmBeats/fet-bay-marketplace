import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice } from '@/lib/utils'
import { Database } from '@/types/database.types'

type Listing = Database['public']['Tables']['listings']['Row']

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'created_at' | 'price_amount'>('created_at')

  useEffect(() => {
    fetchListings()
  }, [sortBy])

  const fetchListings = async () => {
    try {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order(sortBy, { ascending: sortBy === 'created_at' ? false : true })

      const { data, error } = await query

      if (error) {
        console.error('Error fetching listings:', error)
      } else {
        setListings(data || [])
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Fet-Bay Marketplace</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Find great deals on everything you need
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <Input
            placeholder="Search listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'created_at' | 'price_amount')}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="created_at">Newest First</option>
            <option value="price_amount">Price: Low to High</option>
          </select>
        </div>
      </div>

      {filteredListings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm ? 'No listings found matching your search.' : 'No active listings available.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden">
              {listing.images.length > 0 && (
                <div className="aspect-video bg-muted">
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="line-clamp-2">{listing.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {listing.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(listing.price_amount, listing.currency)}
                  </span>
                  <Button asChild>
                    <Link to={`/listing/${listing.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
