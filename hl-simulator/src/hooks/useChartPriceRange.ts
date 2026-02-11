"use client";

import { useState, useEffect, useRef } from "react";
import { type SupportedCoin, type Timeframe } from "@/lib/utils";

/**
 * Custom hook to fetch recent klines from Binance Futures API
 * and compute the approximate visible price range for the TradingView chart.
 * Updates every 10 seconds.
 */

// Map coins to Binance Futures symbols (same as ChartLegendOverlay)
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

// Map our timeframes to Binance kline intervals
const BINANCE_INTERVAL: Record<Timeframe, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "1d": "1d",
};

interface ChartPriceRange {
  visibleMin: number;
  visibleMax: number;
}

export function useChartPriceRange(
  coin: SupportedCoin,
  timeframe: Timeframe
): ChartPriceRange | null {
  const [range, setRange] = useState<ChartPriceRange | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const symbol = BINANCE_SYMBOL[coin];
    const interval = BINANCE_INTERVAL[timeframe];
    if (!symbol) {
      setRange(null);
      return;
    }

    const fetchRange = async () => {
      try {
        const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=100`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return;

        // Kline format: [openTime, open, high, low, close, volume, closeTime, ...]
        let priceHigh = -Infinity;
        let priceLow = Infinity;
        for (const kline of data) {
          const high = parseFloat(kline[2]);
          const low = parseFloat(kline[3]);
          if (high > priceHigh) priceHigh = high;
          if (low < priceLow) priceLow = low;
        }

        const spread = priceHigh - priceLow;
        const padding = spread * 0.05;
        setRange({
          visibleMax: priceHigh + padding,
          visibleMin: priceLow - padding,
        });
      } catch {
        // silently ignore fetch errors
      }
    };

    fetchRange();
    intervalRef.current = setInterval(fetchRange, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [coin, timeframe]);

  return range;
}
