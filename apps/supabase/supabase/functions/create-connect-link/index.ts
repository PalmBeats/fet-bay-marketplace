import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateConnectLinkRequest {
  return_url?: string
}

serve(async (req) => {
  console.log('Function started with method:', req.method)
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Create connect link function started')
    
    // Check environment variables
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:', {
      stripeKey: stripeKey ? 'present' : 'missing',
      supabaseUrl: supabaseUrl ? 'present' : 'missing', 
      supabaseKey: supabaseKey ? 'present' : 'missing'
    })
    
    if (!stripeKey || !supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required environment variables' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
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

    console.log('Checking profile for user:', user.id)
    
    // Check if user is banned
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('Profile check result:', { profile, profileError })

    if (profileError) {
      console.error('Profile error:', profileError)
      // Try to create profile if it doesn't exist
      if (profileError.code === 'PGRST116') {
        console.log('Profile not found, creating one...')
        const { error: createError } = await supabaseClient
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || 'user@example.com',
            role: 'user'
          })
        
        if (createError) {
          console.error('Failed to create profile:', createError)
        } else {
          console.log('Profile created successfully')
        }
      }
    }
    
    if (!profile || !profile.role) {
      return new Response(
        JSON.stringify({ error: 'Could not determine user role' }),
        { 
          status: 500, 
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

    // Check if user already has a connect account
    const { data: existingAccount, error: accountError } = await supabaseClient
      .from('connect_accounts')
      .select('stripe_account_id, charges_enabled')
      .eq('user_id', user.id)
      .single()

    let stripeAccountId: string

    if (existingAccount && !accountError) {
      // User already has a connect account
      stripeAccountId = existingAccount.stripe_account_id
    } else {
      // Create new Stripe Connect account
      const account = await stripe.accounts.create({
        type: 'standard',
        country: 'DK',
        email: user.email,
        business_type: 'individual',
      })

      stripeAccountId = account.id

      // Save to database
      const { error: insertError } = await supabaseClient
        .from('connect_accounts')
        .upsert({
          user_id: user.id,
          stripe_account_id: stripeAccountId,
          charges_enabled: false,
          updated_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('Error saving connect account:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to save account' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Create account link for onboarding
    const requestBody: CreateConnectLinkRequest = await req.json()
    const returnUrl = requestBody.return_url || `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/account`

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: returnUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })

    return new Response(
      JSON.stringify({ 
        url: accountLink.url,
        account_id: stripeAccountId 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error creating connect link:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
