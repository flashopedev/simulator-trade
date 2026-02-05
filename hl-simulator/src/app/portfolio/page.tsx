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
import { TrendingUp, TrendingDown, Wallet, BarChart3, History, PieChart } from "lucide-react";

type PortfolioTab = "overview" | "positions" | "history" | "balances";

export default function PortfolioPage() {
  const { user, account, loading: authLoading, signOut, updateBalance } = useAuth();
  const [prices, setPrices] = useState<Record<string, number>>(FALLBACK_PRICES);
  const [activeTab, setActiveTab] = useState<PortfolioTab>("overview");

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
  const usedMargin = totalEquity - availableBalance;
  const marginRatio = totalEquity > 0 ? (usedMargin / totalEquity) * 100 : 0;

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

  // Calculate total realized PnL
  const totalRealizedPnl = history.reduce((sum, h) => sum + h.pnl, 0);

  const handleClosePosition = async (position: Position) => {
    const currentPrice = prices[position.coin] || position.entry_price;
    await closePosition(position, currentPrice);
  };

  const tabs: { key: PortfolioTab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <PieChart className="w-4 h-4" /> },
    { key: "positions", label: "Positions", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "history", label: "History", icon: <History className="w-4 h-4" /> },
    { key: "balances", label: "Balances", icon: <Wallet className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <NotificationContainer />
      <Navigation balance={totalEquity} isConnected={true} onSignOut={signOut} />

      <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-t1">Portfolio</h1>
          <div className="flex items-center gap-2 text-[11px] text-t3">
            <span>Last updated:</span>
            <span className="text-t2">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-brd">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-[12px] font-medium border-b-2 transition-colors",
                activeTab === tab.key
                  ? "text-t1 border-acc"
                  : "text-t3 border-transparent hover:text-t2"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Top Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Equity"
                value={`$${formatNumber(totalEquity)}`}
                icon={<Wallet className="w-5 h-5 text-acc" />}
              />
              <StatCard
                label="Available Balance"
                value={`$${formatNumber(availableBalance)}`}
                icon={<BarChart3 className="w-5 h-5 text-blu" />}
              />
              <StatCard
                label="Unrealized PnL"
                value={formatPnl(totalUnrealizedPnl)}
                color={totalUnrealizedPnl >= 0 ? "text-grn" : "text-red"}
                icon={totalUnrealizedPnl >= 0 ?
                  <TrendingUp className="w-5 h-5 text-grn" /> :
                  <TrendingDown className="w-5 h-5 text-red" />
                }
              />
              <StatCard
                label="Realized PnL"
                value={formatPnl(totalRealizedPnl)}
                color={totalRealizedPnl >= 0 ? "text-grn" : "text-red"}
                icon={totalRealizedPnl >= 0 ?
                  <TrendingUp className="w-5 h-5 text-grn" /> :
                  <TrendingDown className="w-5 h-5 text-red" />
                }
              />
            </div>

            {/* Margin Overview */}
            <div className="bg-s1 border border-brd rounded-lg p-4">
              <h3 className="text-[13px] font-semibold text-t1 mb-4">Margin Overview</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-[10px] text-t4 uppercase tracking-wide mb-1">Used Margin</div>
                  <div className="text-[15px] font-bold font-tabular text-t1">${formatNumber(usedMargin)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-t4 uppercase tracking-wide mb-1">Free Margin</div>
                  <div className="text-[15px] font-bold font-tabular text-t1">${formatNumber(availableBalance)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-t4 uppercase tracking-wide mb-1">Margin Ratio</div>
                  <div className={cn(
                    "text-[15px] font-bold font-tabular",
                    marginRatio > 80 ? "text-red" : marginRatio > 50 ? "text-yellow-500" : "text-grn"
                  )}>
                    {marginRatio.toFixed(2)}%
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="h-2 bg-s3 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      marginRatio > 80 ? "bg-red" : marginRatio > 50 ? "bg-yellow-500" : "bg-grn"
                    )}
                    style={{ width: `${Math.min(marginRatio, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Positions Preview */}
            {positions.length > 0 && (
              <div className="bg-s1 border border-brd rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-semibold text-t1">Open Positions ({positions.length})</h3>
                  <button
                    onClick={() => setActiveTab("positions")}
                    className="text-[11px] text-acc hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-2">
                  {positions.slice(0, 3).map((p) => {
                    const markPrice = prices[p.coin] || p.entry_price;
                    const pnl = calculatePnl(p.entry_price, markPrice, p.size, p.side === "Long");
                    return (
                      <div key={p.id} className="flex items-center justify-between py-2 border-b border-brd last:border-0">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-[12px] font-semibold",
                            p.side === "Long" ? "text-grn" : "text-red"
                          )}>
                            {p.coin} {p.leverage}x {p.side[0]}
                          </span>
                          <span className="text-[11px] text-t3">{p.size.toFixed(2)}</span>
                        </div>
                        <span className={cn(
                          "text-[12px] font-semibold font-tabular",
                          pnl >= 0 ? "text-grn" : "text-red"
                        )}>
                          {formatPnl(pnl)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Positions Tab */}
        {activeTab === "positions" && (
          <div className="bg-s1 border border-brd rounded-lg p-4">
            <h3 className="text-[13px] font-semibold text-t1 mb-4">Open Positions ({positions.length})</h3>

            {positions.length === 0 ? (
              <div className="text-center py-12 text-t3 text-[12px]">
                No open positions. Start trading to see your positions here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-t4 text-left border-b border-brd">
                      <th className="py-3 font-medium">Market</th>
                      <th className="py-3 font-medium">Side</th>
                      <th className="py-3 font-medium">Size</th>
                      <th className="py-3 font-medium">Entry Price</th>
                      <th className="py-3 font-medium">Mark Price</th>
                      <th className="py-3 font-medium">Liq. Price</th>
                      <th className="py-3 font-medium">PnL</th>
                      <th className="py-3 font-medium">ROE</th>
                      <th className="py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p) => {
                      const decimals = COIN_DECIMALS[p.coin] || 2;
                      const markPrice = prices[p.coin] || p.entry_price;
                      const pnl = calculatePnl(p.entry_price, markPrice, p.size, p.side === "Long");
                      const roe = calculateRoe(pnl, p.entry_price, p.size, p.leverage);

                      return (
                        <tr key={p.id} className="border-b border-brd hover:bg-s2 transition-colors">
                          <td className="py-3 font-medium text-t1">{p.coin}-PERP</td>
                          <td className={cn("py-3 font-bold", p.side === "Long" ? "text-grn" : "text-red")}>
                            {p.leverage}x {p.side}
                          </td>
                          <td className="py-3 font-tabular text-t2">{p.size.toFixed(4)}</td>
                          <td className="py-3 font-tabular text-t2">{p.entry_price.toFixed(decimals)}</td>
                          <td className="py-3 font-tabular text-t2">{markPrice.toFixed(decimals)}</td>
                          <td className="py-3 font-tabular text-red">{p.liquidation_price.toFixed(decimals)}</td>
                          <td className={cn("py-3 font-semibold font-tabular", pnl >= 0 ? "text-grn" : "text-red")}>
                            {formatPnl(pnl)}
                          </td>
                          <td className={cn("py-3 font-tabular", roe >= 0 ? "text-grn" : "text-red")}>
                            {roe >= 0 ? "+" : ""}{roe.toFixed(2)}%
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => handleClosePosition(p)}
                              className="px-3 py-1.5 bg-s3 border border-brd rounded text-[10px] font-semibold hover:bg-red/10 hover:border-red/25 hover:text-red transition-colors"
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

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="bg-s1 border border-brd rounded-lg p-4">
            <h3 className="text-[13px] font-semibold text-t1 mb-4">Trade History</h3>

            {history.length === 0 ? (
              <div className="text-center py-12 text-t3 text-[12px]">
                No trade history yet. Close some positions to see your history here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-t4 text-left border-b border-brd">
                      <th className="py-3 font-medium">Time</th>
                      <th className="py-3 font-medium">Market</th>
                      <th className="py-3 font-medium">Side</th>
                      <th className="py-3 font-medium">Size</th>
                      <th className="py-3 font-medium">Entry</th>
                      <th className="py-3 font-medium">Exit</th>
                      <th className="py-3 font-medium">PnL</th>
                      <th className="py-3 font-medium">ROE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 50).map((h) => {
                      const decimals = COIN_DECIMALS[h.coin] || 2;
                      const roe = calculateRoe(h.pnl, h.entry_price, h.size, h.leverage);

                      return (
                        <tr key={h.id} className="border-b border-brd hover:bg-s2 transition-colors">
                          <td className="py-3 text-t3">{new Date(h.closed_at).toLocaleString()}</td>
                          <td className="py-3 font-medium text-t1">
                            {h.coin}{h.liquidated && " \uD83D\uDC80"}
                          </td>
                          <td className={cn("py-3", h.side === "Long" ? "text-grn" : "text-red")}>
                            {h.leverage}x {h.side}
                          </td>
                          <td className="py-3 font-tabular text-t2">{h.size.toFixed(4)}</td>
                          <td className="py-3 font-tabular text-t2">{h.entry_price.toFixed(decimals)}</td>
                          <td className="py-3 font-tabular text-t2">{h.exit_price.toFixed(decimals)}</td>
                          <td className={cn("py-3 font-semibold font-tabular", h.pnl >= 0 ? "text-grn" : "text-red")}>
                            {formatPnl(h.pnl)}
                          </td>
                          <td className={cn("py-3 font-tabular", roe >= 0 ? "text-grn" : "text-red")}>
                            {roe >= 0 ? "+" : ""}{roe.toFixed(2)}%
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
          <div className="bg-s1 border border-brd rounded-lg p-4">
            <h3 className="text-[13px] font-semibold text-t1 mb-4">Balances</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-t4 text-left border-b border-brd">
                    <th className="py-3 font-medium">Asset</th>
                    <th className="py-3 font-medium">Total Balance</th>
                    <th className="py-3 font-medium">Available</th>
                    <th className="py-3 font-medium">In Use</th>
                    <th className="py-3 font-medium">USD Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-brd">
                    <td className="py-3 font-medium text-t1">USDC</td>
                    <td className="py-3 font-tabular text-t2">{formatNumber(account?.balance ?? 10000)}</td>
                    <td className="py-3 font-tabular text-t2">{formatNumber(availableBalance)}</td>
                    <td className="py-3 font-tabular text-t2">{formatNumber(usedMargin)}</td>
                    <td className="py-3 font-tabular text-t1">${formatNumber(account?.balance ?? 10000)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Footer isConnected={true} />
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-s1 border border-brd rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] text-t4 font-medium uppercase tracking-wide">{label}</div>
        {icon}
      </div>
      <div className={cn("text-[18px] font-bold font-tabular", color || "text-t1")}>{value}</div>
    </div>
  );
}
