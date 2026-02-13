"use client";

import { useState, useEffect, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { CoinInfoBar } from "@/components/CoinInfoBar";
import { TradingViewChart } from "@/components/TradingViewChart";
import { OrderForm } from "@/components/OrderForm";
import { OrderBook } from "@/components/OrderBook";
import { BottomTabsPanel } from "@/components/BottomTabsPanel";
import { AuthForm } from "@/components/AuthForm";
import { NotificationContainer } from "@/components/Notification";
import { ChartToolbar } from "@/components/ChartToolbar";
import { PositionOverlay } from "@/components/PositionOverlay";
import { ChartLegendOverlay } from "@/components/ChartLegendOverlay";
import { useAuth } from "@/hooks/useAuth";
import { useTrading } from "@/hooks/useTrading";
import { useMarketData } from "@/hooks/useMarketData";
import { useCoinStats } from "@/hooks/useCoinStats";
import { COIN_DECIMALS, coinDisplayName, type Timeframe } from "@/lib/utils";
import type { Position } from "@/lib/supabase/types";

export default function TradePage() {
  const [coin, setCoin] = useState<string>("HYPE");
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

      {/* Main Layout: 2-column grid with gap borders — matches production exactly */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-[1fr_396px] gap-[3px] bg-gbg p-[3px] pt-[3px]">
        {/* Left column: Star + CoinInfo + Chart + Bottom Panel */}
        <div className="flex flex-col min-w-0 min-h-0 gap-[3px]">
          {/* CoinInfoBar renders: star bar + info bar + modal (Fragment) */}
          <CoinInfoBar
            selectedCoin={coin}
            onSelectCoin={setCoin}
            price={price}
            coinStats={coinStats}
            decimals={decimals}
          />

          {/* Chart area — fixed height with rounded corners */}
          <div className="h-[568px] flex-shrink-0 flex flex-col rounded-[5px] overflow-hidden bg-[#0f1a1f]">
            <div className="flex-1 flex">
              {/* Left toolbar */}
              <ChartToolbar />
              {/* Chart + overlays */}
              <div className="flex-1 relative">
                <TradingViewChart coin={coin} timeframe={timeframe} />
                <ChartLegendOverlay
                  coin={coin}
                  timeframe={timeframe}
                  price={price}
                />
                <PositionOverlay
                  position={currentPosition}
                  currentPrice={price}
                  coin={coin}
                  timeframe={timeframe}
                />
              </div>
            </div>
          </div>

          {/* Bottom Panel — fixed height, rounded */}
          <div className="h-[327px] flex-shrink-0 overflow-auto bg-s1 rounded-[5px]">
            <BottomTabsPanel
              positions={positions}
              history={history}
              orders={orders}
              currentPrices={prices}
              balance={account?.balance ?? 10000}
              totalEquity={totalEquity}
              availableBalance={getAvailableBalance(prices)}
              onClosePosition={handleClosePosition}
              onSelectCoin={setCoin}
            />
          </div>
        </div>

        {/* Right Sidebar - OrderForm + OrderBook — gap borders */}
        <div className="flex flex-col gap-[3px]">
          {/* Order Form — fixed height, rounded */}
          <div className="h-[677px] flex-shrink-0 flex flex-col rounded-[5px] bg-s1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <OrderForm
                coin={coin}
                price={price}
                availableBalance={getAvailableBalance(prices)}
                totalBalance={account?.balance ?? 10000}
                currentPositionSize={currentPosition?.size ?? 0}
                onPlaceOrder={handlePlaceOrder}
              />
            </div>
          </div>

          {/* Order Book — fixed height, rounded */}
          <div className="h-[670px] flex-shrink-0 flex flex-col rounded-[5px] bg-s1 overflow-hidden">
            {/* Tabs: Order Book / Trades */}
            <div className="grid flex-shrink-0 border-b border-[#303030]">
              <div className="relative grid grid-cols-2">
                <span className="text-[13px] font-medium text-t1 text-center py-3 cursor-pointer border-b-2 border-t1">Order Book</span>
                <span className="text-[13px] font-medium text-t3 text-center py-3 cursor-pointer hover:text-t2">Trades</span>
              </div>
            </div>
            {/* Filter row */}
            <div className="flex items-center justify-between px-2.5 h-[31px] flex-shrink-0">
              <div className="flex items-center gap-1">
                <select className="bg-transparent text-[11px] text-t2 outline-none cursor-pointer">
                  <option>1</option>
                  <option>0,1</option>
                  <option>0,01</option>
                  <option>0,001</option>
                </select>
              </div>
              <div className="flex items-center">
                <select className="bg-transparent text-[11px] text-t2 outline-none cursor-pointer">
                  <option>USDC</option>
                  <option>{coinDisplayName(coin)}</option>
                </select>
              </div>
            </div>
            {/* Order book data */}
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
