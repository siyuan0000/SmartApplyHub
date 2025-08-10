import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // refreshing the auth token
  const { data: { user } } = await supabase.auth.getUser()
  const url = request.nextUrl.clone()
  
  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/resumes', '/applications', '/jobs', '/settings', '/ai-review', '/templates']
  // Routes that require onboarding completion
  const onboardingRequiredRoutes = ['/dashboard', '/resumes', '/applications', '/jobs', '/ai-review', '/templates']

  const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route))
  const isOnboardingRequiredRoute = onboardingRequiredRoutes.some(route => url.pathname.startsWith(route))
  
  // Redirect to login if user is not authenticated and trying to access protected route
  if (!user && isProtectedRoute) {
    const redirectUrl = url.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }
  
  // Check onboarding completion for authenticated users accessing onboarding-required routes
  if (user && isOnboardingRequiredRoute && !url.pathname.startsWith('/settings')) {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()
      
      // Redirect to onboarding if not completed
      if (!profile?.onboarding_completed) {
        const redirectUrl = url.clone()
        redirectUrl.pathname = '/onboarding'
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error)
    }
  }
  
  // Redirect completed users away from onboarding
  if (user && url.pathname === '/onboarding') {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()
      
      if (profile?.onboarding_completed) {
        const redirectUrl = url.clone()
        redirectUrl.pathname = '/dashboard'
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error)
    }
  }

  return supabaseResponse
}