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
    <div className="border-b border-brd max-h-[110px] overflow-hidden flex-shrink-0">
      <div className="px-2 py-1 text-[10px] font-semibold text-t3">
        Recent Trades
      </div>

      <div className="grid grid-cols-3 px-2 pb-1 text-[8px] text-t4 font-medium">
        <span>Price</span>
        <span className="text-center">Size</span>
        <span className="text-right">Time</span>
      </div>

      <div className="overflow-hidden">
        {trades.map((trade, i) => (
          <div
            key={i}
            className="grid grid-cols-3 px-2 py-[2px] text-[10px] font-tabular"
          >
            <span className={trade.isBuy ? "text-grn" : "text-red"}>
              {trade.price.toFixed(decimals)}
            </span>
            <span className="text-center text-t2">{trade.size.toFixed(2)}</span>
            <span className="text-right text-t4">{trade.time}</span>
          </div>
        ))}
        {trades.length === 0 && (
          <div className="text-center py-4 text-t4 text-[11px]">
            Waiting for trades...
          </div>
        )}
      </div>
    </div>
  );
}
