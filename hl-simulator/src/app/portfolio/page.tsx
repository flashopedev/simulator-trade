"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AuthForm } from "@/components/AuthForm";
import { NotificationContainer } from "@/components/Notification";
import { useAuth } from "@/hooks/useAuth";
import { useTrading } from "@/hooks/useTrading";
import {
  cn,
  formatNumber,
  formatPnl,
  calculatePnl,
  calculateRoe,
  COIN_DECIMALS,
  FALLBACK_PRICES,
} from "@/lib/utils";
import { fetchAllMids } from "@/lib/hyperliquid";
import type { Position } from "@/lib/supabase/types";
import { ChevronDown } from "lucide-react";

type BottomTab = "balances" | "positions" | "openOrders" | "twap" | "tradeHistory" | "fundingHistory" | "orderHistory" | "interest" | "deposits";

const HEADER_BUTTONS = [
  "Link Staking",
  "Swap Stablecoins",
  "Perps ⇌ Spot",
  "EVM ⇌ Core",
  "Portfolio Margin",
  "Send",
  "Withdraw",
  "Deposit",
];

const BOTTOM_TABS: { key: BottomTab; label: string; disabled?: boolean }[] = [
  { key: "balances", label: "Balances" },
  { key: "positions", label: "Positions" },
  { key: "openOrders", label: "Open Orders" },
  { key: "twap", label: "TWAP", disabled: true },
  { key: "tradeHistory", label: "Trade History" },
  { key: "fundingHistory", label: "Funding History" },
  { key: "orderHistory", label: "Order History" },
  { key: "interest", label: "Interest", disabled: true },
  { key: "deposits", label: "Deposits and Withdrawals", disabled: true },
];

export default function PortfolioPage() {
  const { user, account, loading: authLoading, signOut, updateBalance } = useAuth();
  const [prices, setPrices] = useState<Record<string, number>>(FALLBACK_PRICES);
  const [activeTab, setActiveTab] = useState<BottomTab>("positions");
  const [chartTab, setChartTab] = useState<"value" | "pnl">("value");

  const {
    positions,
    history,
    orders,
    getAvailableBalance,
    getTotalEquity,
    closePosition,
  } = useTrading({
    accountId: account?.id ?? null,
    balance: account?.balance ?? 10000,
    onBalanceChange: updateBalance,
  });

  // Real price polling via REST API
  useEffect(() => {
    let active = true;
    const pollPrices = async () => {
      try {
        const mids = await fetchAllMids();
        if (mids && active) {
          const updated: Record<string, number> = { ...FALLBACK_PRICES };
          Object.entries(mids).forEach(([coin, mid]) => {
            if (mid) updated[coin] = parseFloat(mid);
          });
          setPrices(updated);
        }
      } catch {
        // Keep existing prices on error
      }
    };
    pollPrices();
    const timer = setInterval(pollPrices, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

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
  const availableBalance = getAvailableBalance();

  // Calculate total unrealized PnL
  let totalUnrealizedPnl = 0;
  positions.forEach((p) => {
    const currentPrice = prices[p.coin] || p.entry_price;
    totalUnrealizedPnl += calculatePnl(
      p.entry_price,
      currentPrice,
      p.size,
      p.side === "Long"
    );
  });

  const handleClosePosition = async (position: Position) => {
    const currentPrice = prices[position.coin] || position.entry_price;
    await closePosition(position, currentPrice);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <NotificationContainer />
      <Navigation balance={totalEquity} isConnected={true} onSignOut={signOut} />

      <div className="flex-1 flex flex-col pb-16">
        {/* Header with title and buttons */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brd">
          <h1 className="text-[28px] font-medium text-t1">Portfolio</h1>
          {/* 2.1: All buttons same style */}
          <div className="flex items-center gap-2 flex-wrap">
            {HEADER_BUTTONS.map((btn) => (
              <button
                key={btn}
                className="px-4 py-2 text-[13px] rounded-lg border border-brd text-acc hover:bg-s2 transition-colors"
              >
                {btn}
              </button>
            ))}
          </div>
        </div>

        {/* 3-column grid section */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_1fr] gap-4 px-6 py-4">
          {/* Left column - two cards */}
          <div className="flex flex-col gap-4">
            {/* 14 Day Volume - 2.2 & 2.3: no uppercase, accent left border */}
            <div className="border border-brd border-l-2 border-l-acc rounded-lg p-5">
              <div className="text-[13px] text-t3">14 Day Volume</div>
              <div className="text-[32px] font-medium text-t1 mt-2">$0</div>
              <button className="text-[13px] text-acc mt-2 hover:underline">View Volume</button>
            </div>

            {/* Fees - 2.2 & 2.3: no uppercase, accent left border */}
            <div className="border border-brd border-l-2 border-l-acc rounded-lg p-5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-t3">Fees (Taker / Maker)</span>
                <button className="flex items-center gap-1 text-[12px] text-t2">
                  Perps <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[28px] font-medium text-t1 mt-2">0.0350% / 0.0100%</div>
              <button className="text-[13px] text-acc mt-2 hover:underline">View Fee Schedule</button>
            </div>
          </div>

          {/* Middle column - stats table with 2.3 accent border */}
          <div className="border border-brd border-l-2 border-l-acc rounded-lg p-5">
            <div className="flex items-center gap-4 mb-4">
              <button className="flex items-center gap-1 text-[13px] text-t1">
                Perps + Spot + Vaults <ChevronDown className="w-3 h-3" />
              </button>
              <button className="flex items-center gap-1 text-[13px] text-t1">
                All-time <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-0">
              {[
                { label: "PNL", value: formatPnl(totalUnrealizedPnl), color: totalUnrealizedPnl >= 0 ? "text-grn" : "text-red" },
                { label: "Volume", value: "$0.00" },
                { label: "Max Drawdown", value: "0.00%" },
                { label: "Total Equity", value: `$${formatNumber(totalEquity)}` },
                { label: "Perps Account Equity", value: `$${formatNumber(totalEquity)}` },
                { label: "Spot Account Equity", value: "$0.00" },
                { label: "Earn Balance", value: "$0.00" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-1.5 text-[13px]">
                  <span className="text-t3">{row.label}</span>
                  <span className={cn("font-tabular", row.color || "text-t1")}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column - chart with 2.3 accent border */}
          <div className="border border-brd border-l-2 border-l-acc rounded-lg p-5">
            <div className="flex items-center gap-4 mb-4 border-b border-brd">
              <button
                onClick={() => setChartTab("value")}
                className={cn(
                  "pb-2 text-[13px] border-b-2 transition-colors",
                  chartTab === "value" ? "text-t1 border-acc" : "text-t3 border-transparent"
                )}
              >
                Account Value
              </button>
              <button
                onClick={() => setChartTab("pnl")}
                className={cn(
                  "pb-2 text-[13px] border-b-2 transition-colors",
                  chartTab === "pnl" ? "text-t1 border-acc" : "text-t3 border-transparent"
                )}
              >
                PNL
              </button>
            </div>
            {/* 2.4: SVG chart placeholder */}
            <div className="h-[180px] rounded">
              <svg viewBox="0 0 300 150" className="w-full h-full">
                <line x1="40" y1="140" x2="290" y2="140" stroke="#1a1f2e" strokeWidth="1" />
                <line x1="40" y1="10" x2="40" y2="140" stroke="#1a1f2e" strokeWidth="1" />
                {/* Y axis labels */}
                <text x="10" y="140" fill="#6b7280" fontSize="10">0</text>
                <text x="10" y="100" fill="#6b7280" fontSize="10">1</text>
                <text x="10" y="60" fill="#6b7280" fontSize="10">2</text>
                <text x="10" y="20" fill="#6b7280" fontSize="10">3</text>
                {/* Grid lines */}
                <line x1="40" y1="100" x2="290" y2="100" stroke="#1a1f2e" strokeWidth="0.5" strokeDasharray="4" />
                <line x1="40" y1="60" x2="290" y2="60" stroke="#1a1f2e" strokeWidth="0.5" strokeDasharray="4" />
                <line x1="40" y1="20" x2="290" y2="20" stroke="#1a1f2e" strokeWidth="0.5" strokeDasharray="4" />
                {/* Accent line */}
                <polyline points="40,130 100,120 160,90 220,70 290,40" fill="none" stroke="#00d8c4" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom tabs section */}
        <div className="flex-1 flex flex-col px-6">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-brd">
            <div className="flex items-center gap-1 overflow-x-auto">
              {BOTTOM_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => !tab.disabled && setActiveTab(tab.key)}
                  disabled={tab.disabled}
                  className={cn(
                    "px-3 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors",
                    activeTab === tab.key
                      ? "text-t1 border-t1"
                      : tab.disabled
                      ? "text-t4 border-transparent cursor-default"
                      : "text-t3 border-transparent hover:text-t2"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1 text-[12px] text-t3 hover:text-t2">
              Filter <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 py-4">
            {/* Positions Tab */}
            {activeTab === "positions" && (
              <div>
                {positions.length === 0 ? (
                  <div className="text-center py-12 text-t3 text-[13px]">
                    No open positions yet
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead>
                        {/* 2.5: dotted underline on PNL, Margin, Funding + 2.6: Position Value ▾ */}
                        <tr className="text-t3 text-left border-b border-brd">
                          <th className="py-2 font-medium">Coin</th>
                          <th className="py-2 font-medium">Size</th>
                          <th className="py-2 font-medium">Position Value ▾</th>
                          <th className="py-2 font-medium">Entry Price</th>
                          <th className="py-2 font-medium">Mark Price</th>
                          <th className="py-2 font-medium border-b border-dotted border-t4 cursor-help">PNL (ROE %)</th>
                          <th className="py-2 font-medium">Liq. Price</th>
                          <th className="py-2 font-medium border-b border-dotted border-t4 cursor-help">Margin</th>
                          <th className="py-2 font-medium border-b border-dotted border-t4 cursor-help">Funding</th>
                          <th className="py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* 2.7: alternating row colors */}
                        {positions.map((p, i) => {
                          const decimals = COIN_DECIMALS[p.coin] || 2;
                          const markPrice = prices[p.coin] || p.entry_price;
                          const positionValue = p.size * markPrice;
                          const margin = positionValue / p.leverage;
                          const pnl = calculatePnl(p.entry_price, markPrice, p.size, p.side === "Long");
                          const roe = calculateRoe(pnl, p.entry_price, p.size, p.leverage);

                          return (
                            <tr
                              key={p.id}
                              className={cn(
                                "border-b border-brd hover:bg-s2/50 transition-colors",
                                i % 2 === 1 ? "bg-s2/30" : ""
                              )}
                            >
                              <td className="py-2.5">
                                <span className={cn(
                                  "font-medium",
                                  p.side === "Long" ? "text-grn" : "text-red"
                                )}>
                                  {p.coin} {p.leverage}x {p.side === "Long" ? "L" : "S"}
                                </span>
                              </td>
                              <td className="py-2.5 font-tabular text-t1">{p.size.toFixed(2)}</td>
                              <td className="py-2.5 font-tabular text-t1">${formatNumber(positionValue)}</td>
                              <td className="py-2.5 font-tabular text-t2">{p.entry_price.toFixed(decimals)}</td>
                              <td className="py-2.5 font-tabular text-t2">{markPrice.toFixed(decimals)}</td>
                              <td className={cn("py-2.5 font-tabular", pnl >= 0 ? "text-grn" : "text-red")}>
                                {formatPnl(pnl)} ({roe >= 0 ? "+" : ""}{roe.toFixed(1)}%)
                              </td>
                              <td className="py-2.5 font-tabular text-red">{p.liquidation_price.toFixed(decimals)}</td>
                              <td className="py-2.5 font-tabular text-t2">${formatNumber(margin)}</td>
                              <td className="py-2.5 text-t3">—</td>
                              <td className="py-2.5">
                                <button
                                  onClick={() => handleClosePosition(p)}
                                  className="px-3 py-1 bg-s3 border border-brd rounded text-[11px] font-medium hover:bg-red/10 hover:border-red/25 hover:text-red transition-colors"
                                >
                                  Close
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Balances Tab */}
            {activeTab === "balances" && (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-t3 text-left border-b border-brd">
                      <th className="py-2 font-medium">Coin</th>
                      <th className="py-2 font-medium">Total Balance</th>
                      <th className="py-2 font-medium">Available Balance</th>
                      <th className="py-2 font-medium">In Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-brd">
                      <td className="py-2.5 font-medium text-t1">USDC</td>
                      <td className="py-2.5 font-tabular text-t1">${formatNumber(account?.balance ?? 10000)}</td>
                      <td className="py-2.5 font-tabular text-t2">${formatNumber(availableBalance)}</td>
                      <td className="py-2.5 font-tabular text-t2">$0.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Open Orders Tab */}
            {activeTab === "openOrders" && (
              <div>
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-t3 text-[13px]">
                    No open orders
                  </div>
                ) : (
                  <div className="text-center py-12 text-t3 text-[13px]">
                    {orders.length} open order(s)
                  </div>
                )}
              </div>
            )}

            {/* Trade History Tab */}
            {activeTab === "tradeHistory" && (
              <div>
                {history.length === 0 ? (
                  <div className="text-center py-12 text-t3 text-[13px]">
                    No trade history yet
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="text-t3 text-left border-b border-brd">
                          <th className="py-2 font-medium">Time</th>
                          <th className="py-2 font-medium">Coin</th>
                          <th className="py-2 font-medium">Side</th>
                          <th className="py-2 font-medium">Size</th>
                          <th className="py-2 font-medium">Entry</th>
                          <th className="py-2 font-medium">Exit</th>
                          <th className="py-2 font-medium">PNL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.slice(0, 50).map((h, i) => {
                          const decimals = COIN_DECIMALS[h.coin] || 2;
                          return (
                            <tr
                              key={h.id}
                              className={cn(
                                "border-b border-brd hover:bg-s2/50 transition-colors",
                                i % 2 === 1 ? "bg-s2/30" : ""
                              )}
                            >
                              <td className="py-2.5 text-t3">{new Date(h.closed_at).toLocaleString()}</td>
                              <td className="py-2.5 font-medium text-t1">{h.coin}{h.liquidated && " 💀"}</td>
                              <td className={cn("py-2.5", h.side === "Long" ? "text-grn" : "text-red")}>
                                {h.leverage}x {h.side}
                              </td>
                              <td className="py-2.5 font-tabular text-t2">{h.size.toFixed(4)}</td>
                              <td className="py-2.5 font-tabular text-t2">{h.entry_price.toFixed(decimals)}</td>
                              <td className="py-2.5 font-tabular text-t2">{h.exit_price.toFixed(decimals)}</td>
                              <td className={cn("py-2.5 font-tabular font-medium", h.pnl >= 0 ? "text-grn" : "text-red")}>
                                {formatPnl(h.pnl)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Funding History Tab */}
            {activeTab === "fundingHistory" && (
              <div className="text-center py-12 text-t3 text-[13px]">
                No funding history
              </div>
            )}

            {/* Order History Tab */}
            {activeTab === "orderHistory" && (
              <div className="text-center py-12 text-t3 text-[13px]">
                No order history
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer isConnected={true} />
    </div>
  );
}
