"use client";

import { cn, coinDisplayName, isTradfiCoin } from "@/lib/utils";

/**
 * Coin icon using real Hyperliquid SVG assets.
 * Crypto coins: https://app.hyperliquid.xyz/coins/{COIN}.svg
 * Tradfi coins: Real HL doesn't show icons for deployer/tradfi coins.
 *   We render a styled letter badge matching the HL deployer aesthetic.
 * In real HL: 20x20 display, parent has border-radius: 50%, overflow: hidden.
 */

interface CoinIconProps {
  coin: string;
  size?: number;   // px, default 20
  className?: string;
}

export function CoinIcon({ coin, size = 20, className }: CoinIconProps) {
  const displayName = coinDisplayName(coin);

  // Tradfi coins: HL CDN returns HTML (not SVG) for deployer coins.
  // Show a styled letter badge matching HL deployer aesthetic.
  if (isTradfiCoin(coin)) {
    const letter = displayName.charAt(0);
    return (
      <div
        className={cn(
          "rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-[#0e3333]",
          className
        )}
        style={{ width: size, height: size }}
      >
        <span
          className="text-[#4be0a8] font-semibold leading-none"
          style={{ fontSize: Math.round(size * 0.55) }}
        >
          {letter}
        </span>
      </div>
    );
  }

  // Crypto coins: use real HL SVG icons
  return (
    <div
      className={cn("rounded-full overflow-hidden flex-shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://app.hyperliquid.xyz/coins/${displayName}.svg`}
        alt={displayName}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        loading="eager"
      />
    </div>
  );
}
