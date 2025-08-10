import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Creates a Supabase server client for API routes with proper request-based cookie handling
 */
export function createApiClient(
  request: NextRequest,
  response?: NextResponse
) {
  const responseToUse = response || NextResponse.next()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookie on response for proper handling
          responseToUse.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          // Remove cookie from response
          responseToUse.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
}

/**
 * Gets the authenticated user from the API request
 * Returns the user if authenticated, throws error with details if not
 */
export async function getAuthenticatedUser(
  request: NextRequest,
  response?: NextResponse
) {
  try {
    console.log('🔐 [Auth] Starting authentication check...')
    
    // Debug: Log cookie information
    const cookies = request.cookies.getAll()
    const cookieNames = cookies.map(c => c.name)
    const supabaseCookies = cookies.filter(c => c.name.includes('sb-'))
    
    console.log('🍪 [Auth] Request cookies:', {
      total: cookies.length,
      names: cookieNames,
      supabaseCount: supabaseCookies.length,
      supabaseCookies: supabaseCookies.map(c => ({ name: c.name, hasValue: !!c.value }))
    })
    
    const supabase = createApiClient(request, response)
    
    // First try to get the session to check if we have valid auth cookies
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('📋 [Auth] Session check result:', {
      hasSession: !!session,
      sessionError: sessionError?.message || null,
      userId: session?.user?.id || null,
      expiresAt: session?.expires_at || null
    })
    
    if (sessionError) {
      console.error('❌ [Auth] Session error:', sessionError)
      throw new Error(`Session error: ${sessionError.message}`)
    }
    
    if (!session) {
      console.error('❌ [Auth] No session found in request cookies')
      throw new Error('No active session found. Please log in.')
    }
    
    // Get user details
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('User fetch error:', userError)
      throw new Error(`User fetch error: ${userError.message}`)
    }
    
    if (!user) {
      console.error('No user found despite having session')
      throw new Error('No user found. Please log in again.')
    }
    
    console.log('Successfully authenticated user:', user.id)
    return user
    
  } catch (error) {
    console.error('Authentication failed:', error)
    
    // Re-throw with more context if it's already an Error
    if (error instanceof Error) {
      throw error
    }
    
    // Create a new error if it's not
    throw new Error('Authentication failed due to unknown error')
  }
}

/**
 * Validates that a user is authenticated and returns both user and supabase client
 * Useful for API routes that need both the user and client
 */
export async function getAuthenticatedUserAndClient(
  request: NextRequest,
  response?: NextResponse
) {
  const user = await getAuthenticatedUser(request, response)
  const supabase = createApiClient(request, response)
  
  return { user, supabase }
}

/**
 * Helper function to create a JSON response with proper cookie handling
 * Use this to ensure cookies are properly copied from the auth response
 */
export function createAuthenticatedResponse(
  data: any,
  response: NextResponse,
  init?: ResponseInit
): NextResponse {
  const jsonResponse = NextResponse.json(data, init)
  
  // Copy all cookies from the auth response to the final response
  response.cookies.getAll().forEach(cookie => {
    jsonResponse.cookies.set(cookie)
  })
  
  return jsonResponse
}