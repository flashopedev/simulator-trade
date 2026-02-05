"use client";

import { cn } from "@/lib/utils";

interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

interface OrderBookProps {
  asks: OrderBookLevel[];
  bids: OrderBookLevel[];
  midPrice: number | null;
  decimals: number;
}

export function OrderBook({ asks, bids, midPrice, decimals }: OrderBookProps) {
  const maxTotal = Math.max(
    ...asks.map((a) => a.total),
    ...bids.map((b) => b.total),
    1
  );

  return (
    <div className="flex flex-col overflow-hidden border-b border-brd">
      <div className="px-2 py-1 text-[10px] font-semibold text-t3">
        Order Book
      </div>

      {/* Headers */}
      <div className="grid grid-cols-3 px-2 pb-1 text-[8px] text-t4 font-medium uppercase tracking-wide">
        <span>Price</span>
        <span className="text-center">Size</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks */}
      <div className="flex flex-col justify-end overflow-hidden max-h-[120px] md:max-h-none md:flex-1">
        {asks.map((level, i) => (
          <div
            key={`ask-${i}`}
            className="grid grid-cols-3 px-2 py-[2px] text-[10px] font-medium relative"
          >
            <span className="text-red font-tabular">
              {level.price.toFixed(decimals)}
            </span>
            <span className="text-center text-t2 font-tabular">
              {level.size.toFixed(1)}
            </span>
            <span className="text-right text-t4 font-tabular">
              {level.total.toFixed(0)}
            </span>
            <div
              className="absolute right-0 top-0 bottom-0 bg-red opacity-[0.04]"
              style={{ width: `${(level.total / maxTotal) * 100}%` }}
            />
          </div>
        ))}
      </div>

      {/* Mid price */}
      <div className="flex items-center gap-1.5 px-2 py-1 border-y border-brd bg-s1">
        <span className="text-[13px] font-bold font-tabular">
          {midPrice ? midPrice.toFixed(decimals) : "—"}
        </span>
        <span className="text-[9px] text-t4">
          ≈ ${midPrice ? midPrice.toFixed(decimals) : "—"}
        </span>
      </div>

      {/* Bids */}
      <div className="flex flex-col overflow-hidden max-h-[120px] md:max-h-none md:flex-1">
        {bids.map((level, i) => (
          <div
            key={`bid-${i}`}
            className="grid grid-cols-3 px-2 py-[2px] text-[10px] font-medium relative"
          >
            <span className="text-grn font-tabular">
              {level.price.toFixed(decimals)}
            </span>
            <span className="text-center text-t2 font-tabular">
              {level.size.toFixed(1)}
            </span>
            <span className="text-right text-t4 font-tabular">
              {level.total.toFixed(0)}
            </span>
            <div
              className="absolute right-0 top-0 bottom-0 bg-grn opacity-[0.04]"
              style={{ width: `${(level.total / maxTotal) * 100}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
