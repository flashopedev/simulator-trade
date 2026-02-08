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
import { ChartTopBar } from "@/components/ChartTopBar";
import { ChartBottomBar } from "@/components/ChartBottomBar";
import { useAuth } from "@/hooks/useAuth";
import { useTrading } from "@/hooks/useTrading";
import { useMarketData } from "@/hooks/useMarketData";
import { useBinancePrices } from "@/hooks/useBinancePrices";
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
    cancelOrder,
    checkLiquidations,
    getAvailableBalance,
    getTotalEquity,
  } = useTrading({
    accountId: account?.id ?? null,
    balance: account?.balance ?? 10000,
    onBalanceChange: updateBalance,
  });

  const {
    asks,
    bids,
    isConnected,
    connectionMode,
  } = useMarketData(coin, timeframe);

  // Binance prices — stable, reliable source for ALL coins
  const { prices: binancePrices, connected: binanceConnected } = useBinancePrices();

  // Per-coin stats from Binance Futures (24h change, volume, OI, funding, oracle)
  const coinStats = useCoinStats(coin);

  const decimals = COIN_DECIMALS[coin] ?? 2;
  const price = binancePrices[coin] ?? null;

  // Use Binance prices directly — no merging needed
  const prices = binancePrices;

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
          isConnected={binanceConnected || isConnected}
          connectionMode={binanceConnected ? "ws" : connectionMode}
          onSignOut={signOut}
        />
      </div>

      {/* Main Layout: 2-column grid with 3px gaps like real HL.
          Containers have rounded-[5px] corners, NO border lines.
          Gap bg = #1B2429 (gbg), container bg = #0F1A1F (s1). */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-[1fr_396px] gap-[3px] bg-gbg p-[3px] pt-[3px]">
        {/* Left column: Star Row + Coin Info + Chart + Bottom Panel */}
        <div className="flex flex-col min-w-0 min-h-0 gap-[3px]">
          {/* Coin Info Bar (includes star row) — left column only, each with rounded corners */}
          <CoinInfoBar
            selectedCoin={coin}
            onSelectCoin={setCoin}
            price={price}
            coinStats={coinStats}
            decimals={decimals}
          />

          {/* Chart area — matches real HL layout:
              Top bar (38px) + [Left toolbar (52px) | Chart canvas | Right price scale] + Bottom bar (38px)
              All wrapped in a single rounded container */}
          <div className="h-[568px] flex-shrink-0 flex flex-col rounded-[5px] bg-[#0f1a1f] overflow-hidden">
            {/* Top bar with timeframes, candle type, indicators */}
            <ChartTopBar timeframe={timeframe} onTimeframeChange={setTimeframe} />
            {/* Middle: toolbar + chart */}
            <div className="flex-1 flex min-h-0">
              {/* Left drawing toolbar — 52px wide like real HL */}
              <ChartToolbar />
              {/* Chart canvas */}
              <div className="flex-1 min-w-0">
                <TradingViewChart coin={coin} timeframe={timeframe} />
              </div>
            </div>
            {/* Bottom bar with range buttons, time, log/auto */}
            <ChartBottomBar />
          </div>

          {/* Bottom Panel */}
          <div className="h-[327px] flex-shrink-0 overflow-auto rounded-[5px] bg-s1">
            <BottomTabsPanel
              positions={positions}
              history={history}
              orders={orders}
              currentPrices={prices}
              balance={account?.balance ?? 10000}
              onClosePosition={handleClosePosition}
              onCancelOrder={cancelOrder}
            />
          </div>
        </div>

        {/* Right Sidebar - two separate blocks like real HL:
            Top block (OrderForm): same height as star+coininfo+chart = 677px
            Bottom block (OrderBook): same height as bottom panel = 327px */}
        <div className="flex flex-col gap-[3px]">
          {/* Top: Order Form — h=677px matches star(40)+gap(3)+coinInfo(63)+gap(3)+chart(568) */}
          <div className="h-[677px] flex-shrink-0 flex flex-col rounded-[5px] bg-s1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <OrderForm
                coin={coin}
                price={price}
                availableBalance={getAvailableBalance(prices)}
                currentPositionSize={currentPosition?.size ?? 0}
                onPlaceOrder={handlePlaceOrder}
              />
            </div>
          </div>

          {/* Bottom: Order Book — h=670px like real HL */}
          <div className="h-[670px] flex-shrink-0 flex flex-col rounded-[5px] bg-s1 overflow-hidden">
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-brd flex-shrink-0">
              <div className="flex items-center gap-4">
                <span className="text-[12px] font-normal text-t1 border-b-2 border-t1 pb-1">Order Book</span>
                <span className="text-[12px] font-normal text-t3 pb-1 cursor-pointer hover:text-t2">Trades</span>
              </div>
              <div className="flex items-center gap-1.5">
                <select className="bg-s2 border border-brd rounded px-1 py-0.5 text-[12px] text-t2 outline-none">
                  <option>0,001</option>
                  <option>0,01</option>
                  <option>0,1</option>
                  <option>1</option>
                </select>
                <select className="bg-s2 border border-brd rounded px-1 py-0.5 text-[12px] text-t2 outline-none">
                  <option>{coin}</option>
                </select>
                <button className="text-t3 hover:text-t2 text-[12px]">⋮</button>
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
      <Footer isConnected={binanceConnected || isConnected} />

      {/* Mobile bottom nav spacer */}
      <div className="h-14 md:hidden" />
    </div>
  );
}
