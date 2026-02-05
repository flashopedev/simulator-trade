"use client";

import { cn, COIN_ICONS, SUPPORTED_COINS, type SupportedCoin } from "@/lib/utils";

interface CoinSelectorProps {
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

export function CoinSelector({
  selectedCoin,
  onSelectCoin,
  stats,
  decimals,
}: CoinSelectorProps) {
  return (
    <div className="flex items-center flex-wrap gap-2 md:gap-3 px-2.5 py-1.5 border-b border-brd">
      {/* Coin info */}
      <div className="flex items-center gap-1.5">
        <div className="w-[17px] h-[17px] rounded-full bg-gradient-to-br from-acc to-grn flex items-center justify-center text-[8px] font-bold text-black">
          {COIN_ICONS[selectedCoin]}
        </div>
        <span className="font-bold text-[13px]">{selectedCoin}-USD</span>
        <span className="text-[8px] px-1 py-0.5 bg-s3 text-t4 rounded font-semibold">
          PERP
        </span>
      </div>

      {/* Coin selector */}
      <div className="flex gap-0.5 md:ml-1.5 md:pl-2 md:border-l md:border-brd">
        {SUPPORTED_COINS.map((coin) => (
          <button
            key={coin}
            onClick={() => onSelectCoin(coin)}
            className={cn(
              "px-1.5 py-0.5 text-[10px] font-semibold rounded border transition-colors",
              selectedCoin === coin
                ? "text-acc border-acc/25 bg-acc/10"
                : "text-t4 border-transparent hover:text-t2 hover:border-brd"
            )}
          >
            {coin}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex gap-3 md:gap-4 items-center w-full md:w-auto md:ml-auto pt-1 md:pt-0 border-t md:border-0 border-brd">
        <Stat label="Mark" value={stats.price?.toFixed(decimals) ?? "—"} />
        <Stat
          label="24h Chg"
          value={
            stats.change24h !== null
              ? `${stats.change24h >= 0 ? "+" : ""}${stats.change24h.toFixed(2)}%`
              : "—"
          }
          color={stats.change24h && stats.change24h >= 0 ? "text-grn" : "text-red"}
        />
        <Stat label="24h High" value={stats.high24h?.toFixed(decimals) ?? "—"} />
        <Stat label="24h Low" value={stats.low24h?.toFixed(decimals) ?? "—"} />
        <Stat
          label="Funding"
          value={stats.fundingRate !== null ? `${(stats.fundingRate * 100).toFixed(4)}%` : "—"}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center md:items-start">
      <span className="text-[7px] md:text-[8px] text-t4 font-medium uppercase tracking-wider">
        {label}
      </span>
      <span
        className={cn(
          "text-[10px] md:text-[11px] font-semibold font-tabular",
          color
        )}
      >
        {value}
      </span>
    </div>
  );
}
