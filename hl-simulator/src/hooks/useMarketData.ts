"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchCandles,
  fetchL2Book,
  generateFakeOrderBook,
  getWebSocket,
  FALLBACK_PRICES,
  type Candle,
} from "@/lib/hyperliquid";
import { COIN_DECIMALS, type SupportedCoin, type Timeframe } from "@/lib/utils";

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

export function useMarketData(coin: SupportedCoin, timeframe: Timeframe) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [price, setPrice] = useState<number | null>(null);
  const [asks, setAsks] = useState<OrderBookLevel[]>([]);
  const [bids, setBids] = useState<OrderBookLevel[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("Connecting...");
  const [stats, setStats] = useState({
    change24h: null as number | null,
    high24h: null as number | null,
    low24h: null as number | null,
    fundingRate: null as number | null,
  });

  const decimals = COIN_DECIMALS[coin] || 2;
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef(getWebSocket());

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
        setStats({
          change24h: change,
          high24h: high,
          low24h: low,
          fundingRate: 0.0001, // Simulated
        });

        setStatus(`${data.length} candles loaded`);
      }
    } catch (error) {
      console.error("Failed to load candles:", error);
      setStatus("API error — simulating");
    } finally {
      setIsLoading(false);
    }
  }, [coin, timeframe]);

  // Load order book
  const loadOrderBook = useCallback(async () => {
    try {
      const data = await fetchL2Book(coin);
      if (data?.levels) {
        const [rawBids, rawAsks] = data.levels;

        // Process asks
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

        // Process bids
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
      }
    } catch {
      // Use fake data
      if (price) {
        const fake = generateFakeOrderBook(price, decimals);
        setAsks(fake.asks);
        setBids(fake.bids);
      }
    }
  }, [coin, price, decimals]);

  // WebSocket handlers
  useEffect(() => {
    const ws = wsRef.current;

    const handleConnected = (connected: boolean) => {
      setIsConnected(connected as boolean);
    };

    const handleAllMids = (data: { data?: { mids?: Record<string, string> } }) => {
      const mid = data.data?.mids?.[coin];
      if (mid) {
        setPrice(parseFloat(mid));
      }
    };

    const handleTrades = (data: {
      data?: Array<{ coin: string; px: string; sz: string; side: string }> | { coin: string; px: string; sz: string; side: string };
    }) => {
      const tradesData = data.data;
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

    const handleL2Book = (data: { data?: { levels?: [Array<{ px: string; sz: string }>, Array<{ px: string; sz: string }>] } }) => {
      if (!data.data?.levels) return;
      const [rawBids, rawAsks] = data.data.levels;

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

    const handleCandle = (data: {
      data?: { t: number; o: string; h: string; l: string; c: string; v: string };
    }) => {
      if (!data.data) return;
      const c: Candle = {
        t: data.data.t,
        o: parseFloat(data.data.o),
        h: parseFloat(data.data.h),
        l: parseFloat(data.data.l),
        c: parseFloat(data.data.c),
        v: parseFloat(data.data.v),
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
    ws.on("allMids", handleAllMids);
    ws.on("trades", handleTrades);
    ws.on("l2Book", handleL2Book);
    ws.on("candle", handleCandle);

    // Connect and subscribe
    ws.connect();
    ws.subscribe({ type: "allMids" });
    ws.subscribe({ type: "trades", coin });
    ws.subscribe({ type: "l2Book", coin });
    ws.subscribe({ type: "candle", coin, interval: timeframe });

    return () => {
      ws.off("connected", handleConnected as (data: unknown) => void);
      ws.off("allMids", handleAllMids);
      ws.off("trades", handleTrades);
      ws.off("l2Book", handleL2Book);
      ws.off("candle", handleCandle);

      ws.unsubscribe({ type: "trades", coin });
      ws.unsubscribe({ type: "l2Book", coin });
      ws.unsubscribe({ type: "candle", coin, interval: timeframe });
    };
  }, [coin, timeframe]);

  // Initial data load
  useEffect(() => {
    loadCandles();
    loadOrderBook();
    setTrades([]);
  }, [loadCandles, loadOrderBook]);

  // Simulated updates fallback
  useEffect(() => {
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
    }

    simTimerRef.current = setInterval(() => {
      if (isConnected) return;

      // Simulate price movement
      setPrice((prev) => {
        const base = prev || FALLBACK_PRICES[coin] || 20;
        const change = (Math.random() - 0.49) * base * 0.001;
        return base + change;
      });

      // Simulate order book
      if (Math.random() < 0.3) {
        const currentPrice = price || FALLBACK_PRICES[coin] || 20;
        const fake = generateFakeOrderBook(currentPrice, decimals);
        setAsks(fake.asks);
        setBids(fake.bids);
      }

      // Simulate trades
      if (Math.random() < 0.2) {
        const currentPrice = price || FALLBACK_PRICES[coin] || 20;
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

        setTrades((prev) => [
          {
            price: currentPrice + (Math.random() - 0.5) * currentPrice * 0.001,
            size: Math.random() * 100 + 1,
            isBuy: Math.random() > 0.5,
            time,
          },
          ...prev.slice(0, 13),
        ]);
      }
    }, 1500);

    return () => {
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
      }
    };
  }, [isConnected, coin, price, decimals]);

  // Update candle with current price
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
    asks,
    bids,
    trades,
    isConnected,
    isLoading,
    status,
    stats: { ...stats, price },
    refresh: loadCandles,
  };
}
