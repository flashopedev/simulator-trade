"use client";

import { useState, useEffect } from "react";
import { cn, COIN_ICONS, SUPPORTED_COINS, type SupportedCoin } from "@/lib/utils";
import { Star, ChevronDown } from "lucide-react";
import { CoinSelectorModal } from "./CoinSelectorModal";

// Leverage per coin
const COIN_LEVERAGE: Record<string, string> = {
  HYPE: "10x",
  BTC: "50x",
  ETH: "50x",
  SOL: "25x",
  DOGE: "20x",
  AVAX: "20x",
  LINK: "20x",
  ARB: "15x",
  OP: "15x",
  SUI: "15x",
  WIF: "10x",
  PEPE: "10x",
  JUP: "10x",
  TIA: "15x",
  SEI: "10x",
  INJ: "15x",
  RENDER: "10x",
  FET: "10x",
  ONDO: "10x",
  STX: "10x",
  NEAR: "15x",
  BONK: "5x",
};

// Coin gradient colors (just first letter, no fancy gradients to match real HL)
const COIN_COLORS: Record<string, string> = {
  HYPE: "from-emerald-400 to-cyan-500",
  BTC: "from-orange-400 to-yellow-500",
  ETH: "from-blue-400 to-indigo-500",
  SOL: "from-purple-400 to-fuchsia-500",
  DOGE: "from-yellow-400 to-amber-500",
  AVAX: "from-red-400 to-rose-500",
  LINK: "from-blue-400 to-cyan-500",
  ARB: "from-blue-400 to-indigo-500",
  OP: "from-red-400 to-pink-500",
  SUI: "from-cyan-400 to-blue-500",
  WIF: "from-amber-400 to-orange-500",
  PEPE: "from-green-400 to-emerald-500",
  JUP: "from-lime-400 to-green-500",
  TIA: "from-purple-400 to-violet-500",
  SEI: "from-red-400 to-rose-500",
  INJ: "from-blue-400 to-indigo-500",
  RENDER: "from-cyan-400 to-teal-500",
  FET: "from-purple-400 to-pink-500",
  ONDO: "from-blue-400 to-cyan-500",
  STX: "from-orange-400 to-amber-500",
  NEAR: "from-green-400 to-teal-500",
  BONK: "from-yellow-400 to-amber-500",
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
  const openInterest = 763716026.42; // Mock: Full value like real HL
  const volume24h = 884126276.33; // Mock: Full value like real HL
  const fundingRate = stats.fundingRate ?? 0.000013; // 0.0013% like real HL

  // 24h change value
  const priceChange = stats.price && stats.change24h
    ? (stats.price * Math.abs(stats.change24h) / 100)
    : null;

  // Format price like real HL: 32,554 (comma for decimal)
  const formatPrice = (price: number | null) => {
    if (price === null) return "—";
    // Format with comma as decimal separator like real HL
    if (price >= 1000) {
      return price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
    // Use comma for decimal separator
    return price.toFixed(decimals).replace(".", ",");
  };

  // Format large numbers with spaces and decimals like real HL: $873 170 464,95
  const formatLargeNumber = (num: number) => {
    // Split into integer and decimal parts
    const [intPart, decPart] = num.toFixed(2).split(".");
    // Add space as thousands separator
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    // Use comma for decimal separator like real HL
    return `${formattedInt},${decPart}`;
  };

  return (
    <>
      {/* Star row - separate line like real HL */}
      <div className="h-6 flex items-center px-4 bg-s1">
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="flex items-center"
        >
          <Star
            className={cn(
              "w-4 h-4 transition-colors",
              isFavorite ? "fill-yellow-400 text-yellow-400" : "text-t4 hover:text-t3"
            )}
          />
        </button>
      </div>

      <div className="relative z-10 flex items-center h-[52px] px-4 gap-4 border-b border-brd bg-s1 overflow-x-auto">
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
          <span className="text-[20px] font-normal text-t1 leading-none">{selectedCoin}-USDC</span>
          <ChevronDown className="w-4 h-4 text-t3 -ml-0.5" />
        </button>

        {/* Leverage badge - matching real HL: 16px, white, dark teal bg, rounded-[5px] */}
        <span className="px-1 bg-[#0e3333] text-white text-[16px] font-normal rounded-[5px] flex-shrink-0 leading-[20px]">
          {COIN_LEVERAGE[selectedCoin]}
        </span>

        {/* Divider */}
        <div className="w-px h-7 bg-brd flex-shrink-0" />

        {/* Mark Price */}
        <div className="flex flex-col flex-shrink-0">
          <span className="text-[12px] text-t2 underline decoration-dashed decoration-t4 cursor-help leading-tight">
            Mark
          </span>
          <span className="text-[12px] text-t1 font-normal font-tabular mt-0.5 leading-tight">
            {formatPrice(markPrice)}
          </span>
        </div>

        {/* Oracle Price */}
        <div className="flex flex-col flex-shrink-0">
          <span className="text-[12px] text-t2 underline decoration-dashed decoration-t4 cursor-help leading-tight">
            Oracle
          </span>
          <span className="text-[12px] text-t1 font-normal font-tabular mt-0.5 leading-tight">
            {formatPrice(oraclePrice)}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-7 bg-brd flex-shrink-0 hidden lg:block" />

        {/* 24H Change */}
        <div className="flex flex-col flex-shrink-0 hidden md:flex">
          <span className="text-[12px] text-t2 underline decoration-dashed decoration-t4 cursor-help leading-tight">
            24H Change
          </span>
          <span className={cn(
            "text-[12px] font-normal font-tabular mt-0.5 leading-tight",
            stats.change24h !== null && stats.change24h >= 0 ? "text-grn" : "text-red"
          )}>
            {priceChange !== null && stats.change24h !== null
              ? `${stats.change24h >= 0 ? "" : "-"}${priceChange.toFixed(decimals).replace(".", ",")} / ${stats.change24h >= 0 ? "" : "-"}${Math.abs(stats.change24h).toFixed(2).replace(".", ",")}%`
              : "—"}
          </span>
        </div>

        {/* 24H Volume */}
        <div className="flex flex-col flex-shrink-0 hidden lg:flex">
          <span className="text-[12px] text-t2 underline decoration-dashed decoration-t4 cursor-help leading-tight">
            24H Volume
          </span>
          <span className="text-[12px] text-t2 font-normal font-tabular mt-0.5 leading-tight">
            ${formatLargeNumber(volume24h)}
          </span>
        </div>

        {/* Open Interest */}
        <div className="flex flex-col flex-shrink-0 hidden lg:flex">
          <span className="text-[12px] text-t2 underline decoration-dashed decoration-t4 cursor-help leading-tight">
            Open Interest
          </span>
          <span className="text-[12px] text-t2 font-normal font-tabular mt-0.5 leading-tight">
            ${formatLargeNumber(openInterest)}
          </span>
        </div>

        {/* Funding / Countdown */}
        <div className="flex flex-col flex-shrink-0 hidden xl:flex">
          <span className="text-[12px] text-t2 underline decoration-dashed decoration-t4 cursor-help leading-tight">
            Funding / Countdown
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn(
              "text-[12px] font-normal font-tabular leading-tight",
              fundingRate >= 0 ? "text-grn" : "text-red"
            )}>
              {(fundingRate * 100).toFixed(4).replace(".", ",")}%
            </span>
            <span className="text-[12px] font-tabular text-t2 leading-tight">
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
