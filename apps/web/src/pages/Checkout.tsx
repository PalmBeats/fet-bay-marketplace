import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatPrice } from '@/lib/utils'
import { Database } from '@/types/database.types'

type Listing = Database['public']['Tables']['listings']['Row']

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

interface ShippingFormData {
  name: string
  line1: string
  line2: string
  postal_code: string
  city: string
  country: string
}

function CheckoutForm({ listing }: { listing: Listing }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState('')
  const [formData, setFormData] = useState<ShippingFormData>({
    name: '',
    line1: '',
    line2: '',
    postal_code: '',
    city: '',
    country: 'Danmark'
  })

  useEffect(() => {
    if (listing) {
      createPaymentIntent()
    }
  }, [listing])

  const createPaymentIntent = async () => {
    console.log('=== CREATE PAYMENT INTENT DEBUG ===')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Session for payment intent:', session?.user?.id, 'session exists:', !!session)
      
      if (!session) {
        console.error('❌ No session available in createPaymentIntent')
        alert('Session expired. Please log in again.')
        navigate('/auth')
        return
      }

      console.log('✅ Session exists, creating payment intent for listing:', listing.id)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          listing_id: listing.id,
          shipping_address: formData,
        }),
      })

      console.log('Payment intent response status:', response.status)
      const result = await response.json()
      console.log('Payment intent result:', result)

      if (!response.ok) {
        if (result.needs_onboarding) {
          console.log('❌ Seller needs Stripe onboarding')
          alert(`⚠️ Seller Payment Setup Required\n\nThis seller hasn't completed their payment account setup yet.\n\nPlease contact the seller to complete Stripe onboarding before purchasing.\n\nYou'll be redirected to the marketplace.`)
          navigate('/')
          return
        }
        console.error('❌ Payment intent creation failed:', result.error)
        throw new Error(result.error || 'Failed to create payment intent')
      }

      console.log('✅ Payment intent created successfully')
      setClientSecret(result.client_secret)
    } catch (error) {
      console.error('Error creating payment intent:', error)
      alert('Failed to initialize payment. Please try again.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements || !clientSecret) {
      return
    }

    setLoading(true)

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: formData.name,
            address: {
              line1: formData.line1,
              line2: formData.line2 || undefined,
              postal_code: formData.postal_code,
              city: formData.city,
              country: formData.country,
            },
          },
        },
      })

      if (error) {
        console.error('Payment failed:', error)
        alert(`Payment failed: ${error.message}`)
      } else if (paymentIntent.status === 'succeeded') {
        alert('Payment successful! You will receive a confirmation email.')
        navigate('/account')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ShippingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shipping Address</CardTitle>
          <CardDescription>
            Enter your shipping address for delivery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="line1">Address Line 1</Label>
            <Input
              id="line1"
              value={formData.line1}
              onChange={(e) => handleInputChange('line1', e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="line2">Address Line 2 (Optional)</Label>
            <Input
              id="line2"
              value={formData.line2}
              onChange={(e) => handleInputChange('line2', e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>
            Enter your card details to complete the purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-md">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#ffffff',
                    backgroundColor: 'transparent',
                    '::placeholder': {
                      color: '#9ca3af',
                    },
                    ':focus': {
                      color: 'hsl(var(--crimson-glow))',
                    },
                  },
                  invalid: {
                    color: '#ff6b6b',
                    iconColor: '#ff6b6b',
                  },
                },
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div className="text-2xl font-bold">
          Total: {formatPrice(listing.price_amount, listing.currency)}
        </div>
        <Button 
          type="submit" 
          disabled={!stripe || !clientSecret || loading}
          className="px-12 py-6 text-lg font-[Playfair Display] neon-border sensual-glow hover:bg-[hsl(var(--crimson-glow))]"
        >
          {loading ? 'Processing Payment...' : 'Complete Purchase'}
        </Button>
      </div>
    </form>
  )
}

export default function Checkout() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isBanned, loading: authLoading } = useAuth()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    console.log('=== CHECKOUT DEBUG ===')
    console.log('Checkout useEffect - user:', user?.id, 'user exists:', !!user, 'authLoading:', authLoading)
    console.log('isBanned:', isBanned)
    console.log('listing id:', id)
    
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...')
      return
    }
    
    if (!user) {
      console.log('❌ No user found in Checkout - redirecting to auth')
      navigate('/auth')
      return
    }
    
    if (isBanned) {
      console.log('❌ User is banned')
      alert('Your account is banned. You cannot make purchases.')
      navigate('/')
      return
    }

    if (id) {
      console.log('✅ User exists, fetching listing for id:', id)
      fetchListing()
    } else {
      console.log('❌ Invalid checkout URL - missing listing id')
    }
  }, [id, user, isBanned, navigate, authLoading])

  const fetchListing = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('status', 'active')
        .single()

      if (error) {
        console.error('Error fetching listing:', error)
        navigate('/')
        return
      }

      if (data.seller_id === user?.id) {
        alert('You cannot buy your own listing')
        navigate('/')
        return
      }

      setListing(data)
    } catch (error) {
      console.error('Error fetching listing:', error)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-lg mb-2">
            {authLoading ? 'Checking authentication...' : 'Loading checkout...'}
          </div>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Listing not found</h1>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <div className="bg-muted p-4 rounded-lg">
          <h2 className="font-semibold">{listing.title}</h2>
          <p className="text-muted-foreground">
            {formatPrice(listing.price_amount, listing.currency)}
          </p>
        </div>
      </div>

      <Elements stripe={stripePromise}>
        <CheckoutForm listing={listing} />
      </Elements>
    </div>
  )
}
