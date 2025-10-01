import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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

    // Get the webhook signature
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe signature' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the raw body
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET')
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let event: Stripe.Event

    try {
      // Verify the webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Processing webhook event:', event.type)

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSucceeded(supabaseClient, paymentIntent)
        break
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailed(supabaseClient, paymentIntent)
        break
      }
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentCanceled(supabaseClient, paymentIntent)
        break
      }
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        await handleAccountUpdated(supabaseClient, account)
        break
      }
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handlePaymentSucceeded(supabaseClient: any, paymentIntent: Stripe.PaymentIntent) {
  try {
    const { listing_id, buyer_id, seller_id } = paymentIntent.metadata

    if (!listing_id || !buyer_id || !seller_id) {
      console.error('Missing metadata in payment intent:', paymentIntent.id)
      return
    }

    // Update order status to paid
    const { error: orderError } = await supabaseClient
      .from('orders')
      .update({ status: 'paid' })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (orderError) {
      console.error('Error updating order status:', orderError)
      return
    }

    // Mark listing as sold
    const { error: listingError } = await supabaseClient
      .from('listings')
      .update({ status: 'sold' })
      .eq('id', listing_id)

    if (listingError) {
      console.error('Error updating listing status:', listingError)
      return
    }

    console.log(`Payment succeeded for order ${paymentIntent.id}`)

    // TODO: Send notification to seller (email via Resend or in-app notification)
    // This could be implemented as a separate function or service

  } catch (error) {
    console.error('Error handling payment succeeded:', error)
  }
}

async function handlePaymentFailed(supabaseClient: any, paymentIntent: Stripe.PaymentIntent) {
  try {
    // Update order status to failed (or keep as requires_payment)
    const { error: orderError } = await supabaseClient
      .from('orders')
      .update({ status: 'requires_payment' })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (orderError) {
      console.error('Error updating order status:', orderError)
      return
    }

    console.log(`Payment failed for order ${paymentIntent.id}`)

  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}

async function handlePaymentCanceled(supabaseClient: any, paymentIntent: Stripe.PaymentIntent) {
  try {
    // Update order status to canceled (or keep as requires_payment)
    const { error: orderError } = await supabaseClient
      .from('orders')
      .update({ status: 'requires_payment' })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (orderError) {
      console.error('Error updating order status:', orderError)
      return
    }

    console.log(`Payment canceled for order ${paymentIntent.id}`)

  } catch (error) {
    console.error('Error handling payment canceled:', error)
  }
}

async function handleAccountUpdated(supabaseClient: any, account: Stripe.Account) {
  try {
    // Update connect account status
    const { error: accountError } = await supabaseClient
      .from('connect_accounts')
      .update({ 
        charges_enabled: account.charges_enabled,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_account_id', account.id)

    if (accountError) {
      console.error('Error updating connect account:', accountError)
      return
    }

    console.log(`Account updated: ${account.id}, charges_enabled: ${account.charges_enabled}`)

  } catch (error) {
    console.error('Error handling account updated:', error)
  }
}
