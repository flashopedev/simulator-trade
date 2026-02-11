"use client";

interface Trade {
  price: number;
  size: number;
  isBuy: boolean;
  time: string;
}

interface RecentTradesProps {
  trades: Trade[];
  decimals: number;
}

export function RecentTrades({ trades, decimals }: RecentTradesProps) {
  const formatPrice = (price: number) => {
    const fixed = price.toFixed(decimals).replace(".", ",");
    const parts = fixed.split(",");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return parts.join(",");
  };

  const formatSize = (size: number) => {
    return Math.round(size).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header — matching OrderBook style */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "33% 34% 33%",
          padding: "0 10px",
          height: "23px",
          lineHeight: "23px",
          fontSize: "12px",
          fontWeight: 400,
          color: "rgb(148, 158, 156)",
        }}
      >
        <span>Price</span>
        <span style={{ textAlign: "right" }}>Size (USDC)</span>
        <span style={{ textAlign: "right" }}>Time</span>
      </div>

      <div className="overflow-y-auto flex-1">
        {trades.map((trade, i) => (
          <div
            key={`${trade.time}-${trade.price}-${i}`}
            className={i === 0 ? "trade-flash" : ""}
            style={{
              display: "grid",
              gridTemplateColumns: "33% 34% 33%",
              padding: "0 10px",
              height: "23px",
              lineHeight: "23px",
              fontSize: "12px",
              fontWeight: 400,
            }}
          >
            <span className="font-tabular" style={{ color: trade.isBuy ? "rgb(31, 166, 125)" : "rgb(237, 112, 136)" }}>
              {formatPrice(trade.price)}
            </span>
            <span className="font-tabular" style={{ textAlign: "right", color: "rgb(210, 218, 215)" }}>
              {formatSize(Math.round(trade.size * trade.price))}
            </span>
            <span className="font-tabular" style={{ textAlign: "right", color: "rgb(148, 158, 156)" }}>
              {trade.time}
            </span>
          </div>
        ))}
        {trades.length === 0 && (
          <div className="text-center py-8 text-[12px]" style={{ color: "rgb(148, 158, 156)" }}>
            Waiting for trades...
          </div>
        )}
      </div>
    </div>
  );
}
