"use client";

import { useState, useEffect, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { CoinSelector } from "@/components/CoinSelector";
import { Chart } from "@/components/Chart";
import { OrderBook } from "@/components/OrderBook";
import { RecentTrades } from "@/components/RecentTrades";
import { OrderForm } from "@/components/OrderForm";
import { Positions } from "@/components/Positions";
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

  // Merge allPrices from useMarketData — this now tracks ALL coins automatically
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    // Merge allPrices from WS/polling (all coins) + current coin price
    const merged: Record<string, number> = { ...allPrices };
    if (price) {
      merged[coin] = price;
    }
    setPrices((prev) => {
      // Only update if something actually changed
      const hasChanges = Object.keys(merged).some(
        (k) => prev[k] !== merged[k]
      );
      if (!hasChanges && Object.keys(prev).length === Object.keys(merged).length) {
        return prev;
      }
      return { ...prev, ...merged };
    });
  }, [allPrices, price, coin]);

  // Check liquidations every 5 seconds with fresh prices
  useEffect(() => {
    const timer = setInterval(() => {
      checkLiquidations(prices);
    }, 5000);
    return () => clearInterval(timer);
  }, [checkLiquidations, prices]);

  // Get current position for selected coin
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
    async (position: Position) => {
      const currentPrice = prices[position.coin] || position.entry_price;
      await closePosition(position, currentPrice);
    },
    [closePosition, prices]
  );

  // Show loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-2 border-brd border-t-acc rounded-full animate-spin" />
      </div>
    );
  }

  // Show auth form if not logged in
  if (!user) {
    return <AuthForm />;
  }

  const totalEquity = getTotalEquity(prices);

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <NotificationContainer />

      <Navigation
        balance={totalEquity}
        isConnected={isConnected}
        connectionMode={connectionMode}
        onSignOut={signOut}
      />

      <CoinSelector
        selectedCoin={coin}
        onSelectCoin={setCoin}
        stats={stats}
        decimals={decimals}
      />

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_234px] grid-rows-[1fr_auto] md:grid-rows-[1fr_148px] overflow-hidden">
        {/* Chart */}
        <div className="h-[50vh] md:h-auto min-h-[280px] md:min-h-0 md:row-span-1">
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

        {/* Right panel */}
        <div className="flex flex-col md:row-span-2 overflow-y-auto">
          <div className="flex-1 flex flex-col min-h-0">
            <OrderBook
              asks={asks}
              bids={bids}
              midPrice={price}
              decimals={decimals}
            />
          </div>

          <RecentTrades trades={trades} decimals={decimals} />

          <OrderForm
            coin={coin}
            price={price}
            availableBalance={getAvailableBalance()}
            onPlaceOrder={handlePlaceOrder}
          />
        </div>

        {/* Positions (bottom on desktop, inline on mobile) */}
        <div className="min-h-[148px] md:col-span-1 md:row-start-2">
          <Positions
            positions={positions}
            history={history}
            currentPrices={prices}
            onClosePosition={handleClosePosition}
          />
        </div>
      </div>

      {/* Mobile bottom nav spacer */}
      <div className="h-12 md:hidden" />
    </div>
  );
}
