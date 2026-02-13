"use client";

import { cn, coinDisplayName, isTradfiCoin } from "@/lib/utils";

/**
 * Coin icon using real Hyperliquid SVG assets.
 * All coins load from: https://app.hyperliquid.xyz/coins/{COIN}.svg
 * Crypto: {COIN} = "BTC", "ETH", etc.
 * Tradfi: {COIN} = "xyz:TSLA", "xyz:GOLD", etc. (includes xyz: prefix)
 */

interface CoinIconProps {
  coin: string;
  size?: number;   // px, default 20
  className?: string;
}

export function CoinIcon({ coin, size = 20, className }: CoinIconProps) {
  const displayName = coinDisplayName(coin);
  // Tradfi coins use the full "xyz:COIN" in the URL, crypto just use "COIN"
  const svgName = isTradfiCoin(coin) ? coin : displayName;

  return (
    <div
      className={cn("rounded-full overflow-hidden flex-shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://app.hyperliquid.xyz/coins/${svgName}.svg`}
        alt={displayName}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        loading="eager"
      />
    </div>
  );
}
