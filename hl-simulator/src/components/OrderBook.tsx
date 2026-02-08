"use client";

import { useRef, useEffect } from "react";

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

  // Calculate spread
  const lowestAsk = asks.length > 0 ? asks[asks.length - 1]?.price : null;
  const highestBid = bids.length > 0 ? bids[0]?.price : null;
  const spread = lowestAsk && highestBid ? lowestAsk - highestBid : null;
  const spreadPct = spread && midPrice ? (spread / midPrice) * 100 : null;

  // Format price with comma like real HL
  const formatPrice = (price: number) => price.toFixed(decimals).replace(".", ",");

  // Format size with space separator like real HL
  const formatSize = (size: number) => {
    const rounded = Math.round(size);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Headers like real HL */}
      <div className="grid grid-cols-3 px-2.5 py-1.5 text-[12px] text-t2 border-b border-brd">
        <span>Price</span>
        <span className="text-right">Size (USDC)</span>
        <span className="text-right">Total (USDC)</span>
      </div>

      {/* Asks */}
      <div className="flex flex-col justify-end overflow-hidden flex-1">
        {asks.map((level, i) => (
          <div
            key={`ask-${i}-${level.price}`}
            className="grid grid-cols-3 px-2.5 py-[2px] text-[12px] font-normal relative ob-row leading-[23px]"
          >
            <span className="text-red font-tabular">
              {formatPrice(level.price)}
            </span>
            <span className="text-right text-t2 font-tabular">
              {formatSize(level.size)}
            </span>
            <span className="text-right text-t3 font-tabular">
              {formatSize(level.total)}
            </span>
            <div
              className="absolute right-0 top-0 bottom-0 bg-red/[0.06]"
              style={{ width: `${(level.total / maxTotal) * 100}%` }}
            />
          </div>
        ))}
      </div>

      {/* Spread row */}
      <SpreadRow midPrice={midPrice} decimals={decimals} spread={spread} spreadPct={spreadPct} />

      {/* Bids */}
      <div className="flex flex-col overflow-hidden flex-1">
        {bids.map((level, i) => (
          <div
            key={`bid-${i}-${level.price}`}
            className="grid grid-cols-3 px-2.5 py-[2px] text-[12px] font-normal relative ob-row leading-[23px]"
          >
            <span className="text-grn font-tabular">
              {formatPrice(level.price)}
            </span>
            <span className="text-right text-t2 font-tabular">
              {formatSize(level.size)}
            </span>
            <span className="text-right text-t3 font-tabular">
              {formatSize(level.total)}
            </span>
            <div
              className="absolute right-0 top-0 bottom-0 bg-grn/[0.06]"
              style={{ width: `${(level.total / maxTotal) * 100}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SpreadRow({
  midPrice,
  decimals,
  spread,
  spreadPct,
}: {
  midPrice: number | null;
  decimals: number;
  spread: number | null;
  spreadPct: number | null;
}) {
  const prevPriceRef = useRef<number | null>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (midPrice === null || prevPriceRef.current === null) {
      prevPriceRef.current = midPrice;
      return;
    }
    if (midPrice !== prevPriceRef.current && flashRef.current) {
      const direction = midPrice > prevPriceRef.current ? "green" : "red";
      flashRef.current.classList.remove("mid-flash-green", "mid-flash-red");
      void flashRef.current.offsetWidth;
      flashRef.current.classList.add(`mid-flash-${direction}`);
    }
    prevPriceRef.current = midPrice;
  }, [midPrice]);

  // Format price with comma like real HL
  const formatPriceLocal = (price: number) => price.toFixed(decimals).replace(".", ",");

  return (
    <div
      ref={flashRef}
      className="flex items-center justify-between px-2.5 py-1.5 border-y border-brd bg-s2"
    >
      <span className="text-[12px] font-normal font-tabular text-t1">
        {midPrice ? formatPriceLocal(midPrice) : "\u2014"}
      </span>
      {spread !== null && (
        <span className="text-[12px] text-t2 font-tabular">
          Spread {spread.toFixed(decimals).replace(".", ",")} ({spreadPct?.toFixed(3).replace(".", ",")}%)
        </span>
      )}
    </div>
  );
}
