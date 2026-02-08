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

export function CoinIcon({ coin, size = 20, className }: CoinIconProps) {
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
