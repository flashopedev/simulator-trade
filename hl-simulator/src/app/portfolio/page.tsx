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

      <div className="flex-1 flex flex-col">
        {/* Header: Portfolio title + buttons */}
        <div className="flex items-center justify-between px-5 py-4">
          <h1 className="text-[32px] font-semibold text-t1">Portfolio</h1>
          <div className="flex items-center gap-3">
            {HEADER_BUTTONS.map((btn) => (
              <button
                key={btn}
                className="px-5 py-2 text-[13px] rounded-lg border border-brd text-acc hover:bg-s2 transition-colors"
              >
                {btn}
              </button>
            ))}
          </div>
        </div>

        {/* Main 3-column content - NO borders between columns */}
        <div className="flex px-5 pb-6">
          {/* Left column - 14 Day Volume + Fees */}
          <div className="w-[200px] flex-shrink-0 pr-6">
            {/* 14 Day Volume */}
            <div className="mb-6">
              <div className="text-[13px] text-t3 mb-1">14 Day Volume</div>
              <div className="text-[40px] font-semibold text-t1 leading-none">$0</div>
              <button className="text-[13px] text-acc mt-3 hover:underline">View Volume</button>
            </div>

            {/* Fees */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] text-t3">Fees (Taker / Maker)</span>
                <button className="flex items-center gap-1 text-[12px] text-t2 hover:text-t1">
                  Perps <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[26px] font-semibold text-t1 leading-tight">0.0350% / 0.0100%</div>
              <button className="text-[13px] text-acc mt-3 hover:underline">View Fee Schedule</button>
            </div>
          </div>

          {/* Middle column - Stats with dropdowns inline */}
          <div className="flex-1 px-6">
            {/* Row with dropdowns */}
            <div className="flex items-center gap-6 mb-2">
              <button className="flex items-center gap-1.5 text-[13px] text-t1 hover:text-acc">
                Perps + Spot + Vaults <ChevronDown className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-1.5 text-[13px] text-t1 hover:text-acc">
                All-time <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Stats rows */}
            <div className="space-y-0.5">
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

          {/* Right column - Chart */}
          <div className="w-[400px] flex-shrink-0 pl-6">
            {/* Chart tabs - no underlines, just text */}
            <div className="flex items-center gap-6 mb-3">
              <button
                onClick={() => setChartTab("value")}
                className={cn(
                  "text-[13px] transition-colors",
                  chartTab === "value" ? "text-t1" : "text-t3 hover:text-t2"
                )}
              >
                Account Value
              </button>
              <button
                onClick={() => setChartTab("pnl")}
                className={cn(
                  "text-[13px] transition-colors",
                  chartTab === "pnl" ? "text-t1" : "text-t3 hover:text-t2"
                )}
              >
                PNL
              </button>
            </div>

            {/* SVG Chart */}
            <div className="h-[200px]">
              <svg viewBox="0 0 400 180" className="w-full h-full" preserveAspectRatio="none">
                {/* Y axis labels */}
                <text x="0" y="170" fill="#4b5563" fontSize="11">0</text>
                <text x="0" y="125" fill="#4b5563" fontSize="11">1</text>
                <text x="0" y="80" fill="#4b5563" fontSize="11">2</text>
                <text x="0" y="35" fill="#4b5563" fontSize="11">3</text>
                {/* Horizontal grid lines */}
                <line x1="20" y1="165" x2="395" y2="165" stroke="#1a1f2e" strokeWidth="1" />
                <line x1="20" y1="120" x2="395" y2="120" stroke="#1a1f2e" strokeWidth="0.5" strokeDasharray="4" />
                <line x1="20" y1="75" x2="395" y2="75" stroke="#1a1f2e" strokeWidth="0.5" strokeDasharray="4" />
                <line x1="20" y1="30" x2="395" y2="30" stroke="#1a1f2e" strokeWidth="0.5" strokeDasharray="4" />
                {/* Chart line */}
                <polyline
                  points="25,160 60,158 100,150 150,130 200,100 250,80 300,60 350,45 390,35"
                  fill="none"
                  stroke="#00d8c4"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom tabs - green underline on active, no full border */}
        <div className="px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {BOTTOM_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => !tab.disabled && setActiveTab(tab.key)}
                  disabled={tab.disabled}
                  className={cn(
                    "px-4 py-3 text-[13px] font-medium whitespace-nowrap relative transition-colors",
                    activeTab === tab.key
                      ? "text-t1"
                      : tab.disabled
                      ? "text-t4 cursor-default"
                      : "text-t3 hover:text-t2"
                  )}
                >
                  {tab.label}
                  {/* Green underline for active tab */}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-grn rounded-t" />
                  )}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 text-[13px] text-t2 hover:text-t1">
              Filter <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          {/* Thin separator line */}
          <div className="h-px bg-brd" />
        </div>

        {/* Tab Content */}
        <div className="flex-1 px-5 py-4 pb-20">
          {/* Positions Tab */}
          {activeTab === "positions" && (
            <div>
              {positions.length === 0 ? (
                <div className="text-t3 text-[13px]">No open positions yet</div>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-t3 text-left">
                      <th className="py-2 font-medium">Coin</th>
                      <th className="py-2 font-medium">Size</th>
                      <th className="py-2 font-medium">
                        Position Value <span className="text-t4">▾</span>
                      </th>
                      <th className="py-2 font-medium">Entry Price</th>
                      <th className="py-2 font-medium">Mark Price</th>
                      <th className="py-2 font-medium">PNL (ROE %)</th>
                      <th className="py-2 font-medium">Liq. Price</th>
                      <th className="py-2 font-medium">Margin</th>
                      <th className="py-2 font-medium">Funding</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p) => {
                      const decimals = COIN_DECIMALS[p.coin] || 2;
                      const markPrice = prices[p.coin] || p.entry_price;
                      const positionValue = p.size * markPrice;
                      const margin = positionValue / p.leverage;
                      const pnl = calculatePnl(p.entry_price, markPrice, p.size, p.side === "Long");
                      const roe = calculateRoe(pnl, p.entry_price, p.size, p.leverage);

                      return (
                        <tr key={p.id} className="border-t border-brd">
                          <td className="py-3">
                            <span className={cn("font-medium", p.side === "Long" ? "text-grn" : "text-red")}>
                              {p.coin} {p.leverage}x {p.side === "Long" ? "L" : "S"}
                            </span>
                          </td>
                          <td className="py-3 font-tabular text-t1">{p.size.toFixed(2)}</td>
                          <td className="py-3 font-tabular text-t1">${formatNumber(positionValue)}</td>
                          <td className="py-3 font-tabular text-t2">{p.entry_price.toFixed(decimals)}</td>
                          <td className="py-3 font-tabular text-t2">{markPrice.toFixed(decimals)}</td>
                          <td className={cn("py-3 font-tabular", pnl >= 0 ? "text-grn" : "text-red")}>
                            {formatPnl(pnl)} ({roe >= 0 ? "+" : ""}{roe.toFixed(1)}%)
                          </td>
                          <td className="py-3 font-tabular text-red">{p.liquidation_price.toFixed(decimals)}</td>
                          <td className="py-3 font-tabular text-t2">${formatNumber(margin)}</td>
                          <td className="py-3 text-t3">—</td>
                          <td className="py-3">
                            <button
                              onClick={() => handleClosePosition(p)}
                              className="px-4 py-1.5 bg-s3 rounded text-[12px] font-medium text-t1 hover:bg-s4 transition-colors"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Balances Tab */}
          {activeTab === "balances" && (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-t3 text-left">
                  <th className="py-2 font-medium">Coin</th>
                  <th className="py-2 font-medium">Total Balance</th>
                  <th className="py-2 font-medium">Available Balance</th>
                  <th className="py-2 font-medium">In Orders</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-brd">
                  <td className="py-3 font-medium text-t1">USDC</td>
                  <td className="py-3 font-tabular text-t1">${formatNumber(account?.balance ?? 10000)}</td>
                  <td className="py-3 font-tabular text-t2">${formatNumber(availableBalance)}</td>
                  <td className="py-3 font-tabular text-t2">$0.00</td>
                </tr>
              </tbody>
            </table>
          )}

          {/* Open Orders Tab */}
          {activeTab === "openOrders" && (
            <div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-t3 text-left">
                    <th className="py-2 font-medium">Time</th>
                    <th className="py-2 font-medium">Type</th>
                    <th className="py-2 font-medium">Coin</th>
                    <th className="py-2 font-medium">Direction</th>
                    <th className="py-2 font-medium">Size</th>
                    <th className="py-2 font-medium">Original Size</th>
                    <th className="py-2 font-medium">
                      Order Value <ChevronDown className="w-3 h-3 inline" />
                    </th>
                    <th className="py-2 font-medium">Price</th>
                    <th className="py-2 font-medium">Reduce Only</th>
                    <th className="py-2 font-medium">Trigger Conditions</th>
                    <th className="py-2 font-medium">TP/SL</th>
                  </tr>
                </thead>
              </table>
              {orders.length === 0 && (
                <div className="text-t3 text-[13px] py-2">No open orders yet</div>
              )}
            </div>
          )}

          {/* Trade History Tab */}
          {activeTab === "tradeHistory" && (
            <div>
              {history.length === 0 ? (
                <div className="text-t3 text-[13px]">No trade history yet</div>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-t3 text-left">
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
                    {history.slice(0, 50).map((h) => {
                      const decimals = COIN_DECIMALS[h.coin] || 2;
                      return (
                        <tr key={h.id} className="border-t border-brd">
                          <td className="py-3 text-t3">{new Date(h.closed_at).toLocaleString()}</td>
                          <td className="py-3 font-medium text-t1">{h.coin}{h.liquidated && " 💀"}</td>
                          <td className={cn("py-3", h.side === "Long" ? "text-grn" : "text-red")}>
                            {h.leverage}x {h.side}
                          </td>
                          <td className="py-3 font-tabular text-t2">{h.size.toFixed(4)}</td>
                          <td className="py-3 font-tabular text-t2">{h.entry_price.toFixed(decimals)}</td>
                          <td className="py-3 font-tabular text-t2">{h.exit_price.toFixed(decimals)}</td>
                          <td className={cn("py-3 font-tabular font-medium", h.pnl >= 0 ? "text-grn" : "text-red")}>
                            {formatPnl(h.pnl)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === "fundingHistory" && (
            <div className="text-t3 text-[13px]">No funding history</div>
          )}

          {activeTab === "orderHistory" && (
            <div className="text-t3 text-[13px]">No order history</div>
          )}
        </div>
      </div>

      <Footer isConnected={true} />
    </div>
  );
}
