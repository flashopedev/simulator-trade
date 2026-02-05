'use client'

import { useState, useCallback } from 'react'
import { Navigation } from '@/components/Navigation'
import { AuthForm } from '@/components/AuthForm'
import { NotificationContainer, useNotification } from '@/components/Notification'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

const AMOUNTS = [1000, 5000, 10000, 50000]

export default function FaucetPage() {
  const [showAuth, setShowAuth] = useState(false)
  const [loading, setLoading] = useState(false)
  const { notifications, notify } = useNotification()
  const auth = useAuth()
  const supabase = createClient()

  const requestFunds = useCallback(async (amount: number) => {
    if (!auth.account) {
      setShowAuth(true)
      return
    }
    setLoading(true)

    const newBalance = auth.account.balance + amount
    await auth.updateBalance(newBalance)

    await supabase.from('demo_fund_requests').insert({
      account_id: auth.account.id,
      amount,
      status: 'completed' as const,
    })

    notify(`+${amount.toLocaleString()} USDC added to your account`, 'ok')
    setLoading(false)
  }, [auth, supabase, notify])

  const resetBalance = useCallback(async () => {
    if (!auth.account) return
    setLoading(true)
    await auth.updateBalance(10000)
    notify('Balance reset to 10,000 USDC', 'info')
    setLoading(false)
  }, [auth, notify])

  return (
    <>
      <NotificationContainer notifications={notifications} />
      {showAuth && !auth.user && (
        <AuthForm onSignUp={auth.signUp} onSignIn={auth.signIn} onClose={() => setShowAuth(false)} />
      )}

      <Navigation
        balance={auth.account?.balance ?? 10000}
        wsConnected={false}
        onAuthClick={() => setShowAuth(true)}
        isLoggedIn={!!auth.user}
        onSignOut={auth.signOut}
      />

      <div className="p-4 max-w-[600px] mx-auto overflow-y-auto h-[calc(100vh-38px)]">
        <h1 className="text-[18px] font-bold mb-2 text-t1">Demo Faucet</h1>
        <p className="text-[12px] text-t3 mb-6">Request demo USDC for paper trading. No limits.</p>

        <div className="bg-s1 border border-brd rounded-lg p-4 mb-4">
          <div className="text-[9px] text-t4 font-medium uppercase tracking-[0.3px] mb-1">Current Balance</div>
          <div className="text-[24px] font-bold text-acc tabular-nums mb-4">
            ${(auth.account?.balance ?? 10000).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => requestFunds(amt)}
                disabled={loading}
                className="py-3 bg-s2 border border-brd rounded-lg text-t1 font-semibold text-[13px] cursor-pointer hover:border-acc hover:text-acc hover:bg-acc2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +{amt.toLocaleString()} USDC
              </button>
            ))}
          </div>

          <button
            onClick={resetBalance}
            disabled={loading}
            className="w-full py-2.5 bg-s3 border border-brd rounded text-t3 text-[11px] font-medium cursor-pointer hover:text-t1 hover:border-t4 transition-all disabled:opacity-50"
          >
            Reset to 10,000 USDC
          </button>
        </div>

        {!auth.user && (
          <div className="bg-acc2 border border-[rgba(80,210,193,0.15)] rounded-lg p-3 text-[11px] text-acc">
            Sign in to save your balance across sessions.
          </div>
        )}
      </div>
    </>
  )
}
