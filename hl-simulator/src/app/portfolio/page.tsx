"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
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

export default function PortfolioPage() {
  const { user, account, loading: authLoading, signOut, updateBalance } = useAuth();
  const [prices, setPrices] = useState<Record<string, number>>(FALLBACK_PRICES);

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

  return (
    <div className="min-h-screen flex flex-col bg-bg pb-16 md:pb-0">
      <NotificationContainer />
      <Navigation balance={totalEquity} isConnected={true} onSignOut={signOut} />

      <div className="flex-1 p-4 max-w-6xl mx-auto w-full">
        <h1 className="text-xl font-bold mb-6">Portfolio</h1>

        {/* Account Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Equity" value={`$${formatNumber(totalEquity)}`} />
          <StatCard label="Available" value={`$${formatNumber(availableBalance)}`} />
          <StatCard
            label="Unrealized PnL"
            value={formatPnl(totalUnrealizedPnl)}
            color={totalUnrealizedPnl >= 0 ? "text-grn" : "text-red"}
          />
          <StatCard
            label="Realized PnL"
            value={formatPnl(totalRealizedPnl)}
            color={totalRealizedPnl >= 0 ? "text-grn" : "text-red"}
          />
        </div>

        {/* Margin info */}
        <div className="bg-s2 border border-brd rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold mb-3">Margin Overview</h2>
          <div className="grid grid-cols-3 gap-4 text-[11px]">
            <div>
              <span className="text-t4">Used Margin</span>
              <div className="font-semibold font-tabular mt-0.5">
                ${formatNumber(usedMargin)}
              </div>
            </div>
            <div>
              <span className="text-t4">Free Margin</span>
              <div className="font-semibold font-tabular mt-0.5">
                ${formatNumber(availableBalance)}
              </div>
            </div>
            <div>
              <span className="text-t4">Margin Ratio</span>
              <div className="font-semibold font-tabular mt-0.5">
                {totalEquity > 0
                  ? `${((usedMargin / totalEquity) * 100).toFixed(1)}%`
                  : "0%"}
              </div>
            </div>
          </div>
        </div>

        {/* Open Positions */}
        <div className="bg-s2 border border-brd rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold mb-3">
            Open Positions ({positions.length})
          </h2>

          {positions.length === 0 ? (
            <div className="text-center py-8 text-t4 text-[11px]">
              No open positions
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-t4 text-left">
                    <th className="py-2 font-medium">Market</th>
                    <th className="py-2 font-medium">Side</th>
                    <th className="py-2 font-medium">Size</th>
                    <th className="py-2 font-medium">Entry</th>
                    <th className="py-2 font-medium">Mark</th>
                    <th className="py-2 font-medium">Liq.</th>
                    <th className="py-2 font-medium">PnL</th>
                    <th className="py-2 font-medium">ROE</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => {
                    const decimals = COIN_DECIMALS[p.coin] || 2;
                    const markPrice = prices[p.coin] || p.entry_price;
                    const pnl = calculatePnl(
                      p.entry_price,
                      markPrice,
                      p.size,
                      p.side === "Long"
                    );
                    const roe = calculateRoe(pnl, p.entry_price, p.size, p.leverage);

                    return (
                      <tr key={p.id} className="border-t border-brd">
                        <td className="py-2 font-medium">{p.coin}-USD</td>
                        <td
                          className={cn(
                            "py-2 font-bold",
                            p.side === "Long" ? "text-grn" : "text-red"
                          )}
                        >
                          {p.leverage}x {p.side}
                        </td>
                        <td className="py-2 font-tabular">{p.size.toFixed(2)}</td>
                        <td className="py-2 font-tabular">
                          {p.entry_price.toFixed(decimals)}
                        </td>
                        <td className="py-2 font-tabular">
                          {markPrice.toFixed(decimals)}
                        </td>
                        <td className="py-2 font-tabular text-red">
                          {p.liquidation_price.toFixed(decimals)}
                        </td>
                        <td
                          className={cn(
                            "py-2 font-semibold font-tabular",
                            pnl >= 0 ? "text-grn" : "text-red"
                          )}
                        >
                          {formatPnl(pnl)}
                        </td>
                        <td
                          className={cn(
                            "py-2 font-tabular",
                            roe >= 0 ? "text-grn" : "text-red"
                          )}
                        >
                          {roe >= 0 ? "+" : ""}
                          {roe.toFixed(1)}%
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => handleClosePosition(p)}
                            className="px-2 py-1 bg-s3 border border-brd rounded text-[9px] font-semibold hover:bg-red/10 hover:border-red/25 hover:text-red transition-colors"
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

        {/* Trade History */}
        <div className="bg-s2 border border-brd rounded-lg p-4">
          <h2 className="text-sm font-semibold mb-3">Trade History</h2>

          {history.length === 0 ? (
            <div className="text-center py-8 text-t4 text-[11px]">
              No trade history
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-t4 text-left">
                    <th className="py-2 font-medium">Market</th>
                    <th className="py-2 font-medium">Side</th>
                    <th className="py-2 font-medium">Size</th>
                    <th className="py-2 font-medium">Entry</th>
                    <th className="py-2 font-medium">Exit</th>
                    <th className="py-2 font-medium">PnL</th>
                    <th className="py-2 font-medium">ROE</th>
                    <th className="py-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 20).map((h) => {
                    const decimals = COIN_DECIMALS[h.coin] || 2;
                    const roe = calculateRoe(h.pnl, h.entry_price, h.size, h.leverage);

                    return (
                      <tr key={h.id} className="border-t border-brd">
                        <td className="py-2 font-medium">
                          {h.coin}
                          {h.liquidated && " 💀"}
                        </td>
                        <td
                          className={cn(
                            "py-2",
                            h.side === "Long" ? "text-grn" : "text-red"
                          )}
                        >
                          {h.leverage}x {h.side}
                        </td>
                        <td className="py-2 font-tabular">{h.size.toFixed(2)}</td>
                        <td className="py-2 font-tabular">
                          {h.entry_price.toFixed(decimals)}
                        </td>
                        <td className="py-2 font-tabular">
                          {h.exit_price.toFixed(decimals)}
                        </td>
                        <td
                          className={cn(
                            "py-2 font-semibold font-tabular",
                            h.pnl >= 0 ? "text-grn" : "text-red"
                          )}
                        >
                          {formatPnl(h.pnl)}
                        </td>
                        <td
                          className={cn(
                            "py-2 font-tabular",
                            roe >= 0 ? "text-grn" : "text-red"
                          )}
                        >
                          {roe >= 0 ? "+" : ""}
                          {roe.toFixed(1)}%
                        </td>
                        <td className="py-2 text-t4">
                          {new Date(h.closed_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="bg-s2 border border-brd rounded-lg p-3">
      <div className="text-[10px] text-t4 font-medium mb-1">{label}</div>
      <div className={cn("text-lg font-bold font-tabular", color)}>{value}</div>
    </div>
  );
}
