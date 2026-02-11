"use client";

import { cn } from "@/lib/utils";

/**
 * Coin icon using real Hyperliquid SVG assets.
 * URL pattern: https://app.hyperliquid.xyz/coins/{COIN}.svg
 * In real HL: 20x20 display, parent has border-radius: 50%, overflow: hidden.
 */

interface CoinIconProps {
  coin: string;
  size?: number;   // px, default 20
  className?: string;
}

// Background colors for tradifi text icons by category
const TRADIFI_ICON_COLORS: Record<string, string> = {
  TSLA: "#cc0000", NVDA: "#76b900", AAPL: "#555555", MSFT: "#00a4ef",
  GOOGL: "#4285f4", AMZN: "#ff9900", META: "#0668e1", HOOD: "#00c805",
  PLTR: "#101010", COIN: "#0052ff", INTC: "#0071c5", AMD: "#ed1c24",
  MU: "#0a57a4", SNDK: "#e9392a", MSTR: "#c4122f", CRCL: "#3772ff",
  NFLX: "#e50914", ORCL: "#f80000", TSM: "#004b93", BABA: "#ff6a00",
  RIVN: "#2dce89", CRWV: "#7c4dff", USAR: "#1b3a5c", URNM: "#ffc107",
  XYZ100: "#50d2c1", GOLD: "#d4af37", SILVER: "#c0c0c0", CL: "#333333",
  COPPER: "#b87333", NATGAS: "#4fc3f7", PLATINUM: "#e5e4e2",
  JPY: "#bc002d", EUR: "#003399",
};

export function CoinIcon({ coin, size = 20, className }: CoinIconProps) {
  // For tradifi coins (xyz:TSLA etc.), show a colored circle with initials
  if (coin.includes(":")) {
    const shortSym = coin.split(":")[1] || coin;
    const bgColor = TRADIFI_ICON_COLORS[shortSym] || "#50d2c1";
    const fontSize = size <= 16 ? 7 : size <= 20 ? 8 : 10;
    const label = shortSym.length <= 4 ? shortSym.slice(0, 3) : shortSym.slice(0, 2);

    return (
      <div
        className={cn("rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center", className)}
        style={{ width: size, height: size, backgroundColor: bgColor }}
      >
        <span style={{ fontSize, fontWeight: 700, color: "#fff", lineHeight: 1 }}>{label}</span>
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-full overflow-hidden flex-shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://app.hyperliquid.xyz/coins/${coin}.svg`}
        alt={coin}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        loading="eager"
      />
    </div>
  );
}
