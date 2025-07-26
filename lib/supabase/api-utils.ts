import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

/**
 * Creates a Supabase client with proper response handling for API routes
 * This ensures that session cookies are properly updated in the response
 */
export function createApiClientWithResponse(request: NextRequest) {
  // Create a response object that we can modify
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie on both request and response
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Remove cookie from both request and response
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  return { supabase, response }
}

/**
 * Wrapper for API route handlers that ensures proper authentication and session handling
 * 
 * @param handler - The API route handler function that receives the authenticated user
 * @param request - The incoming NextRequest
 * @returns NextResponse with proper cookie handling
 */
export async function withAuth(
  handler: (request: NextRequest, user: User) => Promise<NextResponse>,
  request: NextRequest
): Promise<NextResponse> {
  try {
    const { supabase, response } = createApiClientWithResponse(request)
    
    // Get and refresh the session if needed
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error in withAuth:', sessionError)
      return NextResponse.json(
        { error: `Authentication failed: ${sessionError.message}` },
        { status: 401 }
      )
    }
    
    if (!session) {
      console.error('No session found in withAuth')
      return NextResponse.json(
        { error: 'No active session found. Please log in.' },
        { status: 401 }
      )
    }
    
    // Get the user from the session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('User fetch error in withAuth:', userError)
      return NextResponse.json(
        { error: 'Failed to get user information' },
        { status: 401 }
      )
    }
    
    // Call the handler with the authenticated user
    const handlerResponse = await handler(request, user)
    
    // Copy cookies from our response to the handler response
    response.cookies.getAll().forEach(cookie => {
      handlerResponse.cookies.set(cookie)
    })
    
    return handlerResponse
    
  } catch (error) {
    console.error('withAuth error:', error)
    return NextResponse.json(
      { 
        error: 'Authentication failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

/**
 * Gets authenticated user and client with proper response handling
 * Use this when you need both the user and supabase client in your API route
 */
export async function getAuthenticatedUserAndClientWithResponse(request: NextRequest) {
  const { supabase, response } = createApiClientWithResponse(request)
  
  // Debug: Log request cookies
  const cookies = request.cookies.getAll()
  const supabaseCookies = cookies.filter(c => c.name.startsWith('sb-'))
  console.log('🍪 Request cookies:', {
    total: cookies.length,
    supabaseCookies: supabaseCookies.length,
    cookieNames: cookies.map(c => c.name),
    hasSupabaseAuth: supabaseCookies.length > 0
  })
  
  // Get session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  // Debug: Log session state
  console.log('🔐 Session state:', {
    hasSession: !!session,
    sessionError: sessionError?.message,
    userId: session?.user?.id,
    expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
  })
  
  if (sessionError || !session) {
    console.error('❌ Authentication failed:', { sessionError, hasSession: !!session })
    throw new Error('No active session found')
  }
  
  // Get user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('Failed to get user information')
  }
  
  return { user, supabase, response }
}