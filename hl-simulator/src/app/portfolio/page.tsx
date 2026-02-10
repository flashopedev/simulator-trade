"use client";

import { useState, useEffect, useRef } from "react";
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
import { ChevronDown, X } from "lucide-react";

type BottomTab = "balances" | "positions" | "openOrders" | "twap" | "tradeHistory" | "fundingHistory" | "orderHistory" | "interest" | "deposits";
type TimePeriod = "24H" | "7D" | "30D" | "All-time";

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

// Tab labels are generated dynamically to include counts

export default function PortfolioPage() {
  const { user, account, loading: authLoading, signOut, updateBalance } = useAuth();
  const [prices, setPrices] = useState<Record<string, number>>(FALLBACK_PRICES);
  const [activeTab, setActiveTab] = useState<BottomTab>("balances");
  const [hideSmallBalances, setHideSmallBalances] = useState(false);
  const [chartTab, setChartTab] = useState<"value" | "pnl">("value");
  const [showPnlModal, setShowPnlModal] = useState(false);
  const [modalEditData, setModalEditData] = useState<{ date: string; pnl: number }[] | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30D");
  const [showTimePeriodDropdown, setShowTimePeriodDropdown] = useState(false);

  // PNL data points for chart — stored as { date: string, pnl: number }[]
  // Persisted in localStorage so data survives page reloads
  // On load: read from localStorage, align to current 30-day window (add new days, drop old)
  const [pnlData, setPnlData] = useState<{ date: string; pnl: number }[] | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem("hl_sim_pnl_data");
      if (saved) {
        const parsed = JSON.parse(saved) as { date: string; pnl: number }[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return null;
  });

  // Track whether PNL data has been initialized (from localStorage or generated)
  // so we don't overwrite user-saved data when naturalCombinedPnl changes from price updates
  const pnlInitialized = useRef(pnlData !== null);

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

  // === All computations BEFORE early returns (hooks must be consistent) ===
  const totalEquity = getTotalEquity(prices);
  const availableBalance = getAvailableBalance(prices);

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

  const totalVolume = history.reduce((sum, h) => sum + h.size * h.exit_price, 0);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const volume14d = history
    .filter((h) => new Date(h.closed_at) >= fourteenDaysAgo)
    .reduce((sum, h) => sum + h.size * h.exit_price, 0);

  const totalRealizedPnl = history.reduce((sum, h) => sum + h.pnl, 0);
  const INITIAL_BALANCE = 10000;
  const naturalCombinedPnl = totalRealizedPnl + totalUnrealizedPnl;
  const faucetDeposits = Math.max(0, (account?.balance ?? INITIAL_BALANCE) - INITIAL_BALANCE - totalRealizedPnl);

  // Total number of history days (All-time = 90 days for realistic simulation)
  const TOTAL_DAYS = 90;

  // Generate full date list (TOTAL_DAYS days)
  const allDates = (() => {
    const arr: string[] = [];
    for (let i = TOTAL_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push(d.toISOString().split("T")[0]);
    }
    return arr;
  })();

  // Initialize pnlData: realistic daily PNL with wins and losses
  // Some days profit, some days loss, but total = naturalCombinedPnl
  // Only runs ONCE: either generates fresh data or aligns saved data to current date window
  // After initialization, pnlData is never overwritten by this effect (user edits are preserved)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Already initialized — don't touch user-saved data
    if (pnlInitialized.current) return;

    if (pnlData === null && naturalCombinedPnl !== 0) {
      // No saved data — generate realistic distribution
      const seed = 42;
      const seededRandom = (i: number) => {
        const x = Math.sin(seed + i * 127.1) * 43758.5453;
        return x - Math.floor(x);
      };
      const rawPnl = allDates.map((_, i) => {
        const r = seededRandom(i);
        const isWin = r > 0.38;
        const magnitude = seededRandom(i + 1000) * 0.8 + 0.2;
        if (isWin) {
          return magnitude * (1 + seededRandom(i + 2000) * 1.5);
        } else {
          return -magnitude * (0.5 + seededRandom(i + 3000) * 1.0);
        }
      });
      const rawSum = rawPnl.reduce((s, v) => s + v, 0);
      const scale = rawSum !== 0 ? naturalCombinedPnl / rawSum : 0;
      const newData = allDates.map((date, i) => ({
        date,
        pnl: Math.round(rawPnl[i] * scale * 100) / 100,
      }));
      setPnlData(newData);
      pnlInitialized.current = true;
    } else if (pnlData !== null) {
      // Saved data exists — align to current date window (shift dates if needed)
      const savedMap = new Map(pnlData.map((d) => [d.date, d.pnl]));
      const savedDates = new Set(pnlData.map((d) => d.date));
      const hasNewDates = allDates.some((d) => !savedDates.has(d));
      if (hasNewDates || pnlData.length !== TOTAL_DAYS) {
        const aligned = allDates.map((date) => ({
          date,
          pnl: savedMap.get(date) ?? 0,
        }));
        setPnlData(aligned);
      }
      pnlInitialized.current = true;
    }
    // pnlData === null && naturalCombinedPnl === 0: wait for data to load
  }, [naturalCombinedPnl]);

  // Close time period dropdown on outside click
  useEffect(() => {
    if (!showTimePeriodDropdown) return;
    const handleClick = () => setShowTimePeriodDropdown(false);
    const timer = setTimeout(() => document.addEventListener("click", handleClick), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClick);
    };
  }, [showTimePeriodDropdown]);

  // Persist pnlData to localStorage on every change
  useEffect(() => {
    if (pnlData !== null) {
      try {
        localStorage.setItem("hl_sim_pnl_data", JSON.stringify(pnlData));
      } catch { /* quota exceeded — ignore */ }
    }
  }, [pnlData]);

  // combinedPnl = SUM of pnlData values (user-editable from modal) — always full 30D
  const combinedPnl = pnlData ? pnlData.reduce((sum, d) => sum + d.pnl, 0) : naturalCombinedPnl;

  // Effective pnlData — full TOTAL_DAYS (for modal and storage)
  const effectivePnlData = pnlData ?? allDates.map((date) => ({ date, pnl: naturalCombinedPnl / TOTAL_DAYS }));

  // --- Time period slicing ---
  // How many days to show based on timePeriod
  const periodDays = timePeriod === "24H" ? 1 : timePeriod === "7D" ? 7 : timePeriod === "30D" ? 30 : effectivePnlData.length;
  // Sliced data for display (last N days)
  const periodPnlData = effectivePnlData.slice(-periodDays);

  // Period-based PNL (sum of visible days)
  const periodPnl = periodPnlData.reduce((sum, d) => sum + d.pnl, 0);

  // Period-based Volume (filter history by period)
  const periodStartDate = new Date();
  periodStartDate.setDate(periodStartDate.getDate() - periodDays);
  const periodVolume = timePeriod === "All-time"
    ? totalVolume
    : history
        .filter((h) => new Date(h.closed_at) >= periodStartDate)
        .reduce((sum, h) => sum + h.size * h.exit_price, 0);

  // Account Value per day: INITIAL + cumulative deposits + cumulative PNL (full 30d for chart)
  const dailyDepositAmt = faucetDeposits / effectivePnlData.length;
  const accountValuePerDayFull: number[] = [];
  {
    let cumPnl = 0;
    let cumDeposit = 0;
    for (let i = 0; i < effectivePnlData.length; i++) {
      cumPnl += effectivePnlData[i].pnl;
      cumDeposit += dailyDepositAmt;
      accountValuePerDayFull.push(INITIAL_BALANCE + cumDeposit + cumPnl);
    }
  }

  // Sliced account value for current period
  const accountValuePerDay = accountValuePerDayFull.slice(-periodDays);

  // Max Drawdown = max( |negative day PNL| / Account Value on that day ) * 100 — within period
  let maxDrawdown = 0;
  {
    const avOffset = effectivePnlData.length - periodDays;
    for (let i = 0; i < periodPnlData.length; i++) {
      const dayPnl = periodPnlData[i].pnl;
      const avIdx = avOffset + i;
      const av = accountValuePerDayFull[avIdx] ?? 0;
      if (dayPnl < 0 && av > 0) {
        const dd = (Math.abs(dayPnl) / av) * 100;
        if (dd > maxDrawdown) maxDrawdown = dd;
      }
    }
  }

  // === Early returns AFTER all hooks ===
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

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const bottomTabs: { key: BottomTab; label: string }[] = [
    { key: "balances", label: `Balances (1)` },
    { key: "positions", label: `Positions (${positions.length})` },
    { key: "openOrders", label: `Open Orders (${pendingOrders.length})` },
    { key: "twap", label: "TWAP" },
    { key: "tradeHistory", label: "Trade History" },
    { key: "fundingHistory", label: "Funding History" },
    { key: "orderHistory", label: "Order History" },
    { key: "interest", label: "Interest" },
    { key: "deposits", label: "Deposits and Withdrawals" },
  ];

  const handleClosePosition = async (position: Position) => {
    const currentPrice = prices[position.coin] || position.entry_price;
    await closePosition(position, currentPrice);
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <NotificationContainer />
      <Navigation balance={totalEquity} isConnected={true} onSignOut={signOut} />

      <div className="flex-1 flex flex-col" style={{ background: "url('/images/back_lines.svg') 0% 0% / cover no-repeat" }}>
        {/* Header: Portfolio title + buttons */}
        <div className="max-w-[1312px] mx-auto w-full px-4">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-[34px] font-normal text-white">Portfolio</h1>
            <div className="flex items-center gap-2">
              {HEADER_BUTTONS.map((btn) => (
                <button
                  key={btn}
                  onClick={btn === "Portfolio Margin" ? () => setShowPnlModal(true) : undefined}
                  className={cn(
                    "h-[40px] px-4 text-[12px] font-normal rounded-[8px] transition-colors",
                    btn === "Deposit"
                      ? "bg-[#17453f] text-[#50D2C1] hover:bg-[#1d5550]"
                      : "border border-[#50D2C1] text-[#50D2C1] hover:bg-s1"
                  )}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main 3-column grid */}
        <div className="max-w-[1312px] mx-auto w-full px-4">
          <div className="grid grid-cols-[1fr_1fr_2fr] gap-2">
            {/* Left column - 14 Day Volume + Fees stacked - must equal height of middle/right */}
            <div className="flex flex-col gap-2">
              {/* 14 Day Volume card - flex-1 to share height equally */}
              <div className="bg-s1 rounded-[10px] p-3 flex-1 flex flex-col">
                <div className="text-[14px] text-t3 mb-1">14 Day Volume</div>
                <div className="text-[28px] font-normal text-white leading-[30px]">${formatNumber(volume14d)}</div>
                <button className="text-[12px] text-[#50D2C1] mt-auto hover:text-[#50D2C1]/80">View Volume</button>
              </div>

              {/* Fees card - flex-1 to share height equally */}
              <div className="bg-s1 rounded-[10px] p-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[14px] text-t3">Fees (Taker / Maker)</span>
                  <button className="flex items-center gap-1 text-[12px] text-t1 hover:text-t2">
                    Perps <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-[28px] font-normal text-white leading-[30px]">0,0450% / 0,0150%</div>
                <button className="text-[12px] text-[#50D2C1] mt-auto hover:text-[#50D2C1]/80">View Fee Schedule</button>
              </div>
            </div>

            {/* Middle column - Stats card */}
            <div className="bg-s1 rounded-[10px] p-3">
              {/* Row with dropdowns */}
              <div className="flex items-center gap-6 pb-2 mb-2 border-b border-brd">
                <button className="flex items-center gap-1.5 text-[12px] text-t1 hover:text-t2">
                  Perps + Spot + Vaults <ChevronDown className="w-4 h-4 text-t3" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowTimePeriodDropdown(!showTimePeriodDropdown)}
                    className="flex items-center gap-1.5 text-[12px] text-t1 hover:text-t2"
                  >
                    {timePeriod} <ChevronDown className={cn("w-4 h-4 text-t3 transition-transform", showTimePeriodDropdown && "rotate-180")} />
                  </button>
                  {showTimePeriodDropdown && (
                    <div className="absolute top-full right-0 mt-1 bg-[#1a2332] border border-brd rounded-[6px] py-1 z-50 min-w-[80px] shadow-lg">
                      {(["24H", "7D", "30D", "All-time"] as TimePeriod[]).map((period) => (
                        <button
                          key={period}
                          onClick={() => {
                            setTimePeriod(period);
                            setShowTimePeriodDropdown(false);
                          }}
                          className={cn(
                            "block w-full text-left px-3 py-1.5 text-[12px] hover:bg-s2 transition-colors",
                            timePeriod === period ? "text-acc" : "text-t1"
                          )}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats rows */}
              <div>
                {[
                  { label: "PNL", value: formatPnl(periodPnl), color: periodPnl > 0 ? "text-grn" : periodPnl < 0 ? "text-red" : "text-t1" },
                  { label: "Volume", value: `$${formatNumber(periodVolume)}` },
                  { label: "Max Drawdown", value: `${maxDrawdown.toFixed(2).replace(".", ",")}%` },
                  { label: "Total Equity", value: `$${formatNumber(totalEquity)}` },
                  { label: "Trading Equity", value: `$${formatNumber(totalEquity)}` },
                  { label: "Vault Equity", value: "$0,00" },
                  { label: "Staking Account", value: "0 HYPE" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-[5px] text-[12px]">
                    <span className="text-t2">{row.label}</span>
                    <span className={cn("font-tabular", row.color || "text-t1")}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column - Chart card */}
            <div className="bg-s1 rounded-[10px] p-3">
              {/* Chart tabs — like real HL: active tab has bottom border */}
              <div className="flex items-center gap-0 mb-3 border-b border-brd">
                <button
                  onClick={() => setChartTab("value")}
                  className={cn(
                    "px-3 pb-2 text-[12px] transition-colors border-b-2 -mb-[1px]",
                    chartTab === "value" ? "text-t1 border-white" : "text-t3 border-transparent hover:text-t1"
                  )}
                >
                  Account Value
                </button>
                <button
                  onClick={() => setChartTab("pnl")}
                  className={cn(
                    "px-3 pb-2 text-[12px] transition-colors border-b-2 -mb-[1px]",
                    chartTab === "pnl" ? "text-t1 border-white" : "text-t3 border-transparent hover:text-t1"
                  )}
                >
                  PNL
                </button>
              </div>

              {/* Chart area — pixel-perfect match to real HL (measured from DOM) */}
              <div className="h-[180px]">
                {(() => {
                  // Real HL: SVG 602x180, padL~41, padT=10, plotH=155, plotW=561
                  const chartW = 602;
                  const chartH = 180;
                  const padL = 41;
                  const padT = 10;
                  const plotW = chartW - padL;
                  const plotH = 155; // y from 10 to 165

                  // Chart data — sliced by timePeriod
                  let values: number[];
                  if (chartTab === "value") {
                    values = accountValuePerDay;
                  } else {
                    // PNL = daily PNL per day (positive and negative)
                    // 0 is always centered, shows wins above and losses below
                    values = periodPnlData.map((d) => d.pnl);
                  }

                  if (values.length === 0) values = [0];

                  let dataMin = Math.min(...values);
                  let dataMax = Math.max(...values);

                  // PNL: 0 всегда включён в диапазон
                  if (chartTab === "pnl") {
                    dataMin = Math.min(dataMin, 0);
                    dataMax = Math.max(dataMax, 0);
                  }

                  // Nice Y-axis: 4 labels
                  const rawRange = dataMax - dataMin || 1;
                  const rawStep = rawRange / 3;
                  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(rawStep) || 1)));
                  const niceStep = Math.ceil(rawStep / magnitude) * magnitude || 1;

                  let niceMin = Math.floor(dataMin / niceStep) * niceStep;
                  let niceMax = Math.ceil(dataMax / niceStep) * niceStep;

                  // PNL: 0 обязательно в диапазоне
                  if (chartTab === "pnl") {
                    if (niceMin > 0) niceMin = 0;
                    if (niceMax < 0) niceMax = 0;
                  }

                  // If all values identical, create a range around them
                  if (niceMin === niceMax) {
                    niceMin = niceMin - niceStep;
                    niceMax = niceMax + niceStep * 2;
                  }
                  const yRange = niceMax - niceMin || 1;

                  // 4 Y-axis labels (matching real HL)
                  const yLabels: number[] = [];
                  for (let v = niceMin; v <= niceMax + niceStep * 0.01; v += niceStep) {
                    yLabels.push(Math.round(v * 100) / 100);
                  }

                  const toY = (v: number) => padT + plotH - ((v - niceMin) / yRange) * plotH;
                  const stepW = plotW / values.length;

                  // Step path
                  let stepPath = `M ${padL} ${toY(values[0])}`;
                  for (let i = 1; i < values.length; i++) {
                    const x = padL + i * stepW;
                    stepPath += ` H ${x} V ${toY(values[i])}`;
                  }
                  stepPath += ` H ${padL + plotW}`;

                  // Format Y label
                  // Format Y-axis labels: always use k/M when values are large enough
                  const formatYLabel = (v: number): string => {
                    const absV = Math.abs(v);
                    if (absV >= 1000000) {
                      return `${(v / 1000000).toFixed(absV >= 10000000 ? 1 : 2)}M`;
                    }
                    if (absV >= 1000) {
                      // If step < 1000, show decimal k (e.g. 433.5k)
                      if (niceStep < 1000) {
                        const kVal = v / 1000;
                        // Show 1 decimal if needed, otherwise whole
                        return `${kVal % 1 === 0 ? kVal.toFixed(0) : kVal.toFixed(1)}k`;
                      }
                      return `${Math.round(v / 1000)}k`;
                    }
                    if (absV === 0) return "0";
                    if (niceStep < 1) return v.toFixed(2);
                    return Math.round(v).toLocaleString("en-US");
                  };

                  // Tick mark length: 6px left of vertical axis (real HL: x=35 to x=41)
                  const tickLen = 6;

                  return (
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet" style={{ overflow: "visible" }}>
                      {/* Bottom horizontal axis line (real HL: strokeWidth default=1) */}
                      <line
                        x1={padL}
                        y1={padT + plotH}
                        x2={chartW}
                        y2={padT + plotH}
                        stroke="#3E3E3E"
                        strokeWidth="1"
                      />
                      {/* Vertical left axis line (real HL: strokeWidth=2) */}
                      <line
                        x1={padL}
                        y1={padT}
                        x2={padL}
                        y2={padT + plotH}
                        stroke="#3E3E3E"
                        strokeWidth="2"
                      />
                      {/* Tick marks + Y-axis labels at each grid level */}
                      {yLabels.map((val, i) => {
                        const y = toY(val);
                        return (
                          <g key={i}>
                            {/* Tick mark: 6px horizontal line left of vertical axis (strokeWidth=2) */}
                            <line
                              x1={padL - tickLen}
                              y1={y}
                              x2={padL}
                              y2={y}
                              stroke="#3E3E3E"
                              strokeWidth="2"
                            />
                            {/* Y-axis label: white text, fontSize=12, positioned 2px left of tick */}
                            <text
                              x={padL - tickLen - 2}
                              y={y}
                              fill="white"
                              fontSize="12"
                              fontWeight="400"
                              textAnchor="end"
                              dominantBaseline="central"
                              fontFamily="system-ui, -apple-system, sans-serif"
                            >
                              {formatYLabel(val)}
                            </text>
                          </g>
                        );
                      })}
                      {/* White step line (real HL: stroke=white, strokeWidth=2) */}
                      <path
                        d={stepPath}
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </svg>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom tabs - in a card container like real HL */}
        <div className="max-w-[1312px] mx-auto w-full px-4 mt-2">
          <div className="bg-s1 rounded-[10px] pb-2">
            {/* Tabs row */}
            <div className="flex items-center justify-between px-4 border-b border-brd">
              <div className="flex items-center">
                {bottomTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "px-4 py-3 text-[12px] font-normal whitespace-nowrap border-b-2 -mb-[1px] transition-colors",
                      activeTab === tab.key
                        ? "text-t1 border-white"
                        : "text-t2 border-transparent hover:text-t1"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1.5 text-[12px] text-t1 hover:text-t2">
                  Filter <ChevronDown className="w-4 h-4" />
                </button>
                {activeTab === "balances" && (
                  <label className="flex items-center gap-2 text-[12px] text-t1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hideSmallBalances}
                      onChange={(e) => setHideSmallBalances(e.target.checked)}
                      className="w-4 h-4 rounded border-brd bg-transparent accent-acc"
                    />
                    Hide Small Balances
                  </label>
                )}
              </div>
            </div>

            {/* Tab Content - inside the card */}
            <div className="px-4 py-4">
          {/* Positions Tab */}
          {activeTab === "positions" && (
            <div>
              {positions.length === 0 ? (
                <div className="text-t3 text-[12px]">No open positions yet</div>
              ) : (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-t2 text-left text-[12px]">
                      <th className="py-2 font-normal">Coin</th>
                      <th className="py-2 font-normal">Size</th>
                      <th className="py-2 font-normal">
                        <span className="border-b border-dotted border-t3 cursor-pointer">Position Value</span> <ChevronDown className="w-3 h-3 inline text-t3" />
                      </th>
                      <th className="py-2 font-normal">Entry Price</th>
                      <th className="py-2 font-normal">Mark Price</th>
                      <th className="py-2 font-normal"><span className="border-b border-dotted border-t3">PNL (ROE %)</span></th>
                      <th className="py-2 font-normal">Liq. Price</th>
                      <th className="py-2 font-normal"><span className="border-b border-dotted border-t3">Margin</span></th>
                      <th className="py-2 font-normal"><span className="border-b border-dotted border-t3 cursor-pointer">Funding</span></th>
                      <th className="py-2 font-normal"><span className="border-b border-dotted border-t3 cursor-pointer">Close All</span></th>
                      <th className="py-2 font-normal">TP/SL</th>
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
                      const isLong = p.side === "Long";
                      const marginMode = p.margin_mode || "cross";
                      const sizeFormatted = p.size.toFixed(2).replace(".", ",");

                      return (
                        <tr
                          key={p.id}
                          className="border-t border-brd hover:bg-s2"
                        >
                          <td className="py-3">
                            <span className={cn("font-medium", isLong ? "text-grn" : "text-red")}>{p.coin}</span>
                            <span className="ml-1.5 text-[11px] text-acc">{p.leverage}x</span>
                          </td>
                          <td className="py-3 font-tabular text-acc">{sizeFormatted} {p.coin}</td>
                          <td className="py-3 font-tabular text-t1">{formatNumber(positionValue).replace(".", ",")} USDC</td>
                          <td className="py-3 font-tabular text-t2">{p.entry_price.toFixed(decimals)}</td>
                          <td className="py-3 font-tabular text-t2">{markPrice.toFixed(decimals)}</td>
                          <td className={cn("py-3 font-tabular", pnl >= 0 ? "text-grn" : "text-red")}>
                            {formatPnl(pnl)} ({roe >= 0 ? "+" : ""}{roe.toFixed(1)}%)
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline ml-1 opacity-50">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </td>
                          <td className="py-3 font-tabular text-t2">{p.liquidation_price.toFixed(decimals)}</td>
                          <td className="py-3 font-tabular text-t2">
                            ${formatNumber(margin)} ({marginMode === "cross" ? "Cross" : "Isolated"})
                          </td>
                          <td className="py-3">
                            <span className="text-grn font-tabular">$0,00</span>
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => handleClosePosition(p)}
                              className="text-[12px] text-acc cursor-pointer"
                            >
                              Connect
                            </button>
                          </td>
                          <td className="py-3 text-t3">
                            <span className="flex items-center gap-1">
                              -- / --
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-acc cursor-pointer hover:text-acc/80">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Balances Tab — pixel-perfect match to real HL */}
          {activeTab === "balances" && (
            <div style={{ padding: "4px 0 0 0" }}>
              {(account?.balance ?? 10000) > 0 || !hideSmallBalances ? (
                <table className="w-full text-[12px]">
                  {/* Header row — rgb(148,158,156) gray, h=24px, no borders */}
                  <thead>
                    <tr className="text-left h-[24px]" style={{ color: "rgb(148,158,156)" }}>
                      <td className="font-normal">Coin</td>
                      <td className="font-normal">Total Balance</td>
                      <td className="font-normal">Available Balance</td>
                      <td className="font-normal">USDC Value <ChevronDown className="w-3 h-3 inline" /></td>
                      <td className="font-normal"><span className="border-b border-dotted border-current cursor-pointer">PNL (ROE %)</span></td>
                      <td className="font-normal">Send</td>
                      <td className="font-normal">Transfer</td>
                      <td className="font-normal">Contract</td>
                    </tr>
                  </thead>
                  {/* Data row — white, h=24px, no borders */}
                  <tbody>
                    <tr className="h-[24px] text-white">
                      <td>USDC</td>
                      <td className="font-tabular">{formatNumber(totalEquity)} USDC</td>
                      <td className="font-tabular"><span className="border-b border-dotted border-current cursor-pointer">{formatNumber(availableBalance)} USDC</span></td>
                      <td className="font-tabular">${formatNumber(totalEquity)}</td>
                      <td></td>
                      <td><span className="text-acc cursor-pointer">Connect</span></td>
                      <td><span className="text-[#0e3333]">Transfer to Perps</span></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div className="text-t3 text-[12px]">No balances yet</div>
              )}
            </div>
          )}

          {/* Open Orders Tab */}
          {activeTab === "openOrders" && (
            <div>
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-t2 text-left text-[12px]">
                    <th className="py-2 font-normal">Time</th>
                    <th className="py-2 font-normal">Type</th>
                    <th className="py-2 font-normal">Coin</th>
                    <th className="py-2 font-normal">Direction</th>
                    <th className="py-2 font-normal">Size</th>
                    <th className="py-2 font-normal">Original Size</th>
                    <th className="py-2 font-normal">
                      Order Value <ChevronDown className="w-3 h-3 inline" />
                    </th>
                    <th className="py-2 font-normal">Price</th>
                    <th className="py-2 font-normal">Reduce Only</th>
                    <th className="py-2 font-normal">Trigger Conditions</th>
                    <th className="py-2 font-normal">TP/SL</th>
                  </tr>
                </thead>
              </table>
              {orders.length === 0 && (
                <div className="text-t3 text-[12px] py-2">No open orders yet</div>
              )}
            </div>
          )}

          {/* Trade History Tab */}
          {activeTab === "tradeHistory" && (
            <div>
              {history.length === 0 ? (
                <div className="text-t3 text-[12px]">No trade history yet</div>
              ) : (
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-t2 text-left text-[12px]">
                      <th className="py-2 font-normal">Time</th>
                      <th className="py-2 font-normal">Coin</th>
                      <th className="py-2 font-normal">Side</th>
                      <th className="py-2 font-normal">Size</th>
                      <th className="py-2 font-normal">Entry</th>
                      <th className="py-2 font-normal">Exit</th>
                      <th className="py-2 font-normal">PNL</th>
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
            <div className="text-t3 text-[12px]">No funding history</div>
          )}

          {activeTab === "orderHistory" && (
            <div className="text-t3 text-[12px]">No order history</div>
          )}

          {activeTab === "twap" && (
            <div className="text-t3 text-[12px]">No TWAP orders</div>
          )}

          {activeTab === "interest" && (
            <div className="text-t3 text-[12px]">No interest history</div>
          )}

          {activeTab === "deposits" && (
            <div className="text-t3 text-[12px]">No deposits or withdrawals</div>
          )}
            </div>
          </div>
        </div>
      </div>

      <Footer isConnected={true} />

      {/* Portfolio Margin Modal — PNL data entry */}
      {showPnlModal && (() => {
        // Use modalEditData as working copy; init from effectivePnlData on first open
        const editData = modalEditData ?? effectivePnlData;
        const editTotal = editData.reduce((sum, d) => sum + d.pnl, 0);
        return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-s1 rounded-[12px] border border-brd w-[560px] max-h-[80vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-brd">
              <h2 className="text-[16px] text-white font-medium">PNL Chart Data</h2>
              <button onClick={() => { setShowPnlModal(false); setModalEditData(null); }} className="text-t3 hover:text-t1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description + Total */}
            <div className="px-5 py-3 text-[12px] border-b border-brd flex items-center justify-between">
              <span className="text-t3">Edit daily PNL values. Click Save to apply.</span>
              <span className={cn("font-tabular font-medium", editTotal >= 0 ? "text-grn" : "text-red")}>
                Total: {formatPnl(editTotal)}
              </span>
            </div>

            {/* Scrollable data rows */}
            <div className="flex-1 overflow-y-auto px-5 py-2 max-h-[400px]">
              {/* Column headers */}
              <div className="grid grid-cols-[100px_44px_1fr] gap-2 items-center mb-1 px-1">
                <span className="text-[11px] text-t3 font-medium">Date</span>
                <span className="text-[11px] text-t3 font-medium text-center">+/−</span>
                <span className="text-[11px] text-t3 font-medium">Daily PNL ($)</span>
              </div>
              {editData.map((row, i) => {
                const isPositive = row.pnl >= 0;
                return (
                  <div key={row.date} className="grid grid-cols-[100px_44px_1fr] gap-2 items-center py-[3px] px-1">
                    <span className="text-[12px] text-t2 font-tabular">{row.date}</span>
                    {/* Green/Red toggle button */}
                    <button
                      onClick={() => {
                        const newData = [...editData];
                        newData[i] = { ...newData[i], pnl: -newData[i].pnl || (isPositive ? -100 : 100) };
                        setModalEditData(newData);
                      }}
                      className={cn(
                        "w-[36px] h-[28px] rounded-[4px] text-[14px] font-bold flex items-center justify-center transition-colors",
                        isPositive
                          ? "bg-[#26a69a]/20 text-[#26a69a] border border-[#26a69a]/40 hover:bg-[#26a69a]/30"
                          : "bg-[#ef5350]/20 text-[#ef5350] border border-[#ef5350]/40 hover:bg-[#ef5350]/30"
                      )}
                    >
                      {isPositive ? "+" : "−"}
                    </button>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={Math.abs(Math.round(row.pnl * 100) / 100)}
                      onChange={(e) => {
                        const absVal = Math.abs(parseFloat(e.target.value) || 0);
                        const newData = [...editData];
                        newData[i] = { ...newData[i], pnl: isPositive ? absVal : -absVal };
                        setModalEditData(newData);
                      }}
                      className={cn(
                        "h-[28px] px-3 text-[12px] bg-[#0a1114] border rounded-[5px] outline-none focus:border-acc font-tabular text-right",
                        isPositive ? "text-[#26a69a] border-[#26a69a]/30" : "text-[#ef5350] border-[#ef5350]/30"
                      )}
                    />
                  </div>
                );
              })}
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-brd">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Reset = even distribution
                    const daily = naturalCombinedPnl / TOTAL_DAYS;
                    setModalEditData(allDates.map((date) => ({
                      date,
                      pnl: Math.round(daily * 100) / 100,
                    })));
                  }}
                  className="px-4 py-2 text-[12px] text-t2 border border-brd rounded-[6px] hover:bg-s2"
                >
                  Reset (Even)
                </button>
                <button
                  onClick={() => {
                    // Random: realistic wins/losses, ~60% win rate, total = naturalCombinedPnl
                    const raw = allDates.map(() => {
                      const isWin = Math.random() > 0.38;
                      const mag = Math.random() * 0.8 + 0.2;
                      return isWin ? mag * (1 + Math.random() * 1.5) : -mag * (0.5 + Math.random());
                    });
                    const rawSum = raw.reduce((s, v) => s + v, 0);
                    const scale = rawSum !== 0 ? naturalCombinedPnl / rawSum : 0;
                    setModalEditData(allDates.map((date, i) => ({
                      date,
                      pnl: Math.round(raw[i] * scale * 100) / 100,
                    })));
                  }}
                  className="px-4 py-2 text-[12px] text-acc border border-acc rounded-[6px] hover:bg-acc/10"
                >
                  Random Sample
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowPnlModal(false); setModalEditData(null); }}
                  className="px-5 py-2 text-[12px] text-t2 border border-brd rounded-[6px] hover:bg-s2"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setPnlData(editData);
                    setShowPnlModal(false);
                    setModalEditData(null);
                  }}
                  className="px-6 py-2 text-[12px] text-white bg-acc rounded-[6px] hover:bg-acc/80 font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
