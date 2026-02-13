"use client";

import { cn, type SupportedCoin, type Timeframe } from "@/lib/utils";

/**
 * Chart top bar — pixel-perfect replica of real Hyperliquid/TradingView header.
 * Height: 38px, bg: #0f1a1f (same as chart).
 * Layout: [5m] [1h] [D] [▼] | [candles icon] [fx Indicators] ... [search] [fullscreen]
 * Active timeframe: rgb(80,210,193) = #50D2C1 (HL accent).
 * Inactive: rgb(209,212,220) = #d1d4dc.
 * Font: 14px.
 */

// ─── SVGs from real HL TradingView ───

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 8" width="16" height="8">
    <path fill="currentColor" d="M0 1.475l7.396 6.04.596.485.593-.49L16 1.39 14.807 0 7.393 6.122 8.58 6.12 1.186.08z"></path>
  </svg>
);

const CandlesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="currentColor">
    <path d="M17 11v6h3v-6h-3zm-.5-1h4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5z"></path>
    <path d="M18 7h1v3.5h-1zm0 10.5h1V21h-1z"></path>
    <path d="M9 8v12h3V8H9zm-.5-1h4a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 .5-.5z"></path>
    <path d="M10 4h1v3.5h-1zm0 16.5h1V24h-1z"></path>
  </svg>
);

const IndicatorsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="none">
    <path stroke="currentColor" d="M20 17l-5 5M15 17l5 5M9 11.5h7M17.5 8a2.5 2.5 0 0 0-5 0v11a2.5 2.5 0 0 1-5 0"></path>
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="currentColor">
    <path d="M17.646 18.354l4 4 .708-.708-4-4z"></path>
    <path d="M12.5 20a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zm0-1a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z"></path>
  </svg>
);

const FullscreenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="currentColor">
    <path d="M7 20.5V17h1v4h4v1H7.5a.5.5 0 0 1-.5-.5zM20 7.5V11h1V7h-4V6h3.5a.5.5 0 0 1 .5.5z"></path>
    <path d="M7 7.5V11H6V7h4v1H7.5a.5.5 0 0 0-.5.5zM21 20.5V17h-1v4h-4v1h4.5a.5.5 0 0 0 .5-.5z"></path>
  </svg>
);

// Map timeframe IDs to display labels
const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: "5m", label: "5m" },
  { id: "1h", label: "1h" },
  { id: "1d", label: "D" },
];

interface ChartTopBarProps {
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
}

export function ChartTopBar({ timeframe, onTimeframeChange }: ChartTopBarProps) {
  // Map from our internal timeframes to top bar display
  const activeLabel = timeframe === "1d" ? "D" : timeframe === "15m" ? "5m" :
                      timeframe === "5m" ? "5m" : timeframe === "1h" ? "1h" :
                      timeframe === "4h" ? "1h" : timeframe === "1m" ? "5m" : "5m";

  return (
    <div className="flex items-center h-[38px] bg-[#0f1a1f] flex-shrink-0 select-none">
      {/* Timeframe buttons — left side */}
      <div className="flex items-center">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.id}
            onClick={() => onTimeframeChange(tf.id)}
            className={cn(
              "h-[38px] px-[6px] text-[14px] font-normal transition-colors",
              (tf.label === activeLabel || tf.id === timeframe)
                ? "text-[#50D2C1]"
                : "text-[#d1d4dc] hover:text-white"
            )}
          >
            {tf.label}
          </button>
        ))}

        {/* Timeframe dropdown */}
        <button className="h-[38px] w-[20px] flex items-center justify-center text-[#868993] hover:text-[#d1d4dc]">
          <ChevronDownIcon />
        </button>
      </div>

      {/* Separator */}
      <div className="w-px h-[22px] bg-[#2a3740] mx-[4px]" />

      {/* Chart type (candles) */}
      <button className="h-[38px] w-[38px] flex items-center justify-center text-[#d1d4dc] hover:text-white">
        <CandlesIcon />
      </button>

      {/* Indicators button with icon + text */}
      <button className="h-[38px] flex items-center gap-1.5 px-[8px] text-[#d1d4dc] hover:text-white">
        <IndicatorsIcon />
        <span className="text-[14px]">Indicators</span>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side buttons */}
      <button className="h-[38px] w-[38px] flex items-center justify-center text-[#868993] hover:text-[#d1d4dc]">
        <SearchIcon />
      </button>
      <button className="h-[38px] w-[38px] flex items-center justify-center text-[#868993] hover:text-[#d1d4dc]">
        <FullscreenIcon />
      </button>
    </div>
  );
}
