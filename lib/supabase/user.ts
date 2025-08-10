import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export async function ensureUserExists(user: User): Promise<void> {
  try {
    // Use the proper client context for consistency with the auth session
    const supabase = createClient();

    // Check if user exists in public.users table
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = row not found, which is expected if user doesn't exist
      throw checkError;
    }

    if (!existingUser) {
      // The trigger should have created the user profile automatically
      // If it's not found, try to create it manually as a fallback
      const { error: insertError } = await supabase
        .from("users")
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null
        });

      if (insertError) {
        // If insertion fails, it might be because the trigger already created it
        // Check one more time
        const { error: finalError } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single();

        if (finalError && finalError.code === "PGRST116") {
          throw new Error(
            "Unable to create user profile. Please try refreshing the page or contact support."
          );
        }

        if (finalError) {
          throw finalError;
        }
      }
    }
  } catch (error) {
    throw error;
  }
}

export async function getCurrentUserProfile() {
  // Use the proper client context for consistency with the auth session
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  // Ensure user profile exists
  await ensureUserExists(user);

  return user;
}
