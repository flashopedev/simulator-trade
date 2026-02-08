"use client";

import { useState, useEffect } from "react";
import { cn, type SupportedCoin } from "@/lib/utils";
import type { CoinStats } from "@/hooks/useCoinStats";
import { Star, ChevronDown } from "lucide-react";
import { CoinSelectorModal } from "./CoinSelectorModal";
import { CoinIcon } from "./CoinIcon";

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

// COIN_COLORS removed — now using real SVG icons from Hyperliquid

interface CoinInfoBarProps {
  selectedCoin: SupportedCoin;
  onSelectCoin: (coin: SupportedCoin) => void;
  price: number | null;
  coinStats: CoinStats;
  decimals: number;
}

export function CoinInfoBar({
  selectedCoin,
  onSelectCoin,
  price,
  coinStats,
  decimals,
}: CoinInfoBarProps) {
  const [isFavorite, setIsFavorite] = useState(true);
  const [showCoinSelector, setShowCoinSelector] = useState(false);
  const [fundingCountdown, setFundingCountdown] = useState("00:00:00");

  // Funding countdown timer — uses real nextFundingTime from Binance Futures
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      // Use real next funding time if available, otherwise estimate next 8h mark (00:00, 08:00, 16:00 UTC)
      let target: number;
      if (coinStats.nextFundingTime && coinStats.nextFundingTime > now) {
        target = coinStats.nextFundingTime;
      } else {
        // Fallback: next 8-hour mark
        const d = new Date();
        const currentHour = d.getUTCHours();
        const nextFundingHour = Math.ceil((currentHour + 1) / 8) * 8;
        d.setUTCHours(nextFundingHour, 0, 0, 0);
        if (d.getTime() <= now) d.setTime(d.getTime() + 8 * 3600000);
        target = d.getTime();
      }

      const diff = Math.max(0, target - now);
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
  }, [coinStats.nextFundingTime]);

  // Use Binance spot price as mark, Binance Futures index as oracle
  const markPrice = price;
  const oraclePrice = coinStats.oraclePrice;
  const openInterest = coinStats.openInterest;
  const volume24h = coinStats.volume24h;
  const fundingRate = coinStats.fundingRate;
  const change24h = coinStats.change24h;
  const change24hAbs = coinStats.change24hAbs;

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
      {/* Star/Favorites row - matches real HL: 40px height, rounded-[5px], no borders */}
      <div className="h-[40px] flex items-center px-4 bg-s1 rounded-[5px]">
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

      <div className="relative z-10 flex items-center h-[63px] px-4 gap-4 bg-s1 rounded-[5px] overflow-x-auto">
        {/* Coin selector */}
        <button
          onClick={() => setShowCoinSelector(true)}
          className="flex items-center gap-2 flex-shrink-0"
        >
          {/* Coin icon — real SVG from Hyperliquid, 20x20 like original */}
          <CoinIcon coin={selectedCoin} size={20} />
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
            change24h !== null && change24h >= 0 ? "text-grn" : "text-red"
          )}>
            {change24hAbs !== null && change24h !== null
              ? `${change24h >= 0 ? "" : "-"}${Math.abs(change24hAbs).toFixed(decimals).replace(".", ",")} / ${change24h >= 0 ? "" : "-"}${Math.abs(change24h).toFixed(2).replace(".", ",")}%`
              : "—"}
          </span>
        </div>

        {/* 24H Volume */}
        <div className="flex flex-col flex-shrink-0 hidden lg:flex">
          <span className="text-[12px] text-t2 underline decoration-dashed decoration-t4 cursor-help leading-tight">
            24H Volume
          </span>
          <span className="text-[12px] text-t2 font-normal font-tabular mt-0.5 leading-tight">
            {volume24h !== null ? `$${formatLargeNumber(volume24h)}` : "—"}
          </span>
        </div>

        {/* Open Interest */}
        <div className="flex flex-col flex-shrink-0 hidden lg:flex">
          <span className="text-[12px] text-t2 underline decoration-dashed decoration-t4 cursor-help leading-tight">
            Open Interest
          </span>
          <span className="text-[12px] text-t2 font-normal font-tabular mt-0.5 leading-tight">
            {openInterest !== null ? `$${formatLargeNumber(openInterest)}` : "—"}
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
              fundingRate !== null && fundingRate >= 0 ? "text-grn" : "text-red"
            )}>
              {fundingRate !== null
                ? `${(fundingRate * 100).toFixed(4).replace(".", ",")}%`
                : "—"}
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
