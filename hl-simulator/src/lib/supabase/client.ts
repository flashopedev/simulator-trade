import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Helper: extract access token from localStorage or cookie
function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    // First try localStorage (standard supabase-js stores as sb-<ref>-auth-token)
    const keys = Object.keys(localStorage);
    const authKey = keys.find(k => k.includes('auth-token') && (k.startsWith('sb-') || k.includes('supabase')));
    if (authKey) {
      const stored = localStorage.getItem(authKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.access_token) return parsed.access_token;
      }
    }
    // Fallback: try cookie
    const match = document.cookie.match(/sb-[^=]+-auth-token=base64-(.*?)(?:;|$)/);
    if (match) {
      const decoded = atob(match[1]);
      const parsed = JSON.parse(decoded);
      if (parsed.access_token) return parsed.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

// Singleton to ensure we only create one client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any = null;

export function createClient() {
  if (client) return client;

  client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
      global: {
        headers: {},
        fetch: (url: RequestInfo | URL, options: RequestInit = {}) => {
          // Inject the access token into every REST request for RLS
          const token = getAccessToken();
          if (token && typeof url === "string" && url.includes("/rest/")) {
            const headers = new Headers(options.headers || {});
            if (!headers.has("Authorization")) {
              headers.set("Authorization", `Bearer ${token}`);
            }
            return globalThis.fetch(url, { ...options, headers });
          }
          return globalThis.fetch(url, options);
        },
      },
    }
  );

  return client;
}
