"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchCandles,
  fetchL2Book,
  fetchAllMids,
  fetchMetaAndAssetCtxs,
  generateFakeOrderBook,
  getWebSocket,
  FALLBACK_PRICES,
  type Candle,
} from "@/lib/hyperliquid";
import { COIN_DECIMALS, SUPPORTED_COINS, isTradifiCoin, type SupportedCoin, type Timeframe } from "@/lib/utils";
import { fetchDeployerMetaAndAssetCtxs } from "@/lib/hyperliquid";

interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

interface Trade {
  price: number;
  size: number;
  isBuy: boolean;
  time: string;
}

type ConnectionMode = "ws" | "polling" | "simulation";

export function useMarketData(coin: SupportedCoin, timeframe: Timeframe) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [price, setPrice] = useState<number | null>(null);
  const [allPrices, setAllPrices] = useState<Record<string, number>>({});
  const [asks, setAsks] = useState<OrderBookLevel[]>([]);
  const [bids, setBids] = useState<OrderBookLevel[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("ws");
  const [status, setStatus] = useState("Connecting...");
  const [stats, setStats] = useState({
    change24h: null as number | null,
    high24h: null as number | null,
    low24h: null as number | null,
    fundingRate: null as number | null,
  });

  const decimals = COIN_DECIMALS[coin] || 2;
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const orderBookPollingRef = useRef<NodeJS.Timeout | null>(null);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef(getWebSocket());
  const connectionModeRef = useRef<ConnectionMode>("ws");

  // Keep ref in sync
  useEffect(() => {
    connectionModeRef.current = connectionMode;
  }, [connectionMode]);

  // Load candles
  const loadCandles = useCallback(async () => {
    setIsLoading(true);
    setStatus("Loading candles...");

    try {
      const data = await fetchCandles(coin, timeframe);
      setCandles(data);

      if (data.length > 0) {
        const lastCandle = data[data.length - 1];
        setPrice(lastCandle.c);

        // Calculate 24h stats
        const firstCandle = data[0];
        let high = 0, low = Infinity;
        data.forEach((c) => {
          if (c.h > high) high = c.h;
          if (c.l < low) low = c.l;
        });

        const change = ((lastCandle.c - firstCandle.o) / firstCandle.o) * 100;
        setStats((prev) => ({
          ...prev,
          change24h: change,
          high24h: high,
          low24h: low,
        }));

        setStatus(`${data.length} candles loaded`);
      }
    } catch (error) {
      console.error("Failed to load candles:", error);
      setStatus("API error — simulating");
    } finally {
      setIsLoading(false);
    }
  }, [coin, timeframe]);

  // Load order book via REST
  const loadOrderBook = useCallback(async () => {
    try {
      const data = await fetchL2Book(coin);
      if (data?.levels) {
        const [rawBids, rawAsks] = data.levels;

        const processedAsks: OrderBookLevel[] = [];
        let askTotal = 0;
        (rawAsks || []).slice(0, 8).reverse().forEach((level) => {
          askTotal += parseFloat(level.sz);
          processedAsks.push({
            price: parseFloat(level.px),
            size: parseFloat(level.sz),
            total: askTotal,
          });
        });
        setAsks(processedAsks);

        const processedBids: OrderBookLevel[] = [];
        let bidTotal = 0;
        (rawBids || []).slice(0, 8).forEach((level) => {
          bidTotal += parseFloat(level.sz);
          processedBids.push({
            price: parseFloat(level.px),
            size: parseFloat(level.sz),
            total: bidTotal,
          });
        });
        setBids(processedBids);
        return true;
      }
    } catch {
      // Use fake data
      const currentPrice = price || FALLBACK_PRICES[coin] || 20;
      const fake = generateFakeOrderBook(currentPrice, decimals);
      setAsks(fake.asks);
      setBids(fake.bids);
    }
    return false;
  }, [coin, price, decimals]);

  // REST polling for all prices (fallback when WS fails)
  const startPolling = useCallback(() => {
    // Clear any existing polling
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (orderBookPollingRef.current) clearInterval(orderBookPollingRef.current);

    console.log("[Polling] Starting REST price polling every 2s");
    setConnectionMode("polling");
    setStatus("Polling (REST)");

    const isTradifi = isTradifiCoin(coin);

    // Price polling — every 2 seconds
    const pollPrices = async () => {
      try {
        // Fetch native perps prices
        const mids = await fetchAllMids();
        const newPrices: Record<string, number> = {};
        if (mids) {
          for (const c of SUPPORTED_COINS) {
            const mid = mids[c];
            if (mid) {
              newPrices[c] = parseFloat(mid);
            }
          }
        }

        // For tradifi coins, also fetch from deployer API
        if (isTradifi) {
          const dex = coin.split(":")[0];
          const data = await fetchDeployerMetaAndAssetCtxs(dex);
          if (data) {
            data.universe.forEach((u, i) => {
              const ctx = data.assetCtxs[i];
              if (ctx) {
                const px = parseFloat(ctx.midPx || ctx.markPx || "0");
                if (px > 0) newPrices[u.name] = px;
              }
            });
          }
        }

        if (Object.keys(newPrices).length > 0) {
          setAllPrices((prev) => ({ ...prev, ...newPrices }));
          if (newPrices[coin]) {
            setPrice(newPrices[coin]);
          }
          setIsConnected(true);
          setStatus("Connected (REST)");
        }
      } catch {
        console.warn("[Polling] Price fetch failed");
      }
    };

    // Run immediately
    pollPrices();
    pollingRef.current = setInterval(pollPrices, 2000);

    // Order book polling — every 3 seconds
    loadOrderBook();
    orderBookPollingRef.current = setInterval(loadOrderBook, 3000);
  }, [coin, loadOrderBook]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (orderBookPollingRef.current) {
      clearInterval(orderBookPollingRef.current);
      orderBookPollingRef.current = null;
    }
  }, []);

  // Simulation fallback (when both WS and REST fail)
  const startSimulation = useCallback(() => {
    if (simTimerRef.current) clearInterval(simTimerRef.current);

    setConnectionMode("simulation");
    setStatus("Simulating (offline)");
    console.log("[Sim] Starting simulation fallback");

    simTimerRef.current = setInterval(() => {
      // Price updates — every tick
      setPrice((prev) => {
        const base = prev || FALLBACK_PRICES[coin] || 20;
        const change = (Math.random() - 0.49) * base * 0.001;
        return base + change;
      });

      // Update allPrices for all coins
      setAllPrices((prev) => {
        const updated = { ...prev };
        for (const c of SUPPORTED_COINS) {
          const base = updated[c] || FALLBACK_PRICES[c] || 20;
          const change = (Math.random() - 0.49) * base * 0.001;
          updated[c] = base + change;
        }
        return updated;
      });

      // Order book — every other tick (50% chance)
      if (Math.random() < 0.5) {
        setPrice((currentPrice) => {
          const p = currentPrice || FALLBACK_PRICES[coin] || 20;
          const fake = generateFakeOrderBook(p, decimals);
          setAsks(fake.asks);
          setBids(fake.bids);
          return currentPrice;
        });
      }

      // Trades — 40% chance
      if (Math.random() < 0.4) {
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

        setPrice((currentPrice) => {
          const p = currentPrice || FALLBACK_PRICES[coin] || 20;
          setTrades((prev) => [
            {
              price: p + (Math.random() - 0.5) * p * 0.001,
              size: Math.random() * 100 + 1,
              isBuy: Math.random() > 0.5,
              time,
            },
            ...prev.slice(0, 13),
          ]);
          return currentPrice;
        });
      }
    }, 1000);
  }, [coin, decimals]);

  const stopSimulation = useCallback(() => {
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
  }, []);

  // WebSocket handlers
  useEffect(() => {
    const ws = wsRef.current;

    const handleConnected = (connected: unknown) => {
      const isConn = connected as boolean;
      setIsConnected(isConn);
      if (isConn) {
        // WS connected — stop polling/simulation
        stopPolling();
        stopSimulation();
        setConnectionMode("ws");
        setStatus("Connected (WebSocket)");
      }
    };

    const handleMaxReconnectFailed = () => {
      console.log("[WS] Max reconnect failed — falling back to REST polling");
      // Try REST polling first
      startPolling();
    };

    const handleAllMids = (data: unknown) => {
      const d = data as { data?: { mids?: Record<string, string> } };
      const mids = d.data?.mids;
      if (!mids) return;

      // Update ALL coin prices from WS
      const newPrices: Record<string, number> = {};
      for (const c of SUPPORTED_COINS) {
        const mid = mids[c];
        if (mid) {
          newPrices[c] = parseFloat(mid);
        }
      }
      setAllPrices((prev) => ({ ...prev, ...newPrices }));

      // Update current coin's price
      if (newPrices[coin]) {
        setPrice(newPrices[coin]);
      }
    };

    const handleTrades = (data: unknown) => {
      const d = data as {
        data?: Array<{ coin: string; px: string; sz: string; side: string }> | { coin: string; px: string; sz: string; side: string };
      };
      const tradesData = d.data;
      if (!tradesData) return;

      const tradeArray = Array.isArray(tradesData) ? tradesData : [tradesData];
      tradeArray.forEach((t) => {
        if (t.coin === coin) {
          const now = new Date();
          const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

          setTrades((prev) => [
            {
              price: parseFloat(t.px),
              size: parseFloat(t.sz),
              isBuy: t.side === "B",
              time,
            },
            ...prev.slice(0, 13),
          ]);
        }
      });
    };

    const handleL2Book = (data: unknown) => {
      const d = data as { data?: { levels?: [Array<{ px: string; sz: string }>, Array<{ px: string; sz: string }>] } };
      if (!d.data?.levels) return;
      const [rawBids, rawAsks] = d.data.levels;

      const processedAsks: OrderBookLevel[] = [];
      let askTotal = 0;
      (rawAsks || []).slice(0, 8).reverse().forEach((level) => {
        askTotal += parseFloat(level.sz);
        processedAsks.push({
          price: parseFloat(level.px),
          size: parseFloat(level.sz),
          total: askTotal,
        });
      });
      setAsks(processedAsks);

      const processedBids: OrderBookLevel[] = [];
      let bidTotal = 0;
      (rawBids || []).slice(0, 8).forEach((level) => {
        bidTotal += parseFloat(level.sz);
        processedBids.push({
          price: parseFloat(level.px),
          size: parseFloat(level.sz),
          total: bidTotal,
        });
      });
      setBids(processedBids);
    };

    const handleCandle = (data: unknown) => {
      const d = data as {
        data?: { t: number; o: string; h: string; l: string; c: string; v: string };
      };
      if (!d.data) return;
      const c: Candle = {
        t: d.data.t,
        o: parseFloat(d.data.o),
        h: parseFloat(d.data.h),
        l: parseFloat(d.data.l),
        c: parseFloat(d.data.c),
        v: parseFloat(d.data.v),
      };

      setCandles((prev) => {
        if (prev.length === 0) return [c];
        const last = prev[prev.length - 1];
        if (last.t === c.t) {
          return [...prev.slice(0, -1), c];
        }
        const newCandles = [...prev, c];
        if (newCandles.length > 300) newCandles.shift();
        return newCandles;
      });
    };

    ws.on("connected", handleConnected as (data: unknown) => void);
    ws.on("maxReconnectFailed", handleMaxReconnectFailed as (data: unknown) => void);
    ws.on("allMids", handleAllMids as (data: unknown) => void);
    ws.on("trades", handleTrades as (data: unknown) => void);
    ws.on("l2Book", handleL2Book as (data: unknown) => void);
    ws.on("candle", handleCandle as (data: unknown) => void);

    // Connect and subscribe
    ws.connect();
    ws.subscribe({ type: "allMids" });
    ws.subscribe({ type: "trades", coin });
    ws.subscribe({ type: "l2Book", coin });
    ws.subscribe({ type: "candle", coin, interval: timeframe });

    // For tradifi coins, WS allMids doesn't include deployer prices
    // So we poll the deployer API separately every 3s for the current tradifi coin
    let tradifiPollingTimer: NodeJS.Timeout | null = null;
    if (isTradifiCoin(coin)) {
      const pollTradifiPrice = async () => {
        try {
          const dex = coin.split(":")[0];
          const data = await fetchDeployerMetaAndAssetCtxs(dex);
          if (data) {
            const idx = data.universe.findIndex((u) => u.name === coin);
            if (idx >= 0 && data.assetCtxs[idx]) {
              const px = parseFloat(data.assetCtxs[idx].midPx || data.assetCtxs[idx].markPx || "0");
              if (px > 0) {
                setPrice(px);
                setAllPrices((prev) => ({ ...prev, [coin]: px }));
              }
            }
          }
        } catch { /* silent */ }
      };
      pollTradifiPrice();
      tradifiPollingTimer = setInterval(pollTradifiPrice, 3000);
    }

    // Safety net: if not connected after 8 seconds, fall back to polling
    const safetyTimer = setTimeout(() => {
      if (!ws.connected) {
        console.log("[Safety] WS not connected after 8s, starting polling");
        startPolling();
      }
    }, 8000);

    return () => {
      clearTimeout(safetyTimer);
      if (tradifiPollingTimer) clearInterval(tradifiPollingTimer);

      ws.off("connected", handleConnected as (data: unknown) => void);
      ws.off("maxReconnectFailed", handleMaxReconnectFailed as (data: unknown) => void);
      ws.off("allMids", handleAllMids as (data: unknown) => void);
      ws.off("trades", handleTrades as (data: unknown) => void);
      ws.off("l2Book", handleL2Book as (data: unknown) => void);
      ws.off("candle", handleCandle as (data: unknown) => void);

      ws.unsubscribe({ type: "trades", coin });
      ws.unsubscribe({ type: "l2Book", coin });
      ws.unsubscribe({ type: "candle", coin, interval: timeframe });

      stopPolling();
      stopSimulation();
    };
  }, [coin, timeframe, startPolling, stopPolling, stopSimulation]);

  // Fetch real funding rates from HL API (native or deployer)
  const loadMarketContext = useCallback(async () => {
    try {
      if (isTradifiCoin(coin)) {
        // For tradifi coins, fetch from deployer API
        const dex = coin.split(":")[0]; // "xyz"
        const data = await fetchDeployerMetaAndAssetCtxs(dex);
        if (data) {
          const coinIndex = data.universe.findIndex((u) => u.name === coin);
          if (coinIndex >= 0 && data.assetCtxs[coinIndex]) {
            const ctx = data.assetCtxs[coinIndex];
            setStats((prev) => ({
              ...prev,
              fundingRate: parseFloat(ctx.funding),
            }));
          }
        }
      } else {
        const data = await fetchMetaAndAssetCtxs();
        if (data) {
          const coinIndex = data.universe.findIndex((u) => u.name === coin);
          if (coinIndex >= 0 && data.assetCtxs[coinIndex]) {
            const ctx = data.assetCtxs[coinIndex];
            setStats((prev) => ({
              ...prev,
              fundingRate: parseFloat(ctx.funding),
            }));
          }
        }
      }
    } catch {
      // Keep existing stats on error
    }
  }, [coin]);

  // Initial data load
  useEffect(() => {
    loadCandles();
    loadOrderBook();
    loadMarketContext();
    setTrades([]);
  }, [loadCandles, loadOrderBook, loadMarketContext]);

  // Update candle with current price (keeps chart live)
  useEffect(() => {
    if (!price || candles.length === 0) return;

    setCandles((prev) => {
      const last = prev[prev.length - 1];
      const updated = { ...last, c: price };
      if (price > last.h) updated.h = price;
      if (price < last.l) updated.l = price;
      return [...prev.slice(0, -1), updated];
    });
  }, [price]);

  return {
    candles,
    price,
    allPrices,
    asks,
    bids,
    trades,
    isConnected,
    isLoading,
    connectionMode,
    status,
    stats: { ...stats, price },
    refresh: loadCandles,
  };
}
