"use client";

import { useState, useEffect, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CoinInfoBar } from "@/components/CoinInfoBar";
import { TradingViewChart } from "@/components/TradingViewChart";
import { OrderForm } from "@/components/OrderForm";
import { OrderBookTabs } from "@/components/OrderBookTabs";
import { BottomTabsPanel } from "@/components/BottomTabsPanel";
import { AuthForm } from "@/components/AuthForm";
import { NotificationContainer } from "@/components/Notification";
import { ChartToolbar } from "@/components/ChartToolbar";
import { ChartTopBar } from "@/components/ChartTopBar";
import { ChartBottomBar } from "@/components/ChartBottomBar";
import { ChartLegendOverlay } from "@/components/ChartLegendOverlay";
import { PositionOverlay } from "@/components/PositionOverlay";
import { useAuth } from "@/hooks/useAuth";
import { useTrading } from "@/hooks/useTrading";
import { useMarketData } from "@/hooks/useMarketData";
import { useCoinStats } from "@/hooks/useCoinStats";
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
  const coinStats = useCoinStats(coin);

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
      orderType: "market" | "limit" | "pro";
      marginMode: "cross" | "isolated";
      tpPrice?: number;
      slPrice?: number;
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
        price={price}
        coinStats={coinStats}
        decimals={decimals}
      />

      {/* Main Layout: 2-column grid (chart + sidebar) - sidebar 396px like real HL */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-[1fr_396px] min-h-0">
        {/* Left column: Chart area + Bottom Panel */}
        <div className="flex flex-col min-h-0">
          {/* Chart area with toolbar */}
          <div className="flex-1 flex min-h-0">
            {/* Left toolbar - matching real HL */}
            <ChartToolbar />
            {/* Chart column: TopBar + Chart + BottomBar */}
            <div className="flex-1 flex flex-col min-h-0">
              <ChartTopBar timeframe={timeframe} onTimeframeChange={setTimeframe} />
              <div className="flex-1 relative min-h-0">
                <ChartLegendOverlay coin={coin} timeframe={timeframe} price={price} />
                <TradingViewChart coin={coin} timeframe={timeframe} />
                <PositionOverlay position={currentPosition} currentPrice={price} coin={coin} timeframe={timeframe} />
              </div>
              <ChartBottomBar />
            </div>
          </div>

          {/* Bottom Panel */}
          <div className="h-[200px] flex-shrink-0 border-t border-brd overflow-auto">
            <BottomTabsPanel
              positions={positions}
              history={history}
              orders={orders}
              currentPrices={prices}
              balance={account?.balance ?? 10000}
              totalEquity={totalEquity}
              availableBalance={getAvailableBalance(prices)}
              onClosePosition={handleClosePosition}
            />
          </div>
        </div>

        {/* Right Sidebar - OrderForm + OrderBook */}
        <div className="flex flex-col border-l border-brd bg-s1 min-h-0">
          {/* Order Form - scrollable if needed */}
          <div className="flex-shrink-0 border-b border-brd overflow-y-auto max-h-[60vh]">
            <OrderForm
              coin={coin}
              price={price}
              availableBalance={getAvailableBalance(prices)}
              totalBalance={account?.balance ?? 10000}
              currentPositionSize={currentPosition?.size ?? 0}
              onPlaceOrder={handlePlaceOrder}
            />
          </div>

          {/* Order Book / Trades with tabs */}
          <OrderBookTabs
            asks={asks}
            bids={bids}
            midPrice={price}
            trades={trades}
            decimals={decimals}
          />
        </div>
      </div>

      {/* Footer */}
      <Footer isConnected={isConnected} />
    </div>
  );
}
