"use client";

import { useEffect, useRef, useState } from "react";
import { isTradifiCoin, type SupportedCoin } from "@/lib/utils";
import { fetchDeployerMetaAndAssetCtxs } from "@/lib/hyperliquid";

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
 * Fetches per-coin market stats.
 * Crypto coins: Binance Futures (fapi).
 * Tradifi coins (xyz:): Hyperliquid deployer API.
 * Polls every 5 seconds.
 */
export function useCoinStats(coin: SupportedCoin) {
  const [stats, setStats] = useState<CoinStats>(EMPTY_STATS);
  const mountedRef = useRef(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    // Choose fetch strategy based on coin type
    const isTradifi = isTradifiCoin(coin);

    const fetchTradifiStats = async () => {
      try {
        const dex = coin.split(":")[0]; // "xyz"
        const data = await fetchDeployerMetaAndAssetCtxs(dex);
        if (!data) return;

        const coinIndex = data.universe.findIndex((u) => u.name === coin);
        if (coinIndex < 0 || !data.assetCtxs[coinIndex]) return;

        const ctx = data.assetCtxs[coinIndex];
        const midPrice = safeFloat(ctx.midPx) ?? safeFloat(ctx.markPx);
        const prevDayPx = safeFloat(ctx.prevDayPx);
        const oraclePx = safeFloat(ctx.oraclePx);
        const markPx = safeFloat(ctx.markPx);
        const funding = safeFloat(ctx.funding);
        const oiRaw = safeFloat(ctx.openInterest);
        const dayVlm = safeFloat(ctx.dayNtlVlm);

        const newStats: CoinStats = { ...EMPTY_STATS };

        // 24h change
        if (midPrice !== null && prevDayPx !== null && prevDayPx > 0) {
          newStats.change24h = ((midPrice - prevDayPx) / prevDayPx) * 100;
          newStats.change24hAbs = midPrice - prevDayPx;
        }

        // Volume (dayNtlVlm is already in USD notional)
        newStats.volume24h = dayVlm;

        // OI (openInterest is in coin units, multiply by price for USD)
        if (oiRaw !== null && midPrice !== null) {
          newStats.openInterest = oiRaw * midPrice;
        }

        // Funding rate
        newStats.fundingRate = funding;

        // Funding countdown: tradifi funding is every 1 hour on HL
        // Estimate next hour mark
        const now = Date.now();
        const d = new Date();
        d.setMinutes(0, 0, 0);
        d.setTime(d.getTime() + 3600000); // next hour
        if (d.getTime() <= now) d.setTime(d.getTime() + 3600000);
        newStats.nextFundingTime = d.getTime();

        // Oracle and mark
        newStats.oraclePrice = oraclePx;
        newStats.markPrice = markPx;

        if (mountedRef.current) {
          setStats(newStats);
        }
      } catch {
        // Silent — keep previous stats
      }
    };

    const fetchBinanceStats = async () => {
      try {
        const is1000x = BINANCE_1000X_COINS[coin] ?? false;
        const symbol = is1000x ? `1000${coin}USDT` : `${coin}USDT`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

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
        const div = is1000x ? 1000 : 1;

        if (ticker) {
          newStats.change24h = safeFloat(ticker.priceChangePercent);
          const absChange = safeFloat(ticker.priceChange);
          newStats.change24hAbs = absChange !== null ? absChange / div : null;
          newStats.volume24h = safeFloat(ticker.quoteVolume);
          const high = safeFloat(ticker.highPrice);
          const low = safeFloat(ticker.lowPrice);
          newStats.high24h = high !== null ? high / div : null;
          newStats.low24h = low !== null ? low / div : null;
        }

        if (premium) {
          newStats.fundingRate = safeFloat(premium.lastFundingRate);
          newStats.nextFundingTime = premium.nextFundingTime || null;
          const indexPrice = safeFloat(premium.indexPrice);
          const markPx = safeFloat(premium.markPrice);
          newStats.oraclePrice = indexPrice !== null ? indexPrice / div : null;
          newStats.markPrice = markPx !== null ? markPx / div : null;
        }

        if (oi) {
          const oiAmount = safeFloat(oi.openInterest);
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

    const fetchStats = isTradifi ? fetchTradifiStats : fetchBinanceStats;

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
