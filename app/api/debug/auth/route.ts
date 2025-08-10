import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createApiClient, createAuthenticatedResponse } from '@/lib/supabase/api'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Auth Debug Endpoint ===')
    
    // Create response object to handle cookies properly
    const response = NextResponse.next()
    
    // Check if we have any cookies at all
    const cookies = request.cookies
    const cookieNames = Array.from(cookies.getAll()).map(cookie => cookie.name)
    console.log('Available cookies:', cookieNames)
    
    // Look for Supabase specific cookies
    const supabaseCookies = cookieNames.filter(name => 
      name.includes('supabase') || name.includes('auth')
    )
    console.log('Supabase-related cookies:', supabaseCookies)

    // Try to create API client and get session
    const supabase = createApiClient(request, response)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('Session error:', sessionError)
    console.log('Session exists:', !!session)
    if (session) {
      console.log('Session user ID:', session.user?.id)
      console.log('Session expires at:', session.expires_at)
    }

    // Try to authenticate user
    let authResult;
    try {
      const user = await getAuthenticatedUser(request, response)
      authResult = {
        success: true,
        userId: user.id,
        email: user.email,
        lastSignIn: user.last_sign_in_at
      }
    } catch (authError) {
      authResult = {
        success: false,
        error: authError instanceof Error ? authError.message : 'Unknown auth error'
      }
    }

    return createAuthenticatedResponse({
      timestamp: new Date().toISOString(),
      cookies: {
        total: cookieNames.length,
        supabaseRelated: supabaseCookies.length,
        names: cookieNames
      },
      session: {
        exists: !!session,
        error: sessionError?.message || null,
        userId: session?.user?.id || null,
        expiresAt: session?.expires_at || null
      },
      authentication: authResult,
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY
      }
    }, response)

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { message: 'Use GET method for auth debugging' },
    { status: 405 }
  )
}