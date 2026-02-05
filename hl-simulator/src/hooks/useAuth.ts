"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { DemoAccount } from "@/lib/supabase/types";

// Get singleton client outside component to ensure stability
const supabase = createClient();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<DemoAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchAccount = useCallback(async (userId: string) => {
    try {
      // Try to get existing account
      const { data: existingAccount } = await supabase
        .from("demo_accounts")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (existingAccount) {
        if (mountedRef.current) setAccount(existingAccount);
        return existingAccount;
      }

      // Create new account with 10,000 USDC
      const { data: newAccount, error } = await supabase
        .from("demo_accounts")
        .insert({ user_id: userId, balance: 10000 })
        .select()
        .single();

      if (error) {
        console.error("Failed to create account:", error);
        return null;
      }

      if (mountedRef.current) setAccount(newAccount);
      return newAccount;
    } catch (e) {
      console.error("fetchAccount error:", e);
      return null;
    }
  }, []);

  const updateBalance = useCallback(
    async (newBalance: number) => {
      if (!account) return;

      const { error } = await supabase
        .from("demo_accounts")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", account.id);

      if (!error && mountedRef.current) {
        setAccount({ ...account, balance: newBalance });
      }
    },
    [account]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    if (mountedRef.current) {
      setUser(null);
      setAccount(null);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mountedRef.current) return;

        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchAccount(session.user.id);
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    init();

    // Safety timeout — force loading to false after 5 seconds
    const timeout = setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
      }
    }, 5000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchAccount(session.user.id);
        } else {
          setAccount(null);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchAccount]);

  return {
    user,
    account,
    loading,
    signOut,
    updateBalance,
    refetchAccount: () => user && fetchAccount(user.id),
  };
}
