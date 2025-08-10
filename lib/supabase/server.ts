import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from 'next/headers'

/**
 * Creates a Supabase server client following the official SSR pattern
 * This handles cookie-based sessions automatically
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Legacy function name for backward compatibility
 */
export const createServerComponentClient = createClient;

/**
 * Creates a Supabase admin client with service role key for server-side operations
 * Use this for operations that require elevated permissions (public data, admin tasks)
 */
export const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Legacy export for backward compatibility - prefer using createClient()
export const supabaseServer = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
