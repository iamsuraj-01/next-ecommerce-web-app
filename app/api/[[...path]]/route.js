import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder')

function createSupabaseServer() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle cookie setting errors
          }
        },
      },
    }
  )
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

export async function GET(request) {
  const supabase = createSupabaseServer()
  const { pathname, searchParams } = new URL(request.url)

  try {
    // Auth: Get current user
    if (pathname === '/api/auth/user') {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        return handleCORS(NextResponse.json({ user: null }, { status: 200 }))
      }

      // Get user profile with role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      return handleCORS(NextResponse.json({ 
        user: { ...user, role: profile?.role || 'customer' } 
      }))
    }

    // Products: Get all products
    if (pathname === '/api/products') {
      const category = searchParams.get('category')
      const search = searchParams.get('search')
      
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      const { data, error } = await query

      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }

      return handleCORS(NextResponse.json(data || []))
    }

    // Products: Get single product
    if (pathname.startsWith('/api/products/')) {
      const id = pathname.split('/').pop()
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return handleCORS(NextResponse.json({ error: 'Product not found' }, { status: 404 }))
      }

      return handleCORS(NextResponse.json(data))
    }

    // Cart: Get user's cart
    if (pathname === '/api/cart') {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', user.id)

      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }

      return handleCORS(NextResponse.json(data || []))
    }

    // Orders: Get user's orders
    if (pathname === '/api/orders') {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      // Check if admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .order('created_at', { ascending: false })

      // If not admin, only show own orders
      if (profile?.role !== 'admin') {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query

      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }

      return handleCORS(NextResponse.json(data || []))
    }

    return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}

export async function POST(request) {
  const supabase = createSupabaseServer()
  const { pathname } = new URL(request.url)

  try {
    const body = await request.json()

    // Auth: Sign up
    if (pathname === '/api/auth/signup') {
      const { email, password } = body
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }))
      }

      // Create user profile
      if (data.user) {
        await supabase.from('user_profiles').insert({
          id: data.user.id,
          role: 'customer'
        })
      }

      return handleCORS(NextResponse.json({ user: data.user, session: data.session }))
    }

    // Auth: Sign in
    if (pathname === '/api/auth/signin') {
      const { email, password } = body
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }))
      }

      return handleCORS(NextResponse.json({ user: data.user, session: data.session }))
    }

    // Auth: Sign out
    if (pathname === '/api/auth/signout') {
      const { error } = await supabase.auth.signOut()
      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 400 }))
      }
      return handleCORS(NextResponse.json({ success: true }))
    }

    // Products: Create (admin only)
    if (pathname === '/api/products') {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }

      const { data, error } = await supabase
        .from('products')
        .insert([body])
        .select()
        .single()

      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }

      return handleCORS(NextResponse.json(data))
    }

    // Cart: Add item
    if (pathname === '/api/cart') {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { product_id, quantity } = body

      // Check if item already in cart
      const { data: existing } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product_id)
        .single()

      if (existing) {
        // Update quantity
        const { data, error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
        }
        return handleCORS(NextResponse.json(data))
      } else {
        // Insert new item
        const { data, error } = await supabase
          .from('cart_items')
          .insert([{ user_id: user.id, product_id, quantity }])
          .select()
          .single()

        if (error) {
          return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
        }
        return handleCORS(NextResponse.json(data))
      }
    }

    // Checkout: Create Stripe session
    if (pathname === '/api/checkout/create-session') {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { items, total } = body

      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: items.map(item => ({
            price_data: {
              currency: 'usd',
              product_data: {
                name: item.name,
                images: item.image_url ? [item.image_url] : [],
              },
              unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
          })),
          mode: 'payment',
          success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart`,
          metadata: {
            user_id: user.id,
          },
        })

        // Create order in pending state
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert([{
            user_id: user.id,
            total,
            status: 'pending',
            stripe_session_id: session.id,
          }])
          .select()
          .single()

        if (orderError) {
          return handleCORS(NextResponse.json({ error: orderError.message }, { status: 500 }))
        }

        // Create order items
        const orderItems = items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        }))

        await supabase.from('order_items').insert(orderItems)

        return handleCORS(NextResponse.json({ url: session.url, order_id: order.id }))
      } catch (error) {
        console.error('Stripe error:', error)
        return handleCORS(NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 }))
      }
    }

    return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}

export async function PUT(request) {
  const supabase = createSupabaseServer()
  const { pathname } = new URL(request.url)

  try {
    const body = await request.json()

    // Products: Update (admin only)
    if (pathname.startsWith('/api/products/')) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }

      const id = pathname.split('/').pop()
      const { data, error } = await supabase
        .from('products')
        .update(body)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }

      return handleCORS(NextResponse.json(data))
    }

    // Cart: Update item quantity
    if (pathname.startsWith('/api/cart/')) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const id = pathname.split('/').pop()
      const { quantity } = body

      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }

      return handleCORS(NextResponse.json(data))
    }

    // Orders: Update status (admin only)
    if (pathname.startsWith('/api/orders/')) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }

      const id = pathname.split('/').pop()
      const { status } = body

      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }

      return handleCORS(NextResponse.json(data))
    }

    return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}

export async function DELETE(request) {
  const supabase = createSupabaseServer()
  const { pathname } = new URL(request.url)

  try {
    // Products: Delete (admin only)
    if (pathname.startsWith('/api/products/')) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return handleCORS(NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      }

      const id = pathname.split('/').pop()
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }

      return handleCORS(NextResponse.json({ success: true }))
    }

    // Cart: Remove item
    if (pathname.startsWith('/api/cart/')) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      }

      const id = pathname.split('/').pop()
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        return handleCORS(NextResponse.json({ error: error.message }, { status: 500 }))
      }

      return handleCORS(NextResponse.json({ success: true }))
    }

    return handleCORS(NextResponse.json({ error: 'Not found' }, { status: 404 }))
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}
