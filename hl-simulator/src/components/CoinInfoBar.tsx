"use client";

import { cn, COIN_ICONS, SUPPORTED_COINS, type SupportedCoin } from "@/lib/utils";

interface CoinInfoBarProps {
  selectedCoin: SupportedCoin;
  onSelectCoin: (coin: SupportedCoin) => void;
  stats: {
    price: number | null;
    change24h: number | null;
    high24h: number | null;
    low24h: number | null;
    fundingRate: number | null;
  };
  decimals: number;
}

export function CoinInfoBar({
  selectedCoin,
  onSelectCoin,
  stats,
  decimals,
}: CoinInfoBarProps) {
  return (
    <div className="h-[52px] flex items-center gap-6 px-4 border-b border-brd bg-s1">
      {/* Coin selector dropdown */}
      <div className="flex items-center gap-2 pr-5 border-r border-brd h-full">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-acc to-grn flex items-center justify-center text-[9px] font-bold text-black">
          {COIN_ICONS[selectedCoin]}
        </div>
        <span className="font-bold text-[15px] text-t1">{selectedCoin}/USDC</span>
        <svg className="w-3 h-3 text-t3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Quick coin switch */}
      <div className="flex gap-1">
        {SUPPORTED_COINS.map((c) => (
          <button
            key={c}
            onClick={() => onSelectCoin(c)}
            className={cn(
              "px-2 py-1 text-[11px] font-medium rounded transition-colors",
              selectedCoin === c
                ? "text-acc bg-acc/10"
                : "text-t3 hover:text-t2"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Price */}
      <div className="pl-4 border-l border-brd">
        <div className="text-[20px] font-bold text-t1 font-tabular leading-tight">
          {stats.price?.toFixed(decimals) ?? "\u2014"}
        </div>
      </div>

      {/* 24H Change */}
      <div>
        <div className="text-[10px] text-t3 mb-0.5">24H Change</div>
        <div
          className={cn(
            "text-[13px] font-semibold font-tabular",
            stats.change24h !== null && stats.change24h >= 0 ? "text-grn" : "text-red"
          )}
        >
          {stats.change24h !== null
            ? `${stats.change24h >= 0 ? "+" : ""}${stats.change24h.toFixed(2)}%`
            : "\u2014"}
        </div>
      </div>

      {/* 24H High */}
      <div className="hidden md:block">
        <div className="text-[10px] text-t3 mb-0.5">24H High</div>
        <div className="text-[13px] font-medium font-tabular text-t2">
          {stats.high24h?.toFixed(decimals) ?? "\u2014"}
        </div>
      </div>

      {/* 24H Low */}
      <div className="hidden md:block">
        <div className="text-[10px] text-t3 mb-0.5">24H Low</div>
        <div className="text-[13px] font-medium font-tabular text-t2">
          {stats.low24h?.toFixed(decimals) ?? "\u2014"}
        </div>
      </div>

      {/* Funding Rate */}
      <div className="hidden lg:block">
        <div className="text-[10px] text-t3 mb-0.5">Funding</div>
        <div className="text-[13px] font-medium font-tabular text-t2">
          {stats.fundingRate !== null ? `${(stats.fundingRate * 100).toFixed(4)}%` : "\u2014"}
        </div>
      </div>
    </div>
  );
}
