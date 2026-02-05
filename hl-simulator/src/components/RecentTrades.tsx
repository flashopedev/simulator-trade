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
  return (
    <div className="flex flex-col h-full">
      {/* Headers */}
      <div className="grid grid-cols-3 px-2.5 py-1.5 text-[9px] text-t3 font-medium uppercase tracking-wide border-b border-brd">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>

      <div className="overflow-y-auto flex-1">
        {trades.map((trade, i) => (
          <div
            key={`${trade.time}-${trade.price}-${i}`}
            className={`grid grid-cols-3 px-2.5 py-[2px] text-[11px] font-tabular ${
              i === 0 ? "trade-flash" : ""
            }`}
          >
            <span className={trade.isBuy ? "text-grn" : "text-red"}>
              {trade.price.toFixed(decimals)}
            </span>
            <span className="text-right text-t2">{trade.size.toFixed(2)}</span>
            <span className="text-right text-t3">{trade.time}</span>
          </div>
        ))}
        {trades.length === 0 && (
          <div className="text-center py-8 text-t3 text-[11px]">
            Waiting for trades...
          </div>
        )}
      </div>
    </div>
  );
}
