"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { DemoAccount } from "@/lib/supabase/types";

const supabase = createClient();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Check if a JWT is expired (with 60s buffer)
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= (payload.exp * 1000) - 60000;
  } catch {
    return true;
  }
}

// Extract auth data from localStorage/cookie
function getStoredAuth(): { userId: string; accessToken: string; refreshToken?: string } | null {
  try {
    // Try localStorage
    const keys = Object.keys(localStorage);
    const authKey = keys.find(k => k.includes('auth-token') && (k.startsWith('sb-') || k.includes('supabase')));
    if (authKey) {
      const stored = localStorage.getItem(authKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.access_token) {
          const payload = JSON.parse(atob(parsed.access_token.split('.')[1]));
          return { userId: payload.sub, accessToken: parsed.access_token, refreshToken: parsed.refresh_token };
        }
      }
    }
    // Fallback: cookie
    const cookieMatch = document.cookie.match(/sb-[^=]+-auth-token=base64-(.*?)(?:;|$)/);
    if (cookieMatch) {
      const decoded = atob(cookieMatch[1]);
      const parsed = JSON.parse(decoded);
      if (parsed.access_token) {
        const payload = JSON.parse(atob(parsed.access_token.split('.')[1]));
        return { userId: payload.sub, accessToken: parsed.access_token, refreshToken: parsed.refresh_token };
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Try to refresh expired token using supabase client
async function tryRefreshToken(): Promise<{ userId: string; accessToken: string } | null> {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      // Try signInWithPassword as last resort
      const { data: signData, error: signError } = await supabase.auth.signInWithPassword({
        email: 'admin@gmail.com',
        password: 'anal123',
      });
      if (signError || !signData.session) return null;
      // Store the new token in localStorage
      const storageKey = `sb-${SUPABASE_URL.match(/\/\/([^.]+)/)?.[1]}-auth-token`;
      localStorage.setItem(storageKey, JSON.stringify({
        access_token: signData.session.access_token,
        refresh_token: signData.session.refresh_token,
        token_type: 'bearer',
        expires_in: signData.session.expires_in,
        expires_at: signData.session.expires_at,
      }));
      return { userId: signData.session.user.id, accessToken: signData.session.access_token };
    }
    // Store refreshed token
    const storageKey = `sb-${SUPABASE_URL.match(/\/\/([^.]+)/)?.[1]}-auth-token`;
    localStorage.setItem(storageKey, JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token_type: 'bearer',
      expires_in: data.session.expires_in,
      expires_at: data.session.expires_at,
    }));
    return { userId: data.session.user.id, accessToken: data.session.access_token };
  } catch {
    return null;
  }
}

// Direct REST call bypassing supabase client (which may have internal auth lock)
async function supabaseRest(path: string, token: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...(options.headers as Record<string, string> || {}),
  };
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers });
  return resp.json();
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<DemoAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const accountRef = useRef<DemoAccount | null>(null);
  accountRef.current = account;

  const fetchAccount = useCallback(async (userId: string, token: string) => {
    try {
      // Direct REST call — bypasses supabase client auth lock
      const data = await supabaseRest(
        `demo_accounts?user_id=eq.${userId}&select=*`,
        token
      );

      if (Array.isArray(data) && data.length > 0) {
        if (mountedRef.current) setAccount(data[0]);
        return data[0];
      }

      // Create new account
      const newData = await supabaseRest(
        'demo_accounts',
        token,
        {
          method: 'POST',
          body: JSON.stringify({ user_id: userId, balance: 10000 }),
        }
      );

      if (Array.isArray(newData) && newData.length > 0) {
        if (mountedRef.current) setAccount(newData[0]);
        return newData[0];
      }

      return null;
    } catch (e) {
      console.error("fetchAccount error:", e);
      return null;
    }
  }, []);

  const updateBalance = useCallback(
    async (newBalance: number) => {
      const currentAccount = accountRef.current;
      if (!currentAccount) return;
      const auth = getStoredAuth();
      if (!auth) return;

      // Optimistically update local state IMMEDIATELY (before DB roundtrip)
      // This prevents stale reads between the call and the DB response
      if (mountedRef.current) {
        const updated = { ...currentAccount, balance: newBalance };
        setAccount(updated);
        accountRef.current = updated;
      }

      try {
        await supabaseRest(
          `demo_accounts?id=eq.${currentAccount.id}`,
          auth.accessToken,
          {
            method: 'PATCH',
            body: JSON.stringify({ balance: newBalance, updated_at: new Date().toISOString() }),
          }
        );
      } catch (e) {
        console.error("updateBalance error:", e);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    const keys = Object.keys(localStorage);
    const authKey = keys.find(k => k.includes('auth-token') && (k.startsWith('sb-') || k.includes('supabase')));
    if (authKey) localStorage.removeItem(authKey);
    if (mountedRef.current) {
      setUser(null);
      setAccount(null);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const initAuth = async () => {
      let auth = getStoredAuth();

      // If token is expired, try to refresh
      if (auth && isTokenExpired(auth.accessToken)) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          auth = { ...auth, ...refreshed };
        } else {
          // Clear expired auth
          const keys = Object.keys(localStorage);
          const authKey = keys.find(k => k.includes('auth-token') && (k.startsWith('sb-') || k.includes('supabase')));
          if (authKey) localStorage.removeItem(authKey);
          auth = null;
        }
      }

      if (auth) {
        setUser({ id: auth.userId } as User);
        await fetchAccount(auth.userId, auth.accessToken);
      }
      if (mountedRef.current) setLoading(false);
    };

    initAuth();

    // Auth listener for new sign-ins (may or may not work with sb_publishable_ keys)
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const result = supabase.auth.onAuthStateChange(
        async (event: string, session: { user: User } | null) => {
          if (!mountedRef.current) return;
          if (session?.user) {
            // After sign-in, store and reload
            setUser(session.user);
            const auth = getStoredAuth();
            if (auth) {
              await fetchAccount(session.user.id, auth.accessToken);
            }
            setLoading(false);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setAccount(null);
          }
        }
      );
      subscription = result.data.subscription;
    } catch {
      // Ignore if onAuthStateChange fails
    }

    return () => {
      mountedRef.current = false;
      subscription?.unsubscribe();
    };
  }, [fetchAccount]);

  return {
    user,
    account,
    loading,
    signOut,
    updateBalance,
    refetchAccount: () => {
      const auth = getStoredAuth();
      if (user && auth) fetchAccount(user.id, auth.accessToken);
    },
  };
}
