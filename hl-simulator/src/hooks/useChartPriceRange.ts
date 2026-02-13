"use client";

import { useState, useEffect, useRef } from "react";
import { type Timeframe, isTradfiCoin } from "@/lib/utils";

/**
 * Custom hook to fetch recent klines from Binance Futures API (crypto)
 * or HL candle API (tradfi) and compute the approximate visible price
 * range for the TradingView chart. Updates every 10 seconds.
 */

// Map coins to Binance Futures symbols (crypto only)
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

// Map our timeframes to HL candle intervals (ms)
const HL_CANDLE_INTERVAL: Record<Timeframe, number> = {
  "1m": 60000,
  "5m": 300000,
  "15m": 900000,
  "1h": 3600000,
  "4h": 14400000,
  "1d": 86400000,
};

interface ChartPriceRange {
  visibleMin: number;
  visibleMax: number;
}

export function useChartPriceRange(
  coin: string,
  timeframe: Timeframe
): ChartPriceRange | null {
  const [range, setRange] = useState<ChartPriceRange | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const isTradfi = isTradfiCoin(coin);
    const symbol = BINANCE_SYMBOL[coin];

    // For crypto coins, need Binance symbol. For tradfi, use HL API.
    if (!isTradfi && !symbol) {
      setRange(null);
      return;
    }

    const fetchRange = async () => {
      try {
        let priceHigh = -Infinity;
        let priceLow = Infinity;

        if (isTradfi) {
          // Tradfi: use HL candle API
          const intervalMs = HL_CANDLE_INTERVAL[timeframe];
          const now = Date.now();
          const startTime = now - intervalMs * 100; // ~100 candles
          const res = await fetch("https://api.hyperliquid.xyz/info", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "candleSnapshot",
              req: { coin, interval: `${intervalMs}`, startTime, endTime: now },
            }),
          });
          if (!res.ok) return;
          const data = await res.json();
          if (!Array.isArray(data) || data.length === 0) return;

          for (const candle of data) {
            const high = parseFloat(candle.h);
            const low = parseFloat(candle.l);
            if (high > priceHigh) priceHigh = high;
            if (low < priceLow) priceLow = low;
          }
        } else {
          // Crypto: use Binance Futures API
          const interval = BINANCE_INTERVAL[timeframe];
          const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=100`;
          const res = await fetch(url);
          if (!res.ok) return;
          const data = await res.json();
          if (!Array.isArray(data) || data.length === 0) return;

          for (const kline of data) {
            const high = parseFloat(kline[2]);
            const low = parseFloat(kline[3]);
            if (high > priceHigh) priceHigh = high;
            if (low < priceLow) priceLow = low;
          }
        }

        if (priceHigh === -Infinity || priceLow === Infinity) return;
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

    setRange(null); // reset on coin/timeframe change
    fetchRange();
    intervalRef.current = setInterval(fetchRange, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [coin, timeframe]);

  return range;
}
