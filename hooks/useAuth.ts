import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { ensureUserExists } from '@/lib/supabase/user'

export const useAuth = () => {
  const { user, loading, setUser, setLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null
        setUser(user)
        
        // Ensure user profile exists when signing in
        if (event === 'SIGNED_IN' && user) {
          try {
            await ensureUserExists(user)
          } catch (error) {
            console.error('Failed to ensure user profile exists:', error)
          }
        }
        
        setLoading(false)
        
        if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser, setLoading, router])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    user,
    loading,
    signOut,
  }
}