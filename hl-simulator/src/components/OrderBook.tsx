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
  // Convert sizes from coin units to USDC (size × price) like real HL
  const asksUsdc = asks.map((level) => ({
    price: level.price,
    sizeUsdc: Math.round(level.size * level.price),
  }));
  let askCumUsdc = 0;
  const asksWithTotals = asksUsdc.map((a) => {
    askCumUsdc += a.sizeUsdc;
    return { ...a, totalUsdc: askCumUsdc };
  });

  const bidsUsdc = bids.map((level) => ({
    price: level.price,
    sizeUsdc: Math.round(level.size * level.price),
  }));
  let bidCumUsdc = 0;
  const bidsWithTotals = bidsUsdc.map((b) => {
    bidCumUsdc += b.sizeUsdc;
    return { ...b, totalUsdc: bidCumUsdc };
  });

  const maxTotalUsdc = Math.max(
    ...asksWithTotals.map((a) => a.totalUsdc),
    ...bidsWithTotals.map((b) => b.totalUsdc),
    1
  );

  // Calculate spread
  const lowestAsk = asks.length > 0 ? asks[asks.length - 1]?.price : null;
  const highestBid = bids.length > 0 ? bids[0]?.price : null;
  const spread = lowestAsk && highestBid ? lowestAsk - highestBid : null;
  const spreadPct = spread && midPrice ? (spread / midPrice) * 100 : null;

  // Format price with comma decimal and space thousand separator like real HL
  const formatPrice = (price: number) => {
    const fixed = price.toFixed(decimals).replace(".", ",");
    // Add space thousand separator to the integer part
    const parts = fixed.split(",");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return parts.join(",");
  };

  // Format USDC size with space separator like real HL
  const formatSize = (size: number) => {
    const rounded = Math.round(size);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  /* Real HL grid: 20% price | 40% size | 40% total */
  const gridCols = "20% 40% 40%";

  return (
    <div className="flex flex-col h-full">
      {/* Header row — Price / Size (USDC) / Total (USDC) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: gridCols,
          padding: "0 0 0 10px",
          height: "23px",
          lineHeight: "23px",
          fontSize: "12px",
          fontWeight: 400,
          color: "rgb(148, 158, 156)",
        }}
      >
        <span>Price</span>
        <span style={{ textAlign: "right" }}>Size (USDC)</span>
        <span style={{ textAlign: "right", paddingRight: "10px" }}>Total (USDC)</span>
      </div>

      {/* Asks (sells) — red, from top to bottom */}
      <div className="flex flex-col justify-end overflow-hidden flex-1">
        {asksWithTotals.map((level, i) => (
          <div
            key={`ask-${i}-${level.price}`}
            className="relative cursor-pointer"
            style={{
              display: "grid",
              gridTemplateColumns: gridCols,
              height: "23px",
              lineHeight: "23px",
              padding: "0 0 0 10px",
              fontSize: "12px",
              fontWeight: 400,
            }}
          >
            <span className="font-tabular" style={{ color: "rgb(237, 112, 136)" }}>
              {formatPrice(level.price)}
            </span>
            <span className="font-tabular" style={{ textAlign: "right", color: "rgb(210, 218, 215)" }}>
              {formatSize(level.sizeUsdc)}
            </span>
            <span className="font-tabular" style={{ textAlign: "right", paddingRight: "10px", color: "rgb(210, 218, 215)" }}>
              {formatSize(level.totalUsdc)}
            </span>
            {/* Bar overlay — real HL: same color as price, opacity 0.15, full height */}
            <div
              className="absolute top-0 bottom-0 right-0"
              style={{
                width: `${(level.totalUsdc / maxTotalUsdc) * 100}%`,
                backgroundColor: "rgb(237, 112, 136)",
                opacity: 0.15,
                zIndex: 1,
                pointerEvents: "none",
              }}
            />
          </div>
        ))}
      </div>

      {/* Spread row — bg rgb(39,48,53), h=23px, no border, "Spread" + value + pct */}
      <SpreadRow decimals={decimals} spread={spread} spreadPct={spreadPct} midPrice={midPrice} />

      {/* Bids (buys) — green, from top to bottom */}
      <div className="flex flex-col overflow-hidden flex-1">
        {bidsWithTotals.map((level, i) => (
          <div
            key={`bid-${i}-${level.price}`}
            className="relative cursor-pointer"
            style={{
              display: "grid",
              gridTemplateColumns: gridCols,
              height: "23px",
              lineHeight: "23px",
              padding: "0 0 0 10px",
              fontSize: "12px",
              fontWeight: 400,
            }}
          >
            <span className="font-tabular" style={{ color: "rgb(31, 166, 125)" }}>
              {formatPrice(level.price)}
            </span>
            <span className="font-tabular" style={{ textAlign: "right", color: "rgb(210, 218, 215)" }}>
              {formatSize(level.sizeUsdc)}
            </span>
            <span className="font-tabular" style={{ textAlign: "right", paddingRight: "10px", color: "rgb(210, 218, 215)" }}>
              {formatSize(level.totalUsdc)}
            </span>
            {/* Bar overlay — green, opacity 0.15 */}
            <div
              className="absolute top-0 bottom-0 right-0"
              style={{
                width: `${(level.totalUsdc / maxTotalUsdc) * 100}%`,
                backgroundColor: "rgb(31, 166, 125)",
                opacity: 0.15,
                zIndex: 1,
                pointerEvents: "none",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SpreadRow({
  decimals,
  spread,
  spreadPct,
  midPrice,
}: {
  decimals: number;
  spread: number | null;
  spreadPct: number | null;
  midPrice: number | null;
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

  return (
    <div
      ref={flashRef}
      style={{
        height: "23px",
        lineHeight: "23px",
        fontSize: "12px",
        fontWeight: 400,
        backgroundColor: "rgb(39, 48, 53)",
      }}
    >
      {/* Inner flex — centered with 32px gap, exactly like real HL */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "32px",
          height: "100%",
        }}
      >
        {spread !== null ? (
          <>
            <span className="font-tabular" style={{ color: "rgb(246, 254, 253)" }}>
              Spread
            </span>
            <span className="font-tabular" style={{ color: "rgb(246, 254, 253)" }}>
              {spread.toFixed(decimals).replace(".", ",")}
            </span>
            <span className="font-tabular" style={{ color: "rgb(246, 254, 253)" }}>
              {spreadPct?.toFixed(3).replace(".", ",")}%
            </span>
          </>
        ) : (
          <span style={{ color: "rgb(246, 254, 253)" }}>{"\u2014"}</span>
        )}
      </div>
    </div>
  );
}
