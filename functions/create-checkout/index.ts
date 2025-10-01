import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShippingAddress {
  name: string
  line1: string
  line2?: string
  postal_code: string
  city: string
  country: string
}

interface CreateCheckoutRequest {
  listing_id: string
  shipping_address: ShippingAddress
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is banned
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (profile.role === 'banned') {
      return new Response(
        JSON.stringify({ error: 'User is banned' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { listing_id, shipping_address }: CreateCheckoutRequest = await req.json()

    if (!listing_id || !shipping_address) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get listing details
    const { data: listing, error: listingError } = await supabaseClient
      .from('listings')
      .select(`
        *,
        profiles!listings_seller_id_fkey (
          id,
          email,
          role
        )
      `)
      .eq('id', listing_id)
      .eq('status', 'active')
      .single()

    if (listingError || !listing) {
      return new Response(
        JSON.stringify({ error: 'Listing not found or not active' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is trying to buy their own listing
    if (listing.seller_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot buy your own listing' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get seller's connect account
    const { data: connectAccount, error: connectError } = await supabaseClient
      .from('connect_accounts')
      .select('stripe_account_id, charges_enabled')
      .eq('user_id', listing.seller_id)
      .single()

    if (connectError || !connectAccount) {
      return new Response(
        JSON.stringify({ 
          error: 'Seller has not set up payment account',
          needs_onboarding: true 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!connectAccount.charges_enabled) {
      return new Response(
        JSON.stringify({ 
          error: 'Seller payment account not ready',
          needs_onboarding: true 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Calculate application fee (optional)
    const feePercent = parseFloat(Deno.env.get('STRIPE_CONNECT_APPLICATION_FEE_PERCENT') || '0')
    const applicationFeeAmount = feePercent > 0 
      ? Math.round(listing.price_amount * (feePercent / 100))
      : undefined

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: listing.price_amount,
      currency: listing.currency.toLowerCase(),
      transfer_data: {
        destination: connectAccount.stripe_account_id,
      },
      ...(applicationFeeAmount && { application_fee_amount: applicationFeeAmount }),
      metadata: {
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
      },
    })

    // Create order in database
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        listing_id: listing.id,
        buyer_id: user.id,
        amount: listing.price_amount,
        currency: listing.currency,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'requires_payment',
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Error creating order:', orderError)
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Save shipping address
    const { error: addressError } = await supabaseClient
      .from('shipping_addresses')
      .insert({
        order_id: order.id,
        buyer_id: user.id,
        ...shipping_address,
      })

    if (addressError) {
      console.error('Error saving shipping address:', addressError)
      return new Response(
        JSON.stringify({ error: 'Failed to save shipping address' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        client_secret: paymentIntent.client_secret,
        order_id: order.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error creating checkout:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
