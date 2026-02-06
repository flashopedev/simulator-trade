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

  const formatLargeNumber = (num: number) => {
    return `$${num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}M`;
  };

  return (
    <>
      <div className="flex flex-col border-b border-brd bg-s1">
        {/* ROW 1: Star only */}
        <div className="flex items-center h-[28px] px-4">
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

        {/* ROW 2: Main info bar */}
        <div className="h-[55px] flex items-center gap-5 px-4">
          {/* Coin selector */}
          <button
            onClick={() => setShowCoinSelector(true)}
            className="flex items-center gap-2"
          >
            {/* Coin icon */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-acc to-blu flex items-center justify-center text-[11px] font-bold text-white">
              {COIN_ICONS[selectedCoin]}
            </div>
            {/* Name + dropdown */}
            <span className="text-[18px] font-bold text-t1">{selectedCoin}-USDC</span>
            <ChevronDown className="w-4 h-4 text-t3" />
            {/* Leverage badge */}
            <span className="px-1.5 py-0.5 bg-acc text-black text-[11px] font-bold rounded">
              {COIN_LEVERAGE[selectedCoin]}
            </span>
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-brd" />

          {/* Mark Price */}
          <div className="flex flex-col">
            <span className="text-[11px] text-t3 border-b border-dotted border-t4 cursor-help pb-0.5">
              Mark
            </span>
            <span className="text-[14px] text-t1 font-medium font-tabular mt-0.5">
              {formatPrice(markPrice)}
            </span>
          </div>

          {/* Oracle Price */}
          <div className="flex flex-col">
            <span className="text-[11px] text-t3 border-b border-dotted border-t4 cursor-help pb-0.5">
              Oracle
            </span>
            <span className="text-[14px] text-t1 font-medium font-tabular mt-0.5">
              {formatPrice(oraclePrice)}
            </span>
          </div>

          {/* 24H Change */}
          <div className="flex flex-col">
            <span className="text-[11px] text-t3 border-b border-dotted border-t4 cursor-help pb-0.5">
              24H Change
            </span>
            <span className={cn(
              "text-[14px] font-medium font-tabular mt-0.5",
              stats.change24h !== null && stats.change24h >= 0 ? "text-grn" : "text-red"
            )}>
              {priceChange !== null && stats.change24h !== null
                ? `${stats.change24h >= 0 ? "+" : "-"}${priceChange.toFixed(decimals)} / ${stats.change24h >= 0 ? "+" : ""}${stats.change24h.toFixed(2)}%`
                : "—"}
            </span>
          </div>

          {/* 24H Volume */}
          <div className="hidden lg:flex flex-col">
            <span className="text-[11px] text-t3 border-b border-dotted border-t4 cursor-help pb-0.5">
              24H Volume
            </span>
            <span className="text-[14px] text-t1 font-medium font-tabular mt-0.5">
              ${volume24h.toFixed(0)}M
            </span>
          </div>

          {/* Open Interest */}
          <div className="hidden lg:flex flex-col">
            <span className="text-[11px] text-t3 border-b border-dotted border-t4 cursor-help pb-0.5">
              Open Interest
            </span>
            <span className="text-[14px] text-t1 font-medium font-tabular mt-0.5">
              ${openInterest.toFixed(0)}M
            </span>
          </div>

          {/* Funding / Countdown */}
          <div className="hidden xl:flex flex-col">
            <span className="text-[11px] text-t3 border-b border-dotted border-t4 cursor-help pb-0.5">
              Funding / Countdown
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                "text-[14px] font-medium font-tabular",
                fundingRate >= 0 ? "text-grn" : "text-red"
              )}>
                {fundingRate >= 0 ? "" : "-"}{(Math.abs(fundingRate) * 100).toFixed(4)}%
              </span>
              <span className="text-[14px] font-tabular text-t2">
                {fundingCountdown}
              </span>
            </div>
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
