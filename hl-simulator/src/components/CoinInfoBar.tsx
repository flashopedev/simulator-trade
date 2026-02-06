"use client";

import { useState, useEffect } from "react";
import { cn, COIN_ICONS, SUPPORTED_COINS, type SupportedCoin } from "@/lib/utils";
import { Star, ChevronDown } from "lucide-react";
import { CoinSelectorModal } from "./CoinSelectorModal";

// Leverage per coin
const COIN_LEVERAGE: Record<SupportedCoin, string> = {
  HYPE: "10x",
  BTC: "50x",
  ETH: "50x",
  SOL: "25x",
};

// Coin gradient colors
const COIN_COLORS: Record<SupportedCoin, string> = {
  HYPE: "from-emerald-400 to-cyan-500",
  BTC: "from-orange-400 to-yellow-500",
  ETH: "from-blue-400 to-indigo-500",
  SOL: "from-purple-400 to-fuchsia-500",
};

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
  const [isFavorite, setIsFavorite] = useState(true);
  const [showCoinSelector, setShowCoinSelector] = useState(false);
  const [fundingCountdown, setFundingCountdown] = useState("00:00:00");

  // Funding countdown timer (resets every hour)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      const diff = nextHour.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setFundingCountdown(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Prices
  const markPrice = stats.price;
  const oraclePrice = stats.price ? stats.price * 0.9998 : null;
  const openInterest = 776.4; // Mock: $776.4M
  const volume24h = 889.1; // Mock: $889.1M
  const fundingRate = stats.fundingRate ?? 0.0013;

  // 24h change value
  const priceChange = stats.price && stats.change24h
    ? (stats.price * Math.abs(stats.change24h) / 100)
    : null;

  const formatPrice = (price: number | null) => {
    if (price === null) return "—";
    if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (price >= 100) return price.toFixed(1);
    return price.toFixed(decimals);
  };

  return (
    <>
      <div className="flex items-center h-[52px] px-4 gap-4 border-b border-brd bg-s1 overflow-x-auto">
        {/* Favorite star */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="flex items-center flex-shrink-0"
        >
          <Star
            className={cn(
              "w-[14px] h-[14px] transition-colors",
              isFavorite ? "fill-yellow-400 text-yellow-400" : "text-t4 hover:text-t3"
            )}
          />
        </button>

        {/* Coin selector */}
        <button
          onClick={() => setShowCoinSelector(true)}
          className="flex items-center gap-2 flex-shrink-0"
        >
          {/* Coin icon */}
          <div className={cn(
            "w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center text-[10px] font-bold text-white",
            COIN_COLORS[selectedCoin]
          )}>
            {COIN_ICONS[selectedCoin]}
          </div>
          {/* Name + dropdown */}
          <span className="text-[20px] font-semibold text-t1 leading-none">{selectedCoin}-USDC</span>
          <ChevronDown className="w-4 h-4 text-t3 -ml-0.5" />
        </button>

        {/* Leverage badge */}
        <span className="px-1.5 py-0.5 bg-acc/15 text-acc text-[11px] font-bold rounded border border-acc/20 flex-shrink-0">
          {COIN_LEVERAGE[selectedCoin]}
        </span>

        {/* Divider */}
        <div className="w-px h-7 bg-brd flex-shrink-0" />

        {/* Mark Price */}
        <div className="flex flex-col flex-shrink-0">
          <span className="text-[10px] text-t3 border-b border-dotted border-t4 cursor-help leading-tight">
            Mark
          </span>
          <span className="text-[13px] text-t1 font-medium font-tabular mt-0.5 leading-tight">
            {formatPrice(markPrice)}
          </span>
        </div>

        {/* Oracle Price */}
        <div className="flex flex-col flex-shrink-0">
          <span className="text-[10px] text-t3 border-b border-dotted border-t4 cursor-help leading-tight">
            Oracle
          </span>
          <span className="text-[13px] text-t1 font-medium font-tabular mt-0.5 leading-tight">
            {formatPrice(oraclePrice)}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-7 bg-brd flex-shrink-0 hidden lg:block" />

        {/* 24H Change */}
        <div className="flex flex-col flex-shrink-0 hidden md:flex">
          <span className="text-[10px] text-t3 border-b border-dotted border-t4 cursor-help leading-tight">
            24H Change
          </span>
          <span className={cn(
            "text-[13px] font-medium font-tabular mt-0.5 leading-tight",
            stats.change24h !== null && stats.change24h >= 0 ? "text-grn" : "text-red"
          )}>
            {priceChange !== null && stats.change24h !== null
              ? `${stats.change24h >= 0 ? "+" : "-"}${priceChange.toFixed(decimals)} / ${stats.change24h >= 0 ? "+" : ""}${stats.change24h.toFixed(2)}%`
              : "—"}
          </span>
        </div>

        {/* 24H Volume */}
        <div className="flex flex-col flex-shrink-0 hidden lg:flex">
          <span className="text-[10px] text-t3 border-b border-dotted border-t4 cursor-help leading-tight">
            24H Volume
          </span>
          <span className="text-[13px] text-t2 font-medium font-tabular mt-0.5 leading-tight">
            ${volume24h.toFixed(0)}M
          </span>
        </div>

        {/* Open Interest */}
        <div className="flex flex-col flex-shrink-0 hidden lg:flex">
          <span className="text-[10px] text-t3 border-b border-dotted border-t4 cursor-help leading-tight">
            Open Interest
          </span>
          <span className="text-[13px] text-t2 font-medium font-tabular mt-0.5 leading-tight">
            ${openInterest.toFixed(0)}M
          </span>
        </div>

        {/* Funding / Countdown */}
        <div className="flex flex-col flex-shrink-0 hidden xl:flex">
          <span className="text-[10px] text-t3 border-b border-dotted border-t4 cursor-help leading-tight">
            Funding / Countdown
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn(
              "text-[13px] font-medium font-tabular leading-tight",
              fundingRate >= 0 ? "text-grn" : "text-red"
            )}>
              {fundingRate >= 0 ? "" : "-"}{(Math.abs(fundingRate) * 100).toFixed(4)}%
            </span>
            <span className="text-[13px] font-tabular text-t2 leading-tight">
              {fundingCountdown}
            </span>
          </div>
        </div>
      </div>

      {/* Coin Selector Modal */}
      <CoinSelectorModal
        isOpen={showCoinSelector}
        onClose={() => setShowCoinSelector(false)}
        onSelectCoin={onSelectCoin}
        selectedCoin={selectedCoin}
      />
    </>
  );
}
