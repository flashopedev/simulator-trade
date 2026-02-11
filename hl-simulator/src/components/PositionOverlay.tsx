"use client";

import { type SupportedCoin, type Timeframe, calculatePnl, COIN_DECIMALS } from "@/lib/utils";
import { type Position } from "@/lib/supabase/types";
import { useChartPriceRange } from "@/hooks/useChartPriceRange";

/**
 * Position entry price line + PNL overlay on the chart.
 * Renders as HTML absolutely positioned on top of the TradingView iframe.
 * Matches real Hyperliquid visual: dashed entry line, PNL badge, entry price label.
 */

interface PositionOverlayProps {
  position: Position | undefined;
  currentPrice: number | null;
  coin: SupportedCoin;
  timeframe: Timeframe;
}

// TradingView embed widget layout constants
const YAXIS_WIDTH = 65; // px, right-side Y-axis price panel
const XAXIS_HEIGHT = 26; // px, bottom time axis
const VOLUME_RATIO = 0.22; // volume pane takes ~22% of chart height

export function PositionOverlay({
  position,
  currentPrice,
  coin,
  timeframe,
}: PositionOverlayProps) {
  const range = useChartPriceRange(coin, timeframe);

  // Nothing to render if no position, no price, or no range
  if (!position || currentPrice === null || !range) return null;

  const { visibleMin, visibleMax } = range;
  const entryPrice = position.entry_price;
  const isLong = position.side === "Long";

  // Calculate vertical position as percentage from top.
  // Only the price pane area (top ~78%) maps to prices; bottom ~22% is volume.
  const pricePaneRatio = 1 - VOLUME_RATIO;
  const rawPercent = ((visibleMax - entryPrice) / (visibleMax - visibleMin)) * 100;
  // Scale to price pane only (0% = top of chart, pricePaneRatio*100% = bottom of price pane)
  const yPercent = rawPercent * pricePaneRatio;

  // Hide if entry price is outside visible range
  if (yPercent < -5 || yPercent > pricePaneRatio * 100 + 5) return null;

  // Calculate PNL
  const pnl = calculatePnl(entryPrice, currentPrice, position.size, isLong);
  const isProfit = pnl >= 0;

  // Format entry price with correct decimals
  const decimals = COIN_DECIMALS[coin] ?? 2;
  const formattedEntry = entryPrice
    .toFixed(decimals)
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  // Format PNL value
  const pnlSign = pnl >= 0 ? "+" : "";
  const formattedPnl = `${pnlSign}$${Math.abs(pnl).toFixed(2).replace(".", ",")}`;

  // Format position size
  const formattedSize = position.size.toFixed(2).replace(".", ",");

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        bottom: `${XAXIS_HEIGHT}px`,
        zIndex: 20,
      }}
    >
      {/* Entry price line container — positioned at yPercent from top */}
      <div
        className="absolute w-full"
        style={{ top: `${Math.max(0, Math.min(100, yPercent))}%` }}
      >
        {/* Dashed horizontal line — full width minus Y-axis */}
        <div
          className="absolute left-0"
          style={{
            right: `${YAXIS_WIDTH}px`,
            borderTop: "1px dashed #ED7088",
            top: 0,
          }}
        />

        {/* PNL badge + size badge (left side) */}
        <div
          className="absolute left-[60px] flex items-center gap-[2px]"
          style={{ transform: "translateY(-50%)" }}
        >
          {/* PNL badge */}
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              padding: "1px 4px",
              borderRadius: "2px",
              color: "white",
              backgroundColor: isProfit ? "#1FA67D" : "#ED7088",
              whiteSpace: "nowrap",
            }}
          >
            PNL {formattedPnl}
          </span>

          {/* Size badge */}
          <span
            style={{
              fontSize: "10px",
              fontWeight: 400,
              padding: "1px 4px",
              borderRadius: "2px",
              color: "#949E9C",
              backgroundColor: "#2a3740",
              whiteSpace: "nowrap",
            }}
          >
            {formattedSize}
          </span>
        </div>

        {/* Entry price label (right side, on Y-axis area) */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            right: 0,
            width: `${YAXIS_WIDTH}px`,
            transform: "translateY(-50%)",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              padding: "1px 4px",
              borderRadius: "2px",
              color: "white",
              backgroundColor: "#ED7088",
              whiteSpace: "nowrap",
            }}
          >
            {formattedEntry}
          </span>
        </div>
      </div>
    </div>
  );
}
