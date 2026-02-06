"use client";

import { useEffect, useRef, memo } from "react";

interface TradingViewChartProps {
  coin: string;
}

// Map our coins to TradingView PERP symbols (FIX 10)
const SYMBOL_MAP: Record<string, string> = {
  HYPE: "BYBIT:HYPEUSDT.P",
  BTC: "BINANCE:BTCUSDT.P",
  ETH: "BINANCE:ETHUSDT.P",
  SOL: "BINANCE:SOLUSDT.P",
};

function TradingViewChartComponent({ coin }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = "";

    // Create widget container
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";

    const widgetInner = document.createElement("div");
    widgetInner.className = "tradingview-widget-container__widget";
    widgetInner.style.height = "100%";
    widgetInner.style.width = "100%";
    widgetContainer.appendChild(widgetInner);

    containerRef.current.appendChild(widgetContainer);

    // Create and append script
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    // FIX 9: Show drawing tools (hide_side_toolbar: false)
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: SYMBOL_MAP[coin] || "BINANCE:BTCUSDT.P",
      interval: "15",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "#0a0f14",
      gridColor: "#1a1f2e",
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: "https://www.tradingview.com",
    });

    widgetContainer.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [coin]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-bg"
      style={{ minHeight: "300px" }}
    />
  );
}

export const TradingViewChart = memo(TradingViewChartComponent);
