import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
            ?.split('=')[1];
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          let cookieString = `${name}=${value}`;
          if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`;
          if (options?.domain) cookieString += `; domain=${options.domain}`;
          if (options?.path) cookieString += `; path=${options.path}`;
          if (options?.secure) cookieString += `; secure`;
          if (options?.httpOnly) cookieString += `; httponly`;
          if (options?.sameSite) cookieString += `; samesite=${options.sameSite}`;
          document.cookie = cookieString;
        },
        remove(name: string, options: Record<string, unknown>) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${options?.path || '/'}`;
        },
      },
    }
  );
};

// Create a single instance for use throughout the app
export const supabase = createClient();
