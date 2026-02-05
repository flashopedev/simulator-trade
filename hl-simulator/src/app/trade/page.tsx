"use client";

import { useState, useEffect, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { CoinInfoBar } from "@/components/CoinInfoBar";
import { Chart } from "@/components/Chart";
import { OrderForm } from "@/components/OrderForm";
import { OrderBookTabs } from "@/components/OrderBookTabs";
import { BottomTabsPanel } from "@/components/BottomTabsPanel";
import { AuthForm } from "@/components/AuthForm";
import { NotificationContainer } from "@/components/Notification";
import { useAuth } from "@/hooks/useAuth";
import { useTrading } from "@/hooks/useTrading";
import { useMarketData } from "@/hooks/useMarketData";
import { COIN_DECIMALS, type SupportedCoin, type Timeframe } from "@/lib/utils";
import type { Position } from "@/lib/supabase/types";

export default function TradePage() {
  const [coin, setCoin] = useState<SupportedCoin>("HYPE");
  const [timeframe, setTimeframe] = useState<Timeframe>("15m");

  const { user, account, loading: authLoading, signOut, updateBalance } = useAuth();

  const {
    positions,
    history,
    orders,
    placeOrder,
    closePosition,
    checkLiquidations,
    getAvailableBalance,
    getTotalEquity,
  } = useTrading({
    accountId: account?.id ?? null,
    balance: account?.balance ?? 10000,
    onBalanceChange: updateBalance,
  });

  const {
    candles,
    price,
    allPrices,
    asks,
    bids,
    trades,
    isConnected,
    isLoading,
    connectionMode,
    status,
    stats,
  } = useMarketData(coin, timeframe);

  const decimals = COIN_DECIMALS[coin] || 2;

  // Merge all prices
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const merged: Record<string, number> = { ...allPrices };
    if (price) merged[coin] = price;
    setPrices((prev) => {
      const hasChanges = Object.keys(merged).some((k) => prev[k] !== merged[k]);
      if (!hasChanges && Object.keys(prev).length === Object.keys(merged).length) return prev;
      return { ...prev, ...merged };
    });
  }, [allPrices, price, coin]);

  // Check liquidations every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => checkLiquidations(prices), 5000);
    return () => clearInterval(timer);
  }, [checkLiquidations, prices]);

  const currentPosition = positions.find((p) => p.coin === coin);

  const handlePlaceOrder = useCallback(
    async (order: {
      side: "Long" | "Short";
      size: number;
      price: number;
      leverage: number;
      orderType: "market" | "limit";
      marginMode: "cross" | "isolated";
    }) => {
      await placeOrder({ ...order, coin });
    },
    [coin, placeOrder]
  );

  const handleClosePosition = useCallback(
    async (position: Position, size?: number) => {
      const currentPrice = prices[position.coin] || position.entry_price;
      await closePosition(position, currentPrice);
    },
    [closePosition, prices]
  );

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-2 border-brd border-t-acc rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const totalEquity = getTotalEquity(prices);

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      <NotificationContainer />

      {/* Header */}
      <Navigation
        balance={totalEquity}
        isConnected={isConnected}
        connectionMode={connectionMode}
        onSignOut={signOut}
      />

      {/* Coin Info Bar */}
      <CoinInfoBar
        selectedCoin={coin}
        onSelectCoin={setCoin}
        stats={stats}
        decimals={decimals}
      />

      {/* Main Layout: Hyperliquid grid */}
      {/* Desktop: [chart | right-sidebar(280px)] over [bottom-panel(200px, full width)] */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-[1fr_280px] md:grid-rows-[1fr_200px] min-h-0 overflow-hidden">
        {/* Chart area */}
        <div className="h-[45vh] md:h-auto md:row-span-1 md:col-span-1 min-h-0 overflow-hidden">
          <Chart
            candles={candles}
            currentPrice={price}
            entryPrice={currentPosition?.entry_price}
            liquidationPrice={currentPosition?.liquidation_price}
            coin={coin}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            isLoading={isLoading}
            status={status}
          />
        </div>

        {/* Right Sidebar: Order Form + Order Book/Trades (280px) */}
        <div className="md:row-span-2 md:col-start-2 flex flex-col border-l border-brd overflow-y-auto bg-s1">
          {/* Order Form */}
          <OrderForm
            coin={coin}
            price={price}
            availableBalance={getAvailableBalance()}
            onPlaceOrder={handlePlaceOrder}
          />

          {/* Order Book / Trades tabs */}
          <OrderBookTabs
            asks={asks}
            bids={bids}
            midPrice={price}
            trades={trades}
            decimals={decimals}
          />
        </div>

        {/* Bottom Panel (200px fixed height, full width) */}
        <div className="h-[200px] md:h-auto md:col-span-1 md:row-start-2 border-t border-brd overflow-hidden">
          <BottomTabsPanel
            positions={positions}
            history={history}
            orders={orders}
            currentPrices={prices}
            balance={account?.balance ?? 10000}
            onClosePosition={handleClosePosition}
          />
        </div>
      </div>

      {/* Mobile bottom nav spacer */}
      <div className="h-12 md:hidden" />
    </div>
  );
}
