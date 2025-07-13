import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export async function ensureUserExists(user: User): Promise<void> {
  try {

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

      // Wait a moment for the trigger to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check again
      const { error: retryError } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (retryError && retryError.code === "PGRST116") {
        throw new Error(
          "User profile was not created automatically. Please check your database triggers."
        );
      }

      if (retryError) {
        throw retryError;
      }

    } else {
    }
  } catch (error) {
    throw error;
  }
}

export async function getCurrentUserProfile() {

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
