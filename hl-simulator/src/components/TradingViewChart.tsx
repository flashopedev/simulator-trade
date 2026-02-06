"use client";

import { useEffect, memo, useState } from "react";

interface TradingViewChartProps {
  coin: string;
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

// Display names for HL style
const DISPLAY_NAMES: Record<string, string> = {
  HYPE: "HYPEUSD",
  BTC: "BTCUSD",
  ETH: "ETHUSD",
  SOL: "SOLUSD",
  DOGE: "DOGEUSD",
};

function TradingViewChartComponent({ coin }: TradingViewChartProps) {
  const [widgetKey, setWidgetKey] = useState(0);
  const symbol = SYMBOL_MAP[coin] || "BINANCE:BTCUSDT";
  const displayName = DISPLAY_NAMES[coin] || `${coin}USD`;

  // Force re-render when coin changes
  useEffect(() => {
    setWidgetKey(prev => prev + 1);
  }, [coin]);

  // TradingView Advanced Chart widget with dark background
  // Using Bybit for HYPE like in original screenshot
  const bybitSymbol = coin === "HYPE" ? "BYBIT:HYPEUSDT.P" : symbol;
  const iframeSrc = `https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${encodeURIComponent(bybitSymbol)}&interval=15&hidesidetoolbar=0&symboledit=0&saveimage=0&toolbarbg=000000&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=0&showpopupbutton=0&studies=Volume%40tv-basicstudies&locale=en&hide_legend=0&allow_symbol_change=0&backgroundColor=rgba(0,0,0,1)&gridColor=rgba(40,40,40,1)`;

  return (
    <div className="w-full h-full relative" style={{ minHeight: "300px", backgroundColor: "#000000" }}>
      {/* Custom header overlay */}
      <div
        className="absolute z-10 flex items-center gap-1 pointer-events-none"
        style={{
          top: "6px",
          left: "8px",
          width: "700px",
          height: "22px",
          backgroundColor: "#000000",
          paddingLeft: "4px",
          paddingTop: "2px",
          paddingBottom: "2px"
        }}
      >
        <span style={{ color: "#2962FF", fontSize: "11px" }}>●</span>
        <span style={{ color: "#d1d4dc", fontSize: "13px", fontWeight: 500 }}>{displayName}</span>
        <span style={{ color: "#787b86", fontSize: "13px" }}>· 15 · Hyperliquid</span>
      </div>
      <iframe
        key={widgetKey}
        id="tradingview_chart"
        src={iframeSrc}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
        allowFullScreen
      />
    </div>
  );
}

export const TradingViewChart = memo(TradingViewChartComponent);
