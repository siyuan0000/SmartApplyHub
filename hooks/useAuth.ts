import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth'
import { ensureUserExists } from '@/lib/supabase/user'

export const useAuth = () => {
  const { user, loading, setUser, setLoading } = useAuthStore()
  const [authError, setAuthError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Clear auth error
  const clearAuthError = useCallback(() => {
    setAuthError(null)
  }, [])

  // Refresh session manually
  const refreshSession = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Session refresh failed:', error)
        setAuthError('Failed to refresh session. Please log in again.')
        setUser(null)
        return false
      }
      
      setUser(session?.user ?? null)
      setAuthError(null)
      return true
    } catch (error) {
      console.error('Session refresh error:', error)
      setAuthError('Session refresh failed')
      setUser(null)
      return false
    } finally {
      setLoading(false)
    }
  }, [setUser, setLoading])

  // Enhanced sign out with error handling
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      setAuthError(null)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        setAuthError('Failed to sign out properly')
        // Still continue with local cleanup
      }
      
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Sign out failed:', error)
      setAuthError('Sign out failed')
      // Force local cleanup anyway
      setUser(null)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [setUser, setLoading, router])

  useEffect(() => {
    let mounted = true

    // Get initial session with better error handling
    const getSession = async () => {
      try {
        console.log('🔄 [useAuth] Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('📋 [useAuth] Session result:', {
          hasSession: !!session,
          userId: session?.user?.id || null,
          error: error?.message || null
        })
        
        if (error) {
          console.error('❌ [useAuth] Initial session fetch failed:', error)
          setAuthError('Failed to load authentication status')
          setUser(null)
        } else {
          console.log('✅ [useAuth] Setting user:', session?.user ? { id: session.user.id, email: session.user.email } : null)
          setUser(session?.user ?? null)
          setAuthError(null)
        }
      } catch (error) {
        console.error('💥 [useAuth] Session initialization error:', error)
        setAuthError('Authentication system error')
        setUser(null)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getSession()

    // Listen for auth changes with enhanced error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('🔄 [useAuth] Auth state changed:', event, {
          hasSession: !!session,
          userId: session?.user?.id || null,
          eventType: event
        })
        
        try {
          const user = session?.user ?? null
          setUser(user)
          setAuthError(null)
          
          // Ensure user profile exists when signing in
          if (event === 'SIGNED_IN' && user) {
            try {
              await ensureUserExists(user)
              console.log('User profile ensured for:', user.id)
            } catch (error) {
              console.error('Failed to ensure user profile exists:', error)
              setAuthError('Failed to set up user profile')
            }
          }
          
          // Handle token refresh
          if (event === 'TOKEN_REFRESHED' && session) {
            console.log('Token refreshed successfully')
          }
          
          // Handle sign out
          if (event === 'SIGNED_OUT') {
            console.log('User signed out')
            setUser(null)
            router.push('/login')
          }

          // Handle auth errors
          if (event === 'SIGNED_OUT' && !session && user) {
            // Unexpected sign out - could be token expiry
            setAuthError('Session expired. Please log in again.')
          }
          
        } catch (error) {
          console.error('Auth state change handler error:', error)
          setAuthError('Authentication error occurred')
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [setUser, setLoading, router])

  return {
    user,
    loading,
    authError,
    signOut,
    refreshSession,
    clearAuthError,
  }
}