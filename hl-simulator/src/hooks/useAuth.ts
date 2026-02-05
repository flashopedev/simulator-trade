"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { DemoAccount } from "@/lib/supabase/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<DemoAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchAccount = useCallback(
    async (userId: string) => {
      // Try to get existing account
      const { data: existingAccount } = await supabase
        .from("demo_accounts")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (existingAccount) {
        setAccount(existingAccount);
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

      setAccount(newAccount);
      return newAccount;
    },
    [supabase]
  );

  const updateBalance = useCallback(
    async (newBalance: number) => {
      if (!account) return;

      const { error } = await supabase
        .from("demo_accounts")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", account.id);

      if (!error) {
        setAccount({ ...account, balance: newBalance });
      }
    },
    [account, supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccount(null);
  }, [supabase]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAccount(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchAccount(session.user.id);
      } else {
        setAccount(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchAccount]);

  return {
    user,
    account,
    loading,
    signOut,
    updateBalance,
    refetchAccount: () => user && fetchAccount(user.id),
  };
}
