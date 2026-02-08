"use client";

import { useEffect, useRef, useState } from "react";
import { SUPPORTED_COINS } from "@/lib/utils";

// Map our coin names to Binance lowercase symbol
const SYMBOL_TO_COIN: Record<string, string> = {};
for (const coin of SUPPORTED_COINS) {
  SYMBOL_TO_COIN[`${coin.toLowerCase()}usdt`] = coin;
}

const BINANCE_WS = "wss://stream.binance.com:9443/ws";
const BINANCE_REST = "https://api.binance.com/api/v3/ticker/price";
const BYBIT_REST = "https://api.bybit.com/v5/market/tickers?category=spot";

// Coins NOT on Binance — fetched from Bybit instead
const COINS_NOT_ON_BINANCE = new Set(["HYPE"]);
const BINANCE_COINS = SUPPORTED_COINS.filter(c => !COINS_NOT_ON_BINANCE.has(c));
const STREAMS = BINANCE_COINS.map(c => `${c.toLowerCase()}usdt@miniTicker`);

/**
 * Stable price feed from Binance.
 * Strategy: REST fetch first (instant), then WS for live updates.
 * If WS fails, REST polls every 3s.
 */
export function useBinancePrices() {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [connected, setConnected] = useState(false);
  const mountedRef = useRef(true);
  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);
  const attemptRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    // ---- REST FETCH (works immediately) ----
    const fetchRest = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const resp = await fetch(BINANCE_REST, { signal: controller.signal });
        clearTimeout(timeout);
        if (!resp.ok) return;
        const data: Array<{ symbol: string; price: string }> = await resp.json();
        const newPrices: Record<string, number> = {};
        for (const item of data) {
          const coin = SYMBOL_TO_COIN[item.symbol.toLowerCase()];
          if (coin) newPrices[coin] = parseFloat(item.price);
        }
        if (mountedRef.current && Object.keys(newPrices).length > 0) {
          setPrices(prev => ({ ...prev, ...newPrices }));
          setConnected(true); // REST working = connected
        }
      } catch {
        // Silent
      }
    };

    // ---- BYBIT REST (for HYPE and other coins not on Binance) ----
    const fetchBybit = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const bybitPrices: Record<string, number> = {};

        // Fetch each non-Binance coin from Bybit
        for (const coin of Array.from(COINS_NOT_ON_BINANCE)) {
          try {
            const resp = await fetch(`${BYBIT_REST}&symbol=${coin}USDT`, { signal: controller.signal });
            if (resp.ok) {
              const data = await resp.json();
              const price = data?.result?.list?.[0]?.lastPrice;
              if (price) bybitPrices[coin] = parseFloat(price);
            }
          } catch { /* skip */ }
        }

        clearTimeout(timeout);
        if (mountedRef.current && Object.keys(bybitPrices).length > 0) {
          setPrices(prev => ({ ...prev, ...bybitPrices }));
        }
      } catch {
        // Silent
      }
    };

    // Start both REST sources immediately
    const fetchAll = async () => {
      await Promise.all([fetchRest(), fetchBybit()]);
    };
    fetchAll();
    pollingRef.current = setInterval(fetchAll, 3000);

    // ---- WEBSOCKET (for live updates) ----
    const connectWs = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      try {
        // Use combined stream URL
        const streamUrl = `${BINANCE_WS}/${STREAMS.join("/")}`;
        const ws = new WebSocket(streamUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          attemptRef.current = 0;
          if (mountedRef.current) {
            setConnected(true);
            // Stop REST polling — WS will handle updates
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
          }
        };

        ws.onmessage = (event) => {
          try {
            const t = JSON.parse(event.data);
            // miniTicker: { s: "BTCUSDT", c: "97000.00" }
            if (t.s && t.c) {
              const coin = SYMBOL_TO_COIN[t.s.toLowerCase()];
              if (coin && mountedRef.current) {
                const newPrice = parseFloat(t.c);
                setPrices(prev => {
                  if (prev[coin] === newPrice) return prev;
                  return { ...prev, [coin]: newPrice };
                });
              }
            }
          } catch {
            // ignore
          }
        };

        ws.onclose = () => {
          wsRef.current = null;
          if (mountedRef.current) {
            // Restart REST polling (don't set connected=false — REST keeps us online)
            if (!pollingRef.current) {
              pollingRef.current = setInterval(fetchAll, 3000);
            }
            // Schedule reconnect
            if (attemptRef.current < 10) {
              const delay = 2000 * Math.pow(1.5, attemptRef.current);
              attemptRef.current++;
              reconnectRef.current = setTimeout(connectWs, delay);
            } else {
              // Max reconnects reached — REST polling continues
            }
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        // Will retry via onclose handler
      }
    };

    // Try WS after a short delay (let REST populate first)
    const wsTimer = setTimeout(connectWs, 500);

    return () => {
      mountedRef.current = false;
      clearTimeout(wsTimer);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on cleanup
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return { prices, connected };
}
