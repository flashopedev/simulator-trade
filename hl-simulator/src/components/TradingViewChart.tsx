"use client";

import { useEffect, useRef, memo, useCallback } from "react";
import type { Timeframe } from "@/lib/utils";

interface TradingViewChartProps {
  coin: string;
  timeframe?: Timeframe;
}

// Map our coins to TradingView symbols with working exchanges
const SYMBOL_MAP: Record<string, string> = {
  HYPE: "BYBIT:HYPEUSDT.P",
  BTC: "BINANCE:BTCUSDT",
  ETH: "BINANCE:ETHUSDT",
  SOL: "BINANCE:SOLUSDT",
  DOGE: "BINANCE:DOGEUSDT",
  AVAX: "BINANCE:AVAXUSDT",
  LINK: "BINANCE:LINKUSDT",
  ARB: "BINANCE:ARBUSDT",
  OP: "BINANCE:OPUSDT",
  SUI: "BINANCE:SUIUSDT",
  WIF: "MEXC:WIFUSDT",
  PEPE: "BINANCE:PEPEUSDT",
  JUP: "BINANCE:JUPUSDT",
  TIA: "BINANCE:TIAUSDT",
  SEI: "BINANCE:SEIUSDT",
  INJ: "BINANCE:INJUSDT",
  RENDER: "BINANCE:RENDERUSDT",
  FET: "BINANCE:FETUSDT",
  ONDO: "BINANCE:ONDOUSDT",
  STX: "BINANCE:STXUSDT",
  NEAR: "BINANCE:NEARUSDT",
  BONK: "BINANCE:BONKUSDT",
};

// Map our timeframe IDs to TradingView interval values
const INTERVAL_MAP: Record<string, string> = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1h": "60",
  "4h": "240",
  "1d": "D",
};

// Real Hyperliquid chart background color: rgb(15, 26, 31) = #0f1a1f
const HL_BG_COLOR = "rgba(15, 26, 31, 1)";
const HL_GRID_COLOR = "rgba(44, 58, 65, 0.6)";

function TradingViewChartComponent({ coin, timeframe = "15m" }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const symbol = SYMBOL_MAP[coin] || "BINANCE:BTCUSDT";
  const interval = INTERVAL_MAP[timeframe] || "15";

  const createWidget = useCallback(() => {
    if (!containerRef.current) return;

    // Clear any existing widget
    containerRef.current.innerHTML = "";

    // Create the TradingView widget container structure
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    widgetContainer.appendChild(widgetDiv);

    // Create script with widget config
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.type = "text/javascript";

    const config = {
      autosize: true,
      symbol: symbol,
      interval: interval,
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: HL_BG_COLOR,
      gridColor: HL_GRID_COLOR,
      hide_top_toolbar: true,
      hide_side_toolbar: true,
      hide_legend: true,
      hide_volume: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      withdateranges: false,
      support_host: "https://www.tradingview.com",
      studies: ["Volume@tv-basicstudies"],
    };

    script.textContent = JSON.stringify(config);
    widgetContainer.appendChild(script);
    containerRef.current.appendChild(widgetContainer);

    // TradingView embed adds a 1px border (border: 1px solid rgb(61,61,61)) on the
    // iframe's internal <body>. Since it's cross-origin, we can't remove it via CSS.
    // Instead, we shift the iframe by -1px on all sides and enlarge it by +2px,
    // so the border is clipped by the parent's overflow:hidden.
    const observer = new MutationObserver(() => {
      const iframe = containerRef.current?.querySelector("iframe");
      if (iframe) {
        iframe.style.position = "relative";
        iframe.style.top = "-1px";
        iframe.style.left = "-1px";
        iframe.style.width = "calc(100% + 2px)";
        iframe.style.height = "calc(100% + 2px)";
        iframe.style.border = "none";
        observer.disconnect();
      }
    });
    observer.observe(widgetContainer, { childList: true, subtree: true });
  }, [symbol, interval]);

  useEffect(() => {
    createWidget();
  }, [createWidget]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden"
      style={{ backgroundColor: "#0f1a1f" }}
    />
  );
}

export const TradingViewChart = memo(TradingViewChartComponent);
