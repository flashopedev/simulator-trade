'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/Navigation'
import { AuthForm } from '@/components/AuthForm'
import { NotificationContainer, useNotification } from '@/components/Notification'
import { useAuth } from '@/hooks/useAuth'
import { useTrading } from '@/hooks/useTrading'
import { useMarketData } from '@/hooks/useMarketData'
import {
  getTotalEquity,
  getAvailableBalance,
  calculatePnl,
  calculateRoe,
  COIN_DECIMALS,
  type SupportedCoin,
} from '@/lib/utils'

export default function PortfolioPage() {
  const [showAuth, setShowAuth] = useState(false)
  const { notifications, notify } = useNotification()
  const auth = useAuth()
  const market = useMarketData('HYPE', '15m')

  const handleBalanceChange = useCallback(
    (newBalance: number) => { auth.updateBalance(newBalance) },
    [auth]
  )

  const trading = useTrading({
    accountId: auth.account?.id ?? null,
    balance: auth.account?.balance ?? 10000,
    onBalanceChange: handleBalanceChange,
    price: market.price,
    coin: 'HYPE',
  })

  const balance = auth.account?.balance ?? 10000
  const totalEquity = getTotalEquity(
    balance,
    trading.positions.map((p) => ({ size: p.size, entry_price: p.entry_price, leverage: p.leverage, side: p.side })),
    market.price
  )
  const available = getAvailableBalance(balance, trading.positions.map((p) => ({ size: p.size, entry_price: p.entry_price, leverage: p.leverage })))
  const usedMargin = totalEquity - available
  const totalPnl = trading.positions.reduce((sum, p) => sum + calculatePnl(market.price, p.entry_price, p.size, p.side), 0)

  const handleClose = useCallback(async (id: string) => {
    const result = await trading.closePosition(id)
    if ('error' in result && result.error) notify(String(result.error), 'err')
    else if ('pnl' in result) {
      const pnl = result.pnl as number
      notify(`Position closed | PnL: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`, pnl >= 0 ? 'ok' : 'err')
    }
  }, [trading, notify])

  if (auth.loading) {
    return <div className="flex items-center justify-center h-screen text-t3">Loading...</div>
  }

  return (
    <>
      <NotificationContainer notifications={notifications} />
      {showAuth && !auth.user && (
        <AuthForm onSignUp={auth.signUp} onSignIn={auth.signIn} onClose={() => setShowAuth(false)} />
      )}

      <Navigation
        balance={totalEquity}
        wsConnected={market.wsConnected}
        onAuthClick={() => setShowAuth(true)}
        isLoggedIn={!!auth.user}
        onSignOut={auth.signOut}
      />

      <div className="p-4 max-w-[1200px] mx-auto overflow-y-auto h-[calc(100vh-38px)]">
        <h1 className="text-[18px] font-bold mb-4 text-t1">Portfolio</h1>

        {/* Overview cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Equity', value: `$${totalEquity.toFixed(2)}`, color: 'text-acc' },
            { label: 'Available', value: `$${available.toFixed(2)}`, color: 'text-t1' },
            { label: 'Used Margin', value: `$${usedMargin.toFixed(2)}`, color: 'text-t2' },
            { label: 'Unrealized PnL', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? 'text-grn' : 'text-red' },
          ].map((card) => (
            <div key={card.label} className="bg-s1 border border-brd rounded-lg p-3">
              <div className="text-[9px] text-t4 font-medium uppercase tracking-[0.3px] mb-1">{card.label}</div>
              <div className={`text-[16px] font-bold tabular-nums ${card.color}`}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Open positions */}
        <div className="mb-6">
          <h2 className="text-[13px] font-semibold mb-2 text-t2">Open Positions ({trading.positions.length})</h2>
          <div className="bg-s1 border border-brd rounded-lg overflow-hidden">
            {trading.positions.length === 0 ? (
              <div className="text-center py-6 text-t4 text-[12px]">
                No open positions.{' '}
                <Link href="/trade" className="text-acc hover:underline">Start trading</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-t4 text-[9px] font-medium border-b border-brd">
                      <th className="py-2 px-3 text-left">Market</th>
                      <th className="py-2 px-3 text-left">Side</th>
                      <th className="py-2 px-3 text-right">Size</th>
                      <th className="py-2 px-3 text-right">Entry</th>
                      <th className="py-2 px-3 text-right">Mark</th>
                      <th className="py-2 px-3 text-right">PnL</th>
                      <th className="py-2 px-3 text-right">ROE</th>
                      <th className="py-2 px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {trading.positions.map((p) => {
                      const d = COIN_DECIMALS[p.coin as SupportedCoin] || 2
                      const pnl = calculatePnl(market.price, p.entry_price, p.size, p.side)
                      const roe = calculateRoe(pnl, p.size, p.entry_price, p.leverage)
                      const c = pnl >= 0 ? 'text-grn' : 'text-red'
                      return (
                        <tr key={p.id} className="border-b border-brd/50 hover:bg-s2">
                          <td className="py-2 px-3 font-medium">{p.coin}-USD</td>
                          <td className={`py-2 px-3 font-bold ${p.side === 'Long' ? 'text-grn' : 'text-red'}`}>
                            {p.leverage}x {p.side}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">{p.size.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{p.entry_price.toFixed(d)}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{market.price.toFixed(d)}</td>
                          <td className={`py-2 px-3 text-right tabular-nums font-semibold ${c}`}>
                            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                          </td>
                          <td className={`py-2 px-3 text-right tabular-nums ${c}`}>
                            {roe >= 0 ? '+' : ''}{roe.toFixed(1)}%
                          </td>
                          <td className="py-2 px-3">
                            <button
                              onClick={() => handleClose(p.id)}
                              className="py-1 px-2 bg-s3 border border-brd rounded text-t2 text-[9px] cursor-pointer font-semibold hover:bg-red2 hover:border-[rgba(239,68,68,0.25)] hover:text-red transition-all"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Trade history */}
        <div>
          <h2 className="text-[13px] font-semibold mb-2 text-t2">Trade History</h2>
          <div className="bg-s1 border border-brd rounded-lg overflow-hidden">
            {trading.history.length === 0 ? (
              <div className="text-center py-6 text-t4 text-[12px]">No trade history</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-t4 text-[9px] font-medium border-b border-brd">
                      <th className="py-2 px-3 text-left">Market</th>
                      <th className="py-2 px-3 text-left">Side</th>
                      <th className="py-2 px-3 text-right">Size</th>
                      <th className="py-2 px-3 text-right">Entry</th>
                      <th className="py-2 px-3 text-right">Exit</th>
                      <th className="py-2 px-3 text-right">PnL</th>
                      <th className="py-2 px-3 text-right">ROE</th>
                      <th className="py-2 px-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trading.history.map((h) => {
                      const d = COIN_DECIMALS[h.coin as SupportedCoin] || 2
                      const roe = calculateRoe(h.pnl, h.size, h.entry_price, h.leverage)
                      const c = h.pnl >= 0 ? 'text-grn' : 'text-red'
                      return (
                        <tr key={h.id} className="border-b border-brd/50 hover:bg-s2">
                          <td className="py-2 px-3 font-medium">
                            {h.coin}{h.liquidated ? ' \u{1F480}' : ''}
                          </td>
                          <td className={`py-2 px-3 font-bold ${h.side === 'Long' ? 'text-grn' : 'text-red'}`}>
                            {h.leverage}x {h.side}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">{h.size.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{h.entry_price.toFixed(d)}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{h.close_price.toFixed(d)}</td>
                          <td className={`py-2 px-3 text-right tabular-nums font-semibold ${c}`}>
                            {h.pnl >= 0 ? '+' : ''}{h.pnl.toFixed(2)}
                          </td>
                          <td className={`py-2 px-3 text-right tabular-nums ${c}`}>
                            {roe >= 0 ? '+' : ''}{roe.toFixed(1)}%
                          </td>
                          <td className="py-2 px-3 text-right text-t4 text-[9px]">
                            {h.closed_at ? new Date(h.closed_at).toLocaleTimeString() : ''}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
