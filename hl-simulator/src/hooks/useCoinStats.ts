"use client";

import { useEffect, useRef, useState } from "react";
import type { SupportedCoin } from "@/lib/utils";

const BINANCE_FUTURES = "https://fapi.binance.com/fapi/v1";

// Coins that use "1000X" format on Binance Futures (ultra-small price coins)
const BINANCE_1000X_COINS: Record<string, boolean> = {
  PEPE: true,
  BONK: true,
};

export interface CoinStats {
  change24h: number | null;      // percentage, e.g. 2.15
  change24hAbs: number | null;   // absolute, e.g. 1495.30
  volume24h: number | null;      // USD volume
  high24h: number | null;
  low24h: number | null;
  openInterest: number | null;   // USD value
  fundingRate: number | null;    // decimal, e.g. 0.0001 = 0.01%
  nextFundingTime: number | null;
  oraclePrice: number | null;    // index/spot price
  markPrice: number | null;
}

const EMPTY_STATS: CoinStats = {
  change24h: null,
  change24hAbs: null,
  volume24h: null,
  high24h: null,
  low24h: null,
  openInterest: null,
  fundingRate: null,
  nextFundingTime: null,
  oraclePrice: null,
  markPrice: null,
};

// Safe parseFloat that returns null for NaN but keeps 0 as valid
function safeFloat(v: string | undefined | null): number | null {
  if (v == null) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

/**
 * Fetches per-coin market stats from Binance Futures.
 * All coins including HYPE are on Binance Futures (fapi).
 * Polls every 5 seconds.
 */
export function useCoinStats(coin: SupportedCoin) {
  const [stats, setStats] = useState<CoinStats>(EMPTY_STATS);
  const mountedRef = useRef(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    const is1000x = BINANCE_1000X_COINS[coin] ?? false;
    const symbol = is1000x ? `1000${coin}USDT` : `${coin}USDT`;

    const fetchStats = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        // Fetch all three endpoints in parallel, parse JSON immediately
        const [ticker, oi, premium] = await Promise.all([
          fetch(`${BINANCE_FUTURES}/ticker/24hr?symbol=${symbol}`, { signal: controller.signal })
            .then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(`${BINANCE_FUTURES}/openInterest?symbol=${symbol}`, { signal: controller.signal })
            .then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(`${BINANCE_FUTURES}/premiumIndex?symbol=${symbol}`, { signal: controller.signal })
            .then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        clearTimeout(timeout);

        const newStats: CoinStats = { ...EMPTY_STATS };

        // Divisor for 1000X coins (prices are 1000x larger on Binance)
        const div = is1000x ? 1000 : 1;

        // Parse 24hr ticker
        if (ticker) {
          newStats.change24h = safeFloat(ticker.priceChangePercent);
          // Absolute change needs dividing for 1000X coins
          const absChange = safeFloat(ticker.priceChange);
          newStats.change24hAbs = absChange !== null ? absChange / div : null;
          newStats.volume24h = safeFloat(ticker.quoteVolume);
          const high = safeFloat(ticker.highPrice);
          const low = safeFloat(ticker.lowPrice);
          newStats.high24h = high !== null ? high / div : null;
          newStats.low24h = low !== null ? low / div : null;
        }

        // Parse premium index (funding + oracle)
        if (premium) {
          newStats.fundingRate = safeFloat(premium.lastFundingRate);
          newStats.nextFundingTime = premium.nextFundingTime || null;
          const indexPrice = safeFloat(premium.indexPrice);
          const markPx = safeFloat(premium.markPrice);
          newStats.oraclePrice = indexPrice !== null ? indexPrice / div : null;
          newStats.markPrice = markPx !== null ? markPx / div : null;
        }

        // Parse open interest (multiply by raw Binance price for USD value)
        if (oi) {
          const oiAmount = safeFloat(oi.openInterest);
          // Use raw futures price (not divided) since OI units match futures contract
          const rawMark = premium ? safeFloat(premium.markPrice) : null;
          const rawLast = ticker ? safeFloat(ticker.lastPrice) : null;
          const priceForOi = rawMark ?? rawLast;
          if (oiAmount !== null && priceForOi !== null) {
            newStats.openInterest = oiAmount * priceForOi;
          }
        }

        if (mountedRef.current) {
          setStats(newStats);
        }
      } catch {
        // Silent — keep previous stats
      }
    };

    // Fetch immediately, then poll every 5 seconds
    fetchStats();
    pollingRef.current = setInterval(fetchStats, 5000);

    return () => {
      mountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [coin]);

  return stats;
}
