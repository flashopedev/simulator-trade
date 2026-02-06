"use client";

import { useEffect, useRef, memo, useState } from "react";

interface TradingViewChartProps {
  coin: string;
}

// Map our coins to TradingView symbols
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
  APT: "BINANCE:APTUSDT",
  MATIC: "BINANCE:MATICUSDT",
  NEAR: "BINANCE:NEARUSDT",
  ATOM: "BINANCE:ATOMUSDT",
  FTM: "BINANCE:FTMUSDT",
  INJ: "BINANCE:INJUSDT",
  TIA: "BINANCE:TIAUSDT",
  SEI: "BINANCE:SEIUSDT",
  WLD: "BINANCE:WLDUSDT",
  STRK: "BINANCE:STRKUSDT",
  JUP: "BYBIT:JUPUSDT",
  ONDO: "BYBIT:ONDOUSDT",
};

function TradingViewChartComponent({ coin }: TradingViewChartProps) {
  const [widgetKey, setWidgetKey] = useState(0);
  const symbol = SYMBOL_MAP[coin] || "BINANCE:BTCUSDT";

  // Force re-render when coin changes
  useEffect(() => {
    setWidgetKey(prev => prev + 1);
  }, [coin]);

  return (
    <div className="w-full h-full bg-bg" style={{ minHeight: "300px" }}>
      <iframe
        key={widgetKey}
        src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_widget&symbol=${encodeURIComponent(symbol)}&interval=15&hide_side_toolbar=false&allow_symbol_change=false&save_image=false&theme=dark&style=1&timezone=Etc%2FUTC&withdateranges=1&hide_top_toolbar=false&hide_legend=false&studies=Volume@tv-basicstudies&locale=en`}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
        allowTransparency
        allowFullScreen
      />
    </div>
  );
}

export const TradingViewChart = memo(TradingViewChartComponent);
