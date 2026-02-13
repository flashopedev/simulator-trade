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
  coinDisplayName,
} from "@/lib/utils";
import { fetchAllMids, fetchDeployerAllMids } from "@/lib/hyperliquid";
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
  const [modalEditData, setModalEditData] = useState<{ date: string; pnl: number; volume: number }[] | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("30D");
  const [showTimePeriodDropdown, setShowTimePeriodDropdown] = useState(false);

  // PNL + Volume data points — stored as { date, pnl, volume }[]
  // Volume is derived from PNL: realistic multiplier (volume >> pnl since PNL is the diff)
  // Persisted in localStorage so data survives page reloads
  const [pnlData, setPnlData] = useState<{ date: string; pnl: number; volume: number }[] | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem("hl_sim_pnl_data");
      if (saved) {
        const parsed = JSON.parse(saved);
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
        const [mids, tradfiMids] = await Promise.all([
          fetchAllMids(),
          fetchDeployerAllMids("xyz"),
        ]);
        if (active) {
          const updated: Record<string, number> = { ...FALLBACK_PRICES };
          if (mids) {
            Object.entries(mids).forEach(([coin, mid]) => {
              if (mid) updated[coin] = parseFloat(mid);
            });
          }
          if (tradfiMids) {
            Object.entries(tradfiMids).forEach(([coin, mid]) => {
              if (mid) updated[coin] = parseFloat(mid);
            });
          }
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

  // Generate realistic volume from PNL value for a given day
  // Volume is always >> abs(PNL) because PNL is the small difference from large trades
  // Multiplier: 20x–80x of abs(PNL), with some randomness via seeded hash
  const volumeFromPnl = (pnl: number, dayIndex: number): number => {
    const absPnl = Math.abs(pnl);
    if (absPnl < 1) return Math.round(500 + dayIndex * 7.3) ; // minimal volume for ~0 PNL days
    // Seeded multiplier: 20x to 80x, varies per day
    const hashVal = Math.sin(dayIndex * 313.7 + 77) * 43758.5453;
    const r = hashVal - Math.floor(hashVal); // 0..1
    const multiplier = 20 + r * 60; // 20x to 80x
    return Math.round(absPnl * multiplier * 100) / 100;
  };

  // Initialize pnlData: realistic daily PNL with wins and losses + volume
  // Only runs ONCE: either generates fresh data or aligns saved data to current date window
  // After initialization, pnlData is never overwritten by this effect (user edits are preserved)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (pnlData !== null) {
      // Saved data exists — check if we need to backfill volume or align dates
      const savedMap = new Map(pnlData.map((d) => [d.date, d]));
      const savedDates = new Set(pnlData.map((d) => d.date));
      const hasNewDates = allDates.some((d) => !savedDates.has(d));
      const needsVolumeBackfill = pnlData.some((d) => !d.volume && d.volume !== 0);
      if (hasNewDates || pnlData.length !== TOTAL_DAYS || needsVolumeBackfill) {
        const aligned = allDates.map((date, i) => {
          const existing = savedMap.get(date);
          const pnl = existing?.pnl ?? 0;
          const volume = (existing?.volume != null && existing.volume > 0) ? existing.volume : volumeFromPnl(pnl, i);
          return { date, pnl, volume };
        });
        setPnlData(aligned);
      }
      pnlInitialized.current = true;
    } else if (!pnlInitialized.current && naturalCombinedPnl !== 0) {
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
      const newData = allDates.map((date, i) => {
        const pnl = Math.round(rawPnl[i] * scale * 100) / 100;
        return { date, pnl, volume: volumeFromPnl(pnl, i) };
      });
      setPnlData(newData);
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
  const effectivePnlData = pnlData ?? allDates.map((date, i) => {
    const pnl = naturalCombinedPnl / TOTAL_DAYS;
    return { date, pnl, volume: volumeFromPnl(pnl, i) };
  });

  // --- Time period slicing ---
  // How many days to show based on timePeriod
  const periodDays = timePeriod === "24H" ? 1 : timePeriod === "7D" ? 7 : timePeriod === "30D" ? 30 : effectivePnlData.length;
  // Sliced data for display (last N days)
  const periodPnlData = effectivePnlData.slice(-periodDays);

  // Period-based PNL (sum of visible days)
  const periodPnl = periodPnlData.reduce((sum, d) => sum + d.pnl, 0);

  // Period-based Volume — sum of simulated daily volumes for the period
  const periodVolume = periodPnlData.reduce((sum, d) => sum + (d.volume || 0), 0);

  // 14 Day Volume — sum of last 14 days from simulated data
  const sim14dVolume = effectivePnlData.slice(-14).reduce((sum, d) => sum + (d.volume || 0), 0);

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
    { key: "positions", label: positions.length > 0 ? `Positions (${positions.length})` : "Positions" },
    { key: "openOrders", label: pendingOrders.length > 0 ? `Open Orders (${pendingOrders.length})` : "Open Orders" },
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
                <div className="text-[28px] font-normal text-white leading-[30px]">${formatNumber(sim14dVolume)}</div>
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

        {/* Bottom tabs - pixel-perfect match to real HL */}
        <div className="max-w-[1312px] mx-auto w-full px-4 mt-2">
          <div className="bg-s1 rounded-[10px]" style={{ paddingBottom: "8px" }}>
            {/* Tabs row: h=35px, tabs separated by 1px solid #303030 at bottom, active has teal underline */}
            <div className="flex items-center justify-between">
              <div className="flex items-center" style={{ height: "35px" }}>
                {bottomTabs.map((tab) => (
                  <div
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="relative cursor-pointer flex items-center whitespace-nowrap"
                    style={{
                      height: "35px",
                      lineHeight: "34px",
                      padding: "0 12px",
                      fontSize: "12px",
                      fontWeight: 400,
                      color: activeTab === tab.key ? "rgb(246, 254, 253)" : "rgb(148, 158, 156)",
                      borderBottom: "1px solid rgb(48, 48, 48)",
                    }}
                  >
                    {tab.label}
                    {/* Teal accent underline for active tab — separate div like real HL */}
                    {activeTab === tab.key && (
                      <div className="absolute bottom-0 left-0 right-0" style={{ height: "1px", background: "rgb(80, 210, 193)" }} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center" style={{ gap: "16px", height: "35px", borderBottom: "1px solid rgb(48, 48, 48)", paddingRight: "12px" }}>
                <button className="flex items-center gap-1.5 text-[12px] hover:opacity-80" style={{ color: "rgb(246, 254, 253)", fontWeight: 400 }}>
                  Filter <ChevronDown className="w-4 h-4" />
                </button>
                {activeTab === "balances" && (
                  <label className="flex items-center gap-2 text-[12px] cursor-pointer" style={{ color: "rgb(246, 254, 253)", fontWeight: 400 }}>
                    <input
                      type="checkbox"
                      checked={hideSmallBalances}
                      onChange={(e) => setHideSmallBalances(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-brd bg-transparent accent-acc"
                    />
                    Hide Small Balances
                  </label>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div style={{ padding: "0 12px" }}>
          {/* Positions Tab */}
          {activeTab === "positions" && (
            <div>
              {positions.length === 0 ? (
                <div style={{ color: "rgb(148,158,156)", fontSize: "12px", lineHeight: "24px" }}>No open positions yet</div>
              ) : (
                <table className="w-full" style={{ fontSize: "12px", fontWeight: 400, borderCollapse: "collapse", lineHeight: "24px" }}>
                  <thead>
                    <tr style={{ color: "rgb(148,158,156)", height: "24px", lineHeight: "24px", textAlign: "left" }}>
                      <th style={{ fontWeight: 400 }}>Coin</th>
                      <th style={{ fontWeight: 400 }}>Size</th>
                      <th style={{ fontWeight: 400 }}>
                        <span className="border-b border-dotted border-current cursor-pointer">Position Value</span> <ChevronDown className="w-3 h-3 inline" />
                      </th>
                      <th style={{ fontWeight: 400 }}>Entry Price</th>
                      <th style={{ fontWeight: 400 }}>Mark Price</th>
                      <th style={{ fontWeight: 400 }}><span className="border-b border-dotted border-current">PNL (ROE %)</span></th>
                      <th style={{ fontWeight: 400 }}>Liq. Price</th>
                      <th style={{ fontWeight: 400 }}><span className="border-b border-dotted border-current">Margin</span></th>
                      <th style={{ fontWeight: 400 }}><span className="border-b border-dotted border-current cursor-pointer">Funding</span></th>
                      <th style={{ fontWeight: 400 }}><span className="border-b border-dotted border-current cursor-pointer">Close All</span></th>
                      <th style={{ fontWeight: 400 }}>TP/SL</th>
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
                          style={{ height: "24px", lineHeight: "24px" }}
                        >
                          <td style={{ padding: 0 }}>
                            <span className={cn("font-medium", isLong ? "text-grn" : "text-red")}>{coinDisplayName(p.coin)}</span>
                            <span className="ml-1.5 text-[11px] text-acc">{p.leverage}x</span>
                          </td>
                          <td className="font-tabular text-acc" style={{ padding: 0 }}>{sizeFormatted} {coinDisplayName(p.coin)}</td>
                          <td className="font-tabular text-t1" style={{ padding: 0 }}>{formatNumber(positionValue).replace(".", ",")} USDC</td>
                          <td className="font-tabular text-t2" style={{ padding: 0 }}>{p.entry_price.toFixed(decimals)}</td>
                          <td className="font-tabular text-t2" style={{ padding: 0 }}>{markPrice.toFixed(decimals)}</td>
                          <td className={cn("font-tabular", pnl >= 0 ? "text-grn" : "text-red")} style={{ padding: 0 }}>
                            {formatPnl(pnl)} ({roe >= 0 ? "+" : ""}{roe.toFixed(1)}%)
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline ml-1 opacity-50">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </td>
                          <td className="font-tabular text-t2" style={{ padding: 0 }}>{p.liquidation_price.toFixed(decimals)}</td>
                          <td className="font-tabular text-t2" style={{ padding: 0 }}>
                            ${formatNumber(margin)} ({marginMode === "cross" ? "Cross" : "Isolated"})
                          </td>
                          <td style={{ padding: 0 }}>
                            <span className="text-grn font-tabular">$0,00</span>
                          </td>
                          <td style={{ padding: 0 }}>
                            <button
                              onClick={() => handleClosePosition(p)}
                              className="text-[12px] text-acc cursor-pointer"
                            >
                              Connect
                            </button>
                          </td>
                          <td className="text-t3" style={{ padding: 0 }}>
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
            <div>
              {(account?.balance ?? 10000) > 0 || !hideSmallBalances ? (
                <table className="w-full" style={{ fontSize: "12px", fontWeight: 400, borderCollapse: "collapse", tableLayout: "fixed", lineHeight: "24px" }}>
                  {/* Column widths matching real HL proportions: 12% 14% 14% 12% 12% 10% 14% 12% */}
                  <colgroup>
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "12%" }} />
                  </colgroup>
                  {/* Header row — rgb(148,158,156), h=24px, lineHeight=24px */}
                  <thead>
                    <tr style={{ color: "rgb(148,158,156)", height: "24px", lineHeight: "24px", textAlign: "left" }}>
                      <td style={{ fontWeight: 400, cursor: "pointer" }}>Coin</td>
                      <td style={{ fontWeight: 400, cursor: "pointer" }}>Total Balance</td>
                      <td style={{ fontWeight: 400, cursor: "pointer" }}>Available Balance</td>
                      <td style={{ fontWeight: 400, cursor: "pointer" }}>USDC Value <ChevronDown className="w-3 h-3 inline" /></td>
                      <td style={{ fontWeight: 400, cursor: "pointer" }}><span className="border-b border-dotted border-current">PNL (ROE %)</span></td>
                      <td style={{ fontWeight: 400, cursor: "pointer" }}>Send</td>
                      <td style={{ fontWeight: 400, cursor: "pointer" }}>Transfer</td>
                      <td style={{ fontWeight: 400, cursor: "pointer" }}>Contract</td>
                    </tr>
                  </thead>
                  {/* Data row — h=24px, lineHeight=24px */}
                  <tbody>
                    <tr style={{ height: "24px", lineHeight: "24px", color: "rgb(246, 254, 253)" }}>
                      <td style={{ color: "rgb(246, 254, 253)" }}>USDC</td>
                      <td className="font-tabular" style={{ color: "rgb(255,255,255)" }}>{formatNumber(totalEquity)} USDC</td>
                      <td className="font-tabular" style={{ color: "rgb(255,255,255)" }}><span className="border-b border-dotted border-current cursor-pointer">{formatNumber(availableBalance)} USDC</span></td>
                      <td className="font-tabular" style={{ color: "rgb(255,255,255)" }}>${formatNumber(totalEquity)}</td>
                      <td></td>
                      <td><span style={{ color: "rgb(80, 210, 193)", cursor: "pointer" }}>Connect</span></td>
                      <td><span style={{ color: "rgb(14, 51, 51)" }}>Transfer to Perps</span></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div style={{ color: "rgb(148,158,156)", fontSize: "12px" }}>No balances yet</div>
              )}
            </div>
          )}

          {/* Open Orders Tab */}
          {activeTab === "openOrders" && (
            <div>
              <table className="w-full" style={{ fontSize: "12px", fontWeight: 400, borderCollapse: "collapse", lineHeight: "24px" }}>
                <thead>
                  <tr style={{ color: "rgb(148,158,156)", height: "24px", lineHeight: "24px", textAlign: "left" }}>
                    <th style={{ fontWeight: 400 }}>Time</th>
                    <th style={{ fontWeight: 400 }}>Type</th>
                    <th style={{ fontWeight: 400 }}>Coin</th>
                    <th style={{ fontWeight: 400 }}>Direction</th>
                    <th style={{ fontWeight: 400 }}>Size</th>
                    <th style={{ fontWeight: 400 }}>Original Size</th>
                    <th style={{ fontWeight: 400 }}>
                      Order Value <ChevronDown className="w-3 h-3 inline" />
                    </th>
                    <th style={{ fontWeight: 400 }}>Price</th>
                    <th style={{ fontWeight: 400 }}>Reduce Only</th>
                    <th style={{ fontWeight: 400 }}>Trigger Conditions</th>
                    <th style={{ fontWeight: 400 }}>TP/SL</th>
                  </tr>
                </thead>
              </table>
              {orders.length === 0 && (
                <div style={{ color: "rgb(148,158,156)", fontSize: "12px", padding: "4px 0" }}>No open orders yet</div>
              )}
            </div>
          )}

          {/* Trade History Tab */}
          {activeTab === "tradeHistory" && (
            <div>
              {history.length === 0 ? (
                <div style={{ color: "rgb(148,158,156)", fontSize: "12px" }}>No trade history yet</div>
              ) : (
                <table className="w-full" style={{ fontSize: "12px", fontWeight: 400, borderCollapse: "collapse", lineHeight: "24px" }}>
                  <thead>
                    <tr style={{ color: "rgb(148,158,156)", height: "24px", lineHeight: "24px", textAlign: "left" }}>
                      <th style={{ fontWeight: 400 }}>Time</th>
                      <th style={{ fontWeight: 400 }}>Coin</th>
                      <th style={{ fontWeight: 400 }}>Side</th>
                      <th style={{ fontWeight: 400 }}>Size</th>
                      <th style={{ fontWeight: 400 }}>Entry</th>
                      <th style={{ fontWeight: 400 }}>Exit</th>
                      <th style={{ fontWeight: 400 }}>PNL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 50).map((h) => {
                      const decimals = COIN_DECIMALS[h.coin] || 2;
                      return (
                        <tr key={h.id} className="border-t border-brd" style={{ height: "24px", lineHeight: "24px" }}>
                          <td className="text-t3" style={{ padding: 0 }}>{new Date(h.closed_at).toLocaleString()}</td>
                          <td className="font-medium text-t1" style={{ padding: 0 }}>{coinDisplayName(h.coin)}{h.liquidated && " 💀"}</td>
                          <td className={cn(h.side === "Long" ? "text-grn" : "text-red")} style={{ padding: 0 }}>
                            {h.leverage}x {h.side}
                          </td>
                          <td className="font-tabular text-t2" style={{ padding: 0 }}>{h.size.toFixed(4)}</td>
                          <td className="font-tabular text-t2" style={{ padding: 0 }}>{h.entry_price.toFixed(decimals)}</td>
                          <td className="font-tabular text-t2" style={{ padding: 0 }}>{h.exit_price.toFixed(decimals)}</td>
                          <td className={cn("font-tabular font-medium", h.pnl >= 0 ? "text-grn" : "text-red")} style={{ padding: 0 }}>
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
            <div style={{ color: "rgb(148,158,156)", fontSize: "12px" }}>No funding history</div>
          )}

          {activeTab === "orderHistory" && (
            <div style={{ color: "rgb(148,158,156)", fontSize: "12px" }}>No order history</div>
          )}

          {activeTab === "twap" && (
            <div style={{ color: "rgb(148,158,156)", fontSize: "12px" }}>No TWAP orders</div>
          )}

          {activeTab === "interest" && (
            <div style={{ color: "rgb(148,158,156)", fontSize: "12px" }}>No interest history</div>
          )}

          {activeTab === "deposits" && (
            <div style={{ color: "rgb(148,158,156)", fontSize: "12px" }}>No deposits or withdrawals</div>
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
                        const newPnl = -newData[i].pnl || (isPositive ? -100 : 100);
                        newData[i] = { ...newData[i], pnl: newPnl, volume: volumeFromPnl(newPnl, i) };
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
                        const newPnl = isPositive ? absVal : -absVal;
                        const newData = [...editData];
                        newData[i] = { ...newData[i], pnl: newPnl, volume: volumeFromPnl(newPnl, i) };
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
                    const pnl = Math.round(daily * 100) / 100;
                    setModalEditData(allDates.map((date, i) => ({
                      date,
                      pnl,
                      volume: volumeFromPnl(pnl, i),
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
                    setModalEditData(allDates.map((date, i) => {
                      const pnl = Math.round(raw[i] * scale * 100) / 100;
                      return { date, pnl, volume: volumeFromPnl(pnl, i) };
                    }));
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
