import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest } from 'next/server'

/**
 * Creates a Supabase server client for API routes with proper request-based cookie handling
 */
export function createApiClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        set(_name: string, _value: string, _options: CookieOptions) {
          // API routes handle cookie setting differently - this is handled by middleware
          // We include this for completeness but it won't be used in practice
          console.warn('Cookie setting in API routes should be handled by middleware')
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        remove(_name: string, _options: CookieOptions) {
          // API routes handle cookie removal differently - this is handled by middleware
          console.warn('Cookie removal in API routes should be handled by middleware')
        },
      },
    }
  )
}

/**
 * Gets the authenticated user from the API request
 * Returns the user if authenticated, throws error with details if not
 */
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    const supabase = createApiClient(request)
    
    // First try to get the session to check if we have valid auth cookies
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      throw new Error(`Session error: ${sessionError.message}`)
    }
    
    if (!session) {
      console.error('No session found in request cookies')
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
export async function getAuthenticatedUserAndClient(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  const supabase = createApiClient(request)
  
  return { user, supabase }
}