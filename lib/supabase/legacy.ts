// Legacy Supabase client for services that need to work in both client and server contexts
// This is a temporary solution while we transition to proper SSR patterns
import { createClient } from "@supabase/supabase-js";

export const supabaseLegacy = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);