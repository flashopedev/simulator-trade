"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { type Timeframe, coinDisplayName, isTradfiCoin } from "@/lib/utils";

/**
 * Chart legend overlay — replicates real Hyperliquid's chart legend.
 * Format: {COIN}USD · {timeframe} · Hyperliquid  ●  O{open} H{high} L{low} C{close} {change} ({pct}%)
 * All OHLC data fetched from Hyperliquid candle API (same source as real HL TradingView).
 * This ensures identical precision/formatting to real HL.
 *
 * Symbol format: crypto = "BTCUSD", tradfi = "xyz:GOLDUSD" (no slash, matching real HL).
 * Change value uses more decimal places than OHLC (TradingView minMove precision).
 */

// Map timeframe to display label (matching real HL format)
const TIMEFRAME_LABEL: Record<Timeframe, string> = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "1h": "1h",
  "4h": "4h",
  "1d": "D",
};

// Map internal coin names to HL API names (most are the same, some differ)
const HL_API_COIN: Record<string, string> = {
  PEPE: "kPEPE",
  BONK: "kBONK",
};

// OHLC price decimals matching real HL TradingView pricescale.
// These were verified by inspecting the TradingView legend DOM on app.hyperliquid.xyz.
// HL candle API may return more decimals than TradingView displays, so we hardcode.
const OHLC_DECIMALS: Record<string, number> = {
  // Crypto — verified from real HL TradingView
  BTC: 0, ETH: 1, HYPE: 3, SOL: 3, DOGE: 6,
  AVAX: 4, LINK: 4, ARB: 5, OP: 5, SUI: 5,
  WIF: 5, PEPE: 6, JUP: 5, TIA: 5, SEI: 6,
  INJ: 4, RENDER: 4, FET: 5, ONDO: 5, STX: 5,
  NEAR: 4, BONK: 6,
  // Tradfi — verified from real HL TradingView
  "xyz:GOLD": 1,
  "xyz:TSLA": 2, "xyz:NVDA": 2, "xyz:AAPL": 2, "xyz:GOOGL": 2,
  "xyz:AMZN": 2, "xyz:META": 2, "xyz:MSFT": 2, "xyz:COIN": 2,
  "xyz:PLTR": 2, "xyz:HOOD": 3, "xyz:AMD": 2, "xyz:NFLX": 3,
  "xyz:MSTR": 2, "xyz:INTC": 3,
};

// Change value decimals — TradingView shows the change (close-open) with MORE
// decimals than OHLC (based on minMove/minTick). Verified from real HL DOM.
// Pattern is roughly OHLC + 2, but varies per coin.
const CHANGE_DECIMALS: Record<string, number> = {
  BTC: 2, ETH: 4, HYPE: 5, SOL: 5, DOGE: 8,
  AVAX: 6, LINK: 6, ARB: 7, OP: 7, SUI: 7,
  WIF: 7, PEPE: 8, JUP: 7, TIA: 7, SEI: 8,
  INJ: 6, RENDER: 6, FET: 7, ONDO: 7, STX: 7,
  NEAR: 6, BONK: 8,
  "xyz:GOLD": 3,
  "xyz:TSLA": 4, "xyz:NVDA": 4, "xyz:AAPL": 4, "xyz:GOOGL": 4,
  "xyz:AMZN": 4, "xyz:META": 4, "xyz:MSFT": 4, "xyz:COIN": 4,
  "xyz:PLTR": 4, "xyz:HOOD": 5, "xyz:AMD": 4, "xyz:NFLX": 5,
  "xyz:MSTR": 4, "xyz:INTC": 5,
};

// Duration in ms for calculating startTime
const HL_CANDLE_DURATION: Record<Timeframe, number> = {
  "1m": 60000,
  "5m": 300000,
  "15m": 900000,
  "1h": 3600000,
  "4h": 14400000,
  "1d": 86400000,
};

interface OHLCData {
  open: number;
  high: number;
  low: number;
  close: number;
  decimals: number; // price decimals detected from API response
}

// Detect decimal places from an API price string (e.g. "5010.1" → 1, "0.096355" → 6)
function detectDecimals(priceStr: string): number {
  const dot = priceStr.indexOf(".");
  if (dot === -1) return 0;
  return priceStr.length - dot - 1;
}

function useKlineOHLC(coin: string, timeframe: Timeframe): OHLCData | null {
  const [ohlc, setOhlc] = useState<OHLCData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchKline = useCallback(async () => {
    try {
      const apiCoin = HL_API_COIN[coin] || coin; // Map PEPE→kPEPE, BONK→kBONK, etc.
      const interval = timeframe;
      const durationMs = HL_CANDLE_DURATION[timeframe];
      const now = Date.now();
      const startTime = now - durationMs * 2; // get last 2 candles
      const res = await fetch("https://api.hyperliquid.xyz/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "candleSnapshot",
          req: { coin: apiCoin, interval, startTime, endTime: now },
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.length > 0) {
        const last = data[data.length - 1];
        // Use hardcoded decimals (matching real HL TradingView), fallback to API detection
        const apiDecimals = Math.max(
          detectDecimals(last.o), detectDecimals(last.h),
          detectDecimals(last.l), detectDecimals(last.c)
        );
        const decimals = OHLC_DECIMALS[coin] ?? apiDecimals;
        setOhlc({
          open: parseFloat(last.o),
          high: parseFloat(last.h),
          low: parseFloat(last.l),
          close: parseFloat(last.c),
          decimals,
        });
      }
    } catch { /* silent */ }
  }, [coin, timeframe]);

  useEffect(() => {
    setOhlc(null); // reset on coin/timeframe change
    fetchKline();
    intervalRef.current = setInterval(fetchKline, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchKline]);

  return ohlc;
}

// Format number matching real HL/TradingView legend style:
// - Space as thousands separator, comma as decimal separator
// - Decimal places match the precision from API data
function formatOHLC(value: number, decimals: number): string {
  const fixed = value.toFixed(decimals);
  const [intPart, fracPart] = fixed.split(".");
  // Add space as thousands separator to integer part
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  if (decimals === 0) return withSpaces;
  return `${withSpaces},${fracPart}`;
}

interface ChartLegendOverlayProps {
  coin: string;
  timeframe: Timeframe;
  price: number | null;
}

export function ChartLegendOverlay({ coin, timeframe }: ChartLegendOverlayProps) {
  const tfLabel = TIMEFRAME_LABEL[timeframe] || timeframe;
  // Real HL format: crypto = "HYPEUSD", tradfi = "xyz:GOLDUSD" (no slash)
  const displayCoin = coinDisplayName(coin);
  const symbolName = isTradfiCoin(coin)
    ? `xyz:${displayCoin}USD`
    : `${displayCoin}USD`;
  const ohlc = useKlineOHLC(coin, timeframe);

  // Calculate change and percentage
  const change = ohlc ? ohlc.close - ohlc.open : null;
  const changePct = ohlc && ohlc.open !== 0 ? ((ohlc.close - ohlc.open) / ohlc.open) * 100 : null;
  const isPositive = change !== null && change >= 0;
  const valueColor = isPositive ? "#26a69a" : "#ef5350";

  return (
    <div
      className="absolute top-[8px] left-[8px] pointer-events-none z-10 flex items-center gap-[6px]"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      {/* Symbol · Timeframe · Exchange */}
      <span className="text-[14px] font-normal text-[#d1d4dc] leading-none">
        {symbolName}
      </span>
      <span className="text-[14px] text-[#d1d4dc] leading-none">·</span>
      <span className="text-[14px] text-[#d1d4dc] leading-none">
        {tfLabel}
      </span>
      <span className="text-[14px] text-[#d1d4dc] leading-none">·</span>
      <span className="text-[14px] text-[#d1d4dc] leading-none">
        Hyperliquid
      </span>

      {/* Green dot with glow — matching real HL */}
      <span
        className="inline-block w-[8px] h-[8px] rounded-full ml-[4px] flex-shrink-0"
        style={{
          backgroundColor: "#26a69a",
          boxShadow: "0 0 4px 1px rgba(38, 166, 154, 0.6), 0 0 8px 2px rgba(38, 166, 154, 0.3)",
        }}
      />

      {/* OHLC values — real candle data */}
      {ohlc && (
        <>
          <span className="text-[12px] leading-none ml-[6px]">
            <span className="text-[#898e94]">O</span>
            <span style={{ color: valueColor }}>{formatOHLC(ohlc.open, ohlc.decimals)}</span>
          </span>
          <span className="text-[12px] leading-none ml-[4px]">
            <span className="text-[#898e94]">H</span>
            <span style={{ color: valueColor }}>{formatOHLC(ohlc.high, ohlc.decimals)}</span>
          </span>
          <span className="text-[12px] leading-none ml-[4px]">
            <span className="text-[#898e94]">L</span>
            <span style={{ color: valueColor }}>{formatOHLC(ohlc.low, ohlc.decimals)}</span>
          </span>
          <span className="text-[12px] leading-none ml-[4px]">
            <span className="text-[#898e94]">C</span>
            <span style={{ color: valueColor }}>{formatOHLC(ohlc.close, ohlc.decimals)}</span>
          </span>

          {/* Change value + percentage — uses more decimals (minMove precision) */}
          {change !== null && changePct !== null && (() => {
            const changeDec = CHANGE_DECIMALS[coin] ?? (ohlc.decimals + 2);
            return (
              <span className="text-[12px] leading-none ml-[4px]" style={{ color: valueColor }}>
                {change < 0 ? "\u2212" : ""}{formatOHLC(Math.abs(change), changeDec)}{" "}
                ({isPositive ? "+" : "\u2212"}{Math.abs(changePct).toFixed(2).replace(".", ",")}%)
              </span>
            );
          })()}
        </>
      )}
    </div>
  );
}
