"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { type SupportedCoin, type Timeframe } from "@/lib/utils";

/**
 * Chart legend overlay — replicates real Hyperliquid's chart legend.
 * Format: {COIN}USD · {timeframe} · Hyperliquid  ●  O{open} H{high} L{low} C{close} {change} ({pct}%)
 * OHLC data fetched from Binance Futures klines API, updated every 3s.
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

// Map our timeframes to Binance kline intervals
const BINANCE_INTERVAL: Record<Timeframe, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "1d": "1d",
};

// Map coins to Binance Futures symbols
const BINANCE_SYMBOL: Record<string, string> = {
  HYPE: "HYPEUSDT",
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
  DOGE: "DOGEUSDT",
  AVAX: "AVAXUSDT",
  LINK: "LINKUSDT",
  ARB: "ARBUSDT",
  OP: "OPUSDT",
  SUI: "SUIUSDT",
  WIF: "WIFUSDT",
  PEPE: "PEPEUSDT",
  JUP: "JUPUSDT",
  TIA: "TIAUSDT",
  SEI: "SEIUSDT",
  INJ: "INJUSDT",
  RENDER: "RENDERUSDT",
  FET: "FETUSDT",
  ONDO: "ONDOUSDT",
  STX: "STXUSDT",
  NEAR: "NEARUSDT",
  BONK: "BONKUSDT",
};

interface OHLCData {
  open: number;
  high: number;
  low: number;
  close: number;
}

function useKlineOHLC(coin: SupportedCoin, timeframe: Timeframe): OHLCData | null {
  const [ohlc, setOhlc] = useState<OHLCData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchKline = useCallback(async () => {
    const symbol = BINANCE_SYMBOL[coin];
    if (!symbol) return;
    const interval = BINANCE_INTERVAL[timeframe];
    try {
      const res = await fetch(
        `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=1`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data && data[0]) {
        const [, open, high, low, close] = data[0];
        setOhlc({
          open: parseFloat(open),
          high: parseFloat(high),
          low: parseFloat(low),
          close: parseFloat(close),
        });
      }
    } catch {
      // silently fail
    }
  }, [coin, timeframe]);

  useEffect(() => {
    // Fetch immediately, then every 3 seconds
    fetchKline();
    intervalRef.current = setInterval(fetchKline, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchKline]);

  return ohlc;
}

// Format number matching real HL legend style — show meaningful precision
function formatOHLC(value: number): string {
  // For very small values (e.g. PEPE, BONK), show more decimals
  if (value < 0.01) return value.toFixed(6).replace(".", ",");
  if (value < 1) return value.toFixed(4).replace(".", ",");
  if (value < 100) return value.toFixed(3).replace(".", ",");
  // For large values like BTC, show whole number with comma as decimal sep
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: value < 1000 ? 2 : 0,
    maximumFractionDigits: value < 1000 ? 2 : 0,
  });
}

interface ChartLegendOverlayProps {
  coin: SupportedCoin;
  timeframe: Timeframe;
  price: number | null;
}

export function ChartLegendOverlay({ coin, timeframe }: ChartLegendOverlayProps) {
  const tfLabel = TIMEFRAME_LABEL[timeframe] || timeframe;
  const symbolName = `${coin}USD`;
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

      {/* OHLC values — real candle data from Binance */}
      {ohlc && (
        <>
          <span className="text-[12px] leading-none ml-[6px]">
            <span className="text-[#898e94]">O</span>
            <span style={{ color: valueColor }}>{formatOHLC(ohlc.open)}</span>
          </span>
          <span className="text-[12px] leading-none ml-[4px]">
            <span className="text-[#898e94]">H</span>
            <span style={{ color: valueColor }}>{formatOHLC(ohlc.high)}</span>
          </span>
          <span className="text-[12px] leading-none ml-[4px]">
            <span className="text-[#898e94]">L</span>
            <span style={{ color: valueColor }}>{formatOHLC(ohlc.low)}</span>
          </span>
          <span className="text-[12px] leading-none ml-[4px]">
            <span className="text-[#898e94]">C</span>
            <span style={{ color: valueColor }}>{formatOHLC(ohlc.close)}</span>
          </span>

          {/* Change value + percentage */}
          {change !== null && changePct !== null && (
            <span className="text-[12px] leading-none ml-[4px]" style={{ color: valueColor }}>
              {formatOHLC(Math.abs(change))}{" "}
              ({isPositive ? "+" : "-"}{Math.abs(changePct).toFixed(2).replace(".", ",")}%)
            </span>
          )}
        </>
      )}
    </div>
  );
}
