"use client";

import { useEffect, memo, useState } from "react";
import type { Timeframe } from "@/lib/utils";

interface TradingViewChartProps {
  coin: string;
  timeframe?: Timeframe;
}

// Map our coins to TradingView symbols with working exchanges
const SYMBOL_MAP: Record<string, string> = {
  HYPE: "GATEIO:HYPEUSDT",
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

// Map our timeframe IDs to TradingView interval numbers
const INTERVAL_MAP: Record<string, string> = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1h": "60",
  "4h": "240",
  "1d": "D",
};

function TradingViewChartComponent({ coin, timeframe = "15m" }: TradingViewChartProps) {
  const [widgetKey, setWidgetKey] = useState(0);
  const symbol = SYMBOL_MAP[coin] || "BINANCE:BTCUSDT";
  const interval = INTERVAL_MAP[timeframe] || "15";

  // Force re-render when coin or timeframe changes
  useEffect(() => {
    setWidgetKey(prev => prev + 1);
  }, [coin, timeframe]);

  // Use Bybit perpetual for accurate data
  const bybitSymbol = coin === "HYPE" ? "BYBIT:HYPEUSDT.P" : symbol;

  // Build URL — hidesidetoolbar=1 works to remove built-in side toolbar.
  // The built-in TradingView top toolbar CANNOT be hidden via URL params in widgetembed,
  // so we shift the iframe up by 38px and clip the overflow to hide it.
  const iframeSrc = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${encodeURIComponent(bybitSymbol)}&interval=${interval}&hidesidetoolbar=1&symboledit=0&saveimage=0&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=0&showpopupbutton=0&studies=Volume%40tv-basicstudies&locale=en`;

  return (
    <div className="w-full h-full overflow-hidden" style={{ backgroundColor: "#131722" }}>
      {/* Shift iframe up by 38px to hide TradingView's built-in top toolbar.
          The iframe is made 38px taller to compensate, so the chart fills the visible area. */}
      <iframe
        key={widgetKey}
        id="tradingview_chart"
        src={iframeSrc}
        style={{
          width: "100%",
          height: "calc(100% + 38px)",
          marginTop: "-38px",
          border: "none",
          display: "block",
        }}
        allowFullScreen
      />
    </div>
  );
}

export const TradingViewChart = memo(TradingViewChartComponent);
