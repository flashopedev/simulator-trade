'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { DemoAccount } from '@/lib/supabase/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [account, setAccount] = useState<DemoAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchAccount = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('demo_accounts')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (data) {
      setAccount(data as DemoAccount)
    } else {
      // Auto-create demo account
      const { data: newAccount } = await supabase
        .from('demo_accounts')
        .insert({ user_id: userId, balance: 10000 })
        .select()
        .single()
      if (newAccount) setAccount(newAccount as DemoAccount)
    }
  }, [supabase])

  useEffect(() => {
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) await fetchAccount(user.id)
      setLoading(false)
    }
    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null
        setUser(u)
        if (u) await fetchAccount(u.id)
        else setAccount(null)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchAccount, supabase.auth])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setAccount(null)
  }

  const updateBalance = useCallback(async (newBalance: number) => {
    if (!account) return
    const { error } = await supabase
      .from('demo_accounts')
      .update({ balance: newBalance })
      .eq('id', account.id)
    if (!error) setAccount({ ...account, balance: newBalance })
  }, [account, supabase])

  const refreshAccount = useCallback(async () => {
    if (!user) return
    await fetchAccount(user.id)
  }, [user, fetchAccount])

  return {
    user,
    account,
    loading,
    signUp,
    signIn,
    signOut,
    updateBalance,
    refreshAccount,
  }
}
