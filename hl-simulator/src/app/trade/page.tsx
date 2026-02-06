"use client";

import { useState, useEffect, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CoinInfoBar } from "@/components/CoinInfoBar";
import { TradingViewChart } from "@/components/TradingViewChart";
import { OrderForm } from "@/components/OrderForm";
import { OrderBook } from "@/components/OrderBook";
import { BottomTabsPanel } from "@/components/BottomTabsPanel";
import { ChartToolbar } from "@/components/ChartToolbar";
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
    <div className="min-h-screen flex flex-col bg-bg">
      <NotificationContainer />

      {/* Header - sticky */}
      <div className="sticky top-0 z-50">
        <Navigation
          balance={totalEquity}
          isConnected={isConnected}
          connectionMode={connectionMode}
          onSignOut={signOut}
        />
      </div>

      {/* Coin Info Bar */}
      <CoinInfoBar
        selectedCoin={coin}
        onSelectCoin={setCoin}
        stats={stats}
        decimals={decimals}
      />

      {/* Main Layout: 2-column grid (chart + sidebar) - sidebar 396px like real HL */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-[1fr_396px]">
        {/* Left column: ChartToolbar + Chart + Bottom Panel */}
        <div className="flex flex-col">
          {/* Chart area with toolbar */}
          <div className="h-[500px] md:h-[calc(100vh-350px)] min-h-[400px] flex">
            {/* Left toolbar */}
            <ChartToolbar />
            {/* Chart */}
            <div className="flex-1">
              <TradingViewChart coin={coin} />
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
              onClosePosition={handleClosePosition}
            />
          </div>
        </div>

        {/* Right Sidebar - OrderForm + OrderBook */}
        <div className="flex flex-col border-l border-brd bg-s1">
          {/* Order Form - scrollable if needed */}
          <div className="flex-shrink-0 border-b border-brd overflow-y-auto max-h-[70vh]">
            <OrderForm
              coin={coin}
              price={price}
              availableBalance={getAvailableBalance()}
              currentPositionSize={currentPosition?.size ?? 0}
              onPlaceOrder={handlePlaceOrder}
            />
          </div>

          {/* Order Book with tabs */}
          <div className="flex-1 min-h-[250px] flex flex-col">
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-brd flex-shrink-0">
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-medium text-t1 border-b-2 border-t1 pb-1">Order Book</span>
                <span className="text-[11px] font-medium text-t3 pb-1 cursor-pointer hover:text-t2">Trades</span>
              </div>
              <div className="flex items-center gap-1.5">
                <select className="bg-s2 border border-brd rounded px-1 py-0.5 text-[10px] text-t2 outline-none">
                  <option>0,001</option>
                  <option>0,01</option>
                  <option>0,1</option>
                  <option>1</option>
                </select>
                <select className="bg-s2 border border-brd rounded px-1 py-0.5 text-[10px] text-t2 outline-none">
                  <option>{coin}</option>
                </select>
                <button className="text-t3 hover:text-t2 text-[13px]">⋮</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <OrderBook
                asks={asks}
                bids={bids}
                midPrice={price}
                decimals={decimals}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer isConnected={isConnected} />

      {/* Mobile bottom nav spacer */}
      <div className="h-14 md:hidden" />
    </div>
  );
}
