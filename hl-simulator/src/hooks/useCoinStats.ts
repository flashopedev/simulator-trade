"use client";

import { useEffect, useRef, useState } from "react";
import { isTradfiCoin } from "@/lib/utils";
import { fetchMetaAndAssetCtxs, fetchDeployerMetaAndAssetCtxs } from "@/lib/hyperliquid";

/**
 * Fetches per-coin market stats from Hyperliquid API.
 *
 * All coins (crypto + tradfi) use the HL metaAndAssetCtxs endpoint.
 * This ensures Mark and Oracle prices come from the same source and
 * update simultaneously — matching real HL behavior exactly.
 *
 * Crypto: { type: "metaAndAssetCtxs" }
 * Tradfi: { type: "metaAndAssetCtxs", dex: "xyz" }
 *
 * Polls every 3 seconds.
 */

export interface CoinStats {
  change24h: number | null;      // percentage, e.g. 2.15
  change24hAbs: number | null;   // absolute, e.g. 1495.30
  volume24h: number | null;      // USD volume
  high24h: number | null;
  low24h: number | null;
  openInterest: number | null;   // USD value
  fundingRate: number | null;    // decimal, e.g. 0.0001 = 0.01%
  nextFundingTime: number | null;
  oraclePrice: number | null;    // oracle/index price from HL
  markPrice: number | null;      // mark price from HL
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

export function useCoinStats(coin: string) {
  const [stats, setStats] = useState<CoinStats>(EMPTY_STATS);
  const mountedRef = useRef(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    // Reset stats on coin change so stale data doesn't flash
    setStats(EMPTY_STATS);

    const isTradfi = isTradfiCoin(coin);

    const fetchStats = async () => {
      try {
        // Fetch from HL API — same source for both crypto and tradfi
        const data = isTradfi
          ? await fetchDeployerMetaAndAssetCtxs("xyz")
          : await fetchMetaAndAssetCtxs();

        if (!data || !mountedRef.current) return;

        const idx = data.universe.findIndex((u) => u.name === coin);
        if (idx < 0) return;

        const ctx = data.assetCtxs[idx];
        const newStats: CoinStats = { ...EMPTY_STATS };

        const markPx = safeFloat(ctx.markPx);
        const oraclePx = safeFloat(ctx.oraclePx);
        const prevDayPx = safeFloat(ctx.prevDayPx);
        const volume = safeFloat(ctx.dayNtlVlm);
        const oi = safeFloat(ctx.openInterest);

        newStats.markPrice = markPx;
        newStats.oraclePrice = oraclePx;
        newStats.fundingRate = safeFloat(ctx.funding);
        newStats.volume24h = volume;

        // Open interest in USD = OI (contracts) * markPx
        if (oi !== null && markPx !== null) {
          newStats.openInterest = oi * markPx;
        }

        // 24h change from prevDayPx
        if (prevDayPx !== null && markPx !== null && prevDayPx > 0) {
          newStats.change24h = ((markPx - prevDayPx) / prevDayPx) * 100;
          newStats.change24hAbs = markPx - prevDayPx;
        }

        // Next funding time: estimate next 8h mark
        const d = new Date();
        const currentHour = d.getUTCHours();
        const nextFundingHour = Math.ceil((currentHour + 1) / 8) * 8;
        d.setUTCHours(nextFundingHour, 0, 0, 0);
        if (d.getTime() <= Date.now()) d.setTime(d.getTime() + 8 * 3600000);
        newStats.nextFundingTime = d.getTime();

        setStats(newStats);
      } catch {
        // Silent — keep previous stats
      }
    };

    // Fetch immediately, then poll every 3 seconds
    fetchStats();
    pollingRef.current = setInterval(fetchStats, 3000);

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
