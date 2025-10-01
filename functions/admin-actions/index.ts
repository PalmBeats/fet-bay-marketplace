import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AdminActionRequest {
  action: 'ban_user' | 'unban_user' | 'hide_listing' | 'unhide_listing' | 'metrics' | 'bootstrap_admin'
  user_id?: string
  listing_id?: string
  reason?: string
  bootstrap_secret?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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

    // Parse request body
    const { action, user_id, listing_id, reason, bootstrap_secret }: AdminActionRequest = await req.json()

    // Handle bootstrap admin action (special case - doesn't require admin role)
    if (action === 'bootstrap_admin') {
      return await handleBootstrapAdmin(supabaseClient, user.id, bootstrap_secret)
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Handle admin actions
    switch (action) {
      case 'ban_user':
        return await handleBanUser(supabaseClient, user_id!, reason!, user.id)
      case 'unban_user':
        return await handleUnbanUser(supabaseClient, user_id!, user.id)
      case 'hide_listing':
        return await handleHideListing(supabaseClient, listing_id!)
      case 'unhide_listing':
        return await handleUnhideListing(supabaseClient, listing_id!)
      case 'metrics':
        return await handleGetMetrics(supabaseClient)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

  } catch (error) {
    console.error('Error in admin actions:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleBootstrapAdmin(supabaseClient: any, userId: string, bootstrapSecret?: string) {
  try {
    const expectedSecret = Deno.env.get('ADMIN_BOOTSTRAP_SECRET')
    
    if (!expectedSecret || !bootstrapSecret || bootstrapSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: 'Invalid bootstrap secret' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if any admin already exists
    const { data: existingAdmins, error: adminCheckError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)

    if (adminCheckError) {
      console.error('Error checking existing admins:', adminCheckError)
      return new Response(
        JSON.stringify({ error: 'Failed to check existing admins' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Admin already exists' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Promote user to admin
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId)

    if (updateError) {
      console.error('Error promoting user to admin:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to promote user to admin' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User promoted to admin' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in bootstrap admin:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleBanUser(supabaseClient: any, userId: string, reason: string, adminId: string) {
  try {
    // Update user role to banned
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ role: 'banned' })
      .eq('id', userId)

    if (updateError) {
      console.error('Error banning user:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to ban user' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Record ban in bans table
    const { error: banError } = await supabaseClient
      .from('bans')
      .insert({
        user_id: userId,
        reason: reason,
        banned_by: adminId,
      })

    if (banError) {
      console.error('Error recording ban:', banError)
      // Don't fail the request, just log the error
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User banned successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in ban user:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleUnbanUser(supabaseClient: any, userId: string, adminId: string) {
  try {
    // Update user role back to user
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ role: 'user' })
      .eq('id', userId)

    if (updateError) {
      console.error('Error unbanning user:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to unban user' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User unbanned successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in unban user:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleHideListing(supabaseClient: any, listingId: string) {
  try {
    const { error: updateError } = await supabaseClient
      .from('listings')
      .update({ status: 'hidden' })
      .eq('id', listingId)

    if (updateError) {
      console.error('Error hiding listing:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to hide listing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Listing hidden successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in hide listing:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleUnhideListing(supabaseClient: any, listingId: string) {
  try {
    const { error: updateError } = await supabaseClient
      .from('listings')
      .update({ status: 'active' })
      .eq('id', listingId)

    if (updateError) {
      console.error('Error unhiding listing:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to unhide listing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Listing unhidden successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in unhide listing:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleGetMetrics(supabaseClient: any) {
  try {
    // Get total sales
    const { data: totalSales, error: salesError } = await supabaseClient
      .from('orders')
      .select('amount')
      .eq('status', 'paid')

    if (salesError) {
      console.error('Error getting total sales:', salesError)
      return new Response(
        JSON.stringify({ error: 'Failed to get sales data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const totalSalesAmount = totalSales?.reduce((sum: number, order: any) => sum + order.amount, 0) || 0
    const totalOrders = totalSales?.length || 0

    // Get sales for last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentSales, error: recentError } = await supabaseClient
      .from('orders')
      .select('amount, created_at')
      .eq('status', 'paid')
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (recentError) {
      console.error('Error getting recent sales:', recentError)
      return new Response(
        JSON.stringify({ error: 'Failed to get recent sales data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const recentSalesAmount = recentSales?.reduce((sum: number, order: any) => sum + order.amount, 0) || 0

    // Get listing counts
    const { data: listingCounts, error: listingError } = await supabaseClient
      .from('listings')
      .select('status')

    if (listingError) {
      console.error('Error getting listing counts:', listingError)
      return new Response(
        JSON.stringify({ error: 'Failed to get listing data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const activeListings = listingCounts?.filter((l: any) => l.status === 'active').length || 0
    const soldListings = listingCounts?.filter((l: any) => l.status === 'sold').length || 0

    // Get user count
    const { data: userCount, error: userError } = await supabaseClient
      .from('profiles')
      .select('id', { count: 'exact' })

    if (userError) {
      console.error('Error getting user count:', userError)
      return new Response(
        JSON.stringify({ error: 'Failed to get user data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get top sellers
    const { data: topSellers, error: topSellersError } = await supabaseClient
      .from('v_top_sellers')
      .select('*')
      .limit(10)

    if (topSellersError) {
      console.error('Error getting top sellers:', topSellersError)
      // Don't fail the request, just log the error
    }

    return new Response(
      JSON.stringify({
        total_sales: totalSalesAmount,
        total_orders: totalOrders,
        recent_sales_30_days: recentSalesAmount,
        active_listings: activeListings,
        sold_listings: soldListings,
        total_users: userCount?.length || 0,
        top_sellers: topSellers || [],
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get metrics:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}
