'use client'

import { useState, useCallback } from 'react'
import { Navigation } from '@/components/Navigation'
import { CoinSelector } from '@/components/CoinSelector'
import { Chart } from '@/components/Chart'
import { OrderBook } from '@/components/OrderBook'
import { RecentTrades } from '@/components/RecentTrades'
import { OrderForm } from '@/components/OrderForm'
import { Positions } from '@/components/Positions'
import { AuthForm } from '@/components/AuthForm'
import { NotificationContainer, useNotification } from '@/components/Notification'
import { useAuth } from '@/hooks/useAuth'
import { useMarketData } from '@/hooks/useMarketData'
import { useTrading } from '@/hooks/useTrading'
import { getTotalEquity, COIN_DECIMALS, type SupportedCoin, type Timeframe } from '@/lib/utils'

export default function TradePage() {
  const [coin, setCoin] = useState<SupportedCoin>('HYPE')
  const [interval, setInterval_] = useState<Timeframe>('15m')
  const [showAuth, setShowAuth] = useState(false)

  const { notifications, notify } = useNotification()
  const auth = useAuth()
  const market = useMarketData(coin, interval)

  const handleBalanceChange = useCallback(
    (newBalance: number) => {
      auth.updateBalance(newBalance)
    },
    [auth]
  )

  const trading = useTrading({
    accountId: auth.account?.id ?? null,
    balance: auth.account?.balance ?? 10000,
    onBalanceChange: handleBalanceChange,
    price: market.price,
    coin,
  })

  const balance = auth.account?.balance ?? 10000
  const dec = COIN_DECIMALS[coin] || 2
  const totalEquity = getTotalEquity(
    balance,
    trading.positions.map((p) => ({
      size: p.size,
      entry_price: p.entry_price,
      leverage: p.leverage,
      side: p.side,
    })),
    market.price
  )

  const handleClosePosition = useCallback(
    async (id: string) => {
      const result = await trading.closePosition(id)
      if ('error' in result && result.error) {
        notify(String(result.error), 'err')
      } else if ('pnl' in result) {
        const pos = trading.positions.find((p) => p.id === id)
        const pnl = result.pnl as number
        notify(
          `Closed ${pos?.side} ${pos?.coin} | PnL: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`,
          pnl >= 0 ? 'ok' : 'err'
        )
      }
    },
    [trading, notify]
  )

  return (
    <>
      <NotificationContainer notifications={notifications} />

      {showAuth && !auth.user && (
        <AuthForm
          onSignUp={auth.signUp}
          onSignIn={auth.signIn}
          onClose={() => setShowAuth(false)}
        />
      )}

      <Navigation
        balance={totalEquity}
        wsConnected={market.wsConnected}
        onAuthClick={() => setShowAuth(true)}
        isLoggedIn={!!auth.user}
        onSignOut={auth.signOut}
      />

      <CoinSelector
        coin={coin}
        price={market.price}
        onCoinChange={setCoin}
        candles={market.candles}
      />

      {/* Main grid — matches index.html .app layout */}
      <div className="grid grid-cols-[1fr_234px] grid-rows-[1fr_148px] h-[calc(100vh-72px)] max-lg:grid-cols-[1fr_220px] max-md:flex max-md:flex-col max-md:h-auto max-md:min-h-0">
        {/* Chart */}
        <Chart
          candles={market.candles}
          price={market.price}
          coin={coin}
          interval={interval}
          onIntervalChange={setInterval_}
          chartStatus={market.chartStatus}
          positions={trading.positions}
          loading={!market.candles.length && market.chartStatus === 'Loading...'}
        />

        {/* Right panel: OB + Trades + Form */}
        <div className="row-span-2 col-start-2 flex flex-col overflow-y-auto overflow-x-hidden max-md:row-auto max-md:col-auto max-md:flex max-md:flex-col max-md:overflow-visible max-md:shrink-0">
          <OrderBook
            asks={market.asks}
            bids={market.bids}
            midPrice={market.price ? market.price.toFixed(dec) : '—'}
            midUsd={market.price ? `≈ $${market.price.toFixed(dec)}` : ''}
          />
          <RecentTrades trades={market.trades} />
          <OrderForm
            coin={coin}
            price={market.price}
            balance={balance}
            positions={trading.positions}
            onPlaceOrder={trading.placeOrder}
            notify={notify}
          />
        </div>

        {/* Bottom: Positions */}
        <Positions
          positions={trading.positions}
          history={trading.history}
          price={market.price}
          onClosePosition={handleClosePosition}
        />
      </div>
    </>
  )
}
