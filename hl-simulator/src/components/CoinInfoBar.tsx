"use client";

import { useState, useEffect } from "react";
import { cn, COIN_ICONS, SUPPORTED_COINS, type SupportedCoin } from "@/lib/utils";
import { Star, ChevronDown } from "lucide-react";

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
  const [isFavorite, setIsFavorite] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
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

  // Mock data for PERP-specific fields
  const markPrice = stats.price ? stats.price * 1.0001 : null; // Slightly different from oracle
  const oraclePrice = stats.price;
  const openInterest = 156.8; // Mock: $156.8M
  const fundingRate = stats.fundingRate ?? 0.0042;

  return (
    <div className="flex flex-col border-b border-brd bg-s1">
      {/* FIX 8: Star on separate line above */}
      <div className="flex items-center h-[32px] px-4 border-b border-brd">
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="flex items-center gap-1.5"
        >
          <Star
            className={cn(
              "w-3.5 h-3.5 transition-colors",
              isFavorite ? "fill-yellow-400 text-yellow-400" : "text-t4 hover:text-t3"
            )}
          />
          <span className="text-[11px] text-t3">Favorite</span>
        </button>
      </div>

      {/* Main info bar */}
      <div className="h-[48px] flex items-center gap-4 px-4">
        {/* Coin selector dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 h-full"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-acc to-grn flex items-center justify-center text-[10px] font-bold text-black">
              {COIN_ICONS[selectedCoin]}
            </div>
            <span className="font-bold text-[15px] text-t1">{selectedCoin}-PERP</span>
            <ChevronDown className={cn(
              "w-3.5 h-3.5 text-t3 transition-transform",
              showDropdown && "rotate-180"
            )} />
          </button>

          {/* Dropdown menu */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute top-full left-0 mt-1 bg-s2 border border-brd rounded-lg shadow-xl z-50 min-w-[180px] py-1">
                <div className="px-3 py-2 border-b border-brd">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full bg-s3 border border-brd rounded px-2 py-1.5 text-[11px] text-t1 placeholder-t4 outline-none focus:border-acc"
                  />
                </div>
                <div className="max-h-[250px] overflow-y-auto">
                  {SUPPORTED_COINS.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        onSelectCoin(c);
                        setShowDropdown(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
                        selectedCoin === c
                          ? "bg-acc/10 text-acc"
                          : "text-t2 hover:bg-s3"
                      )}
                    >
                      <div className="w-4 h-4 rounded-full bg-gradient-to-br from-acc to-grn flex items-center justify-center text-[7px] font-bold text-black">
                        {COIN_ICONS[c]}
                      </div>
                      <span className="text-[12px] font-medium">{c}-PERP</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Oracle Price (main price) */}
        <div className="pl-3 border-l border-brd">
          <div className="text-[18px] font-bold text-t1 font-tabular leading-tight">
            {oraclePrice?.toFixed(decimals) ?? "—"}
          </div>
        </div>

        {/* Mark Price - FIX 7 */}
        <div className="pl-3 border-l border-brd">
          <div className="text-[10px] text-t4 mb-0.5 border-b border-dotted border-t4 inline-block cursor-help" title="Mark price used for liquidations">
            Mark
          </div>
          <div className="text-[12px] font-medium font-tabular text-t2">
            {markPrice?.toFixed(decimals) ?? "—"}
          </div>
        </div>

        {/* Oracle Price label - FIX 7 */}
        <div className="hidden lg:block pl-3 border-l border-brd">
          <div className="text-[10px] text-t4 mb-0.5 border-b border-dotted border-t4 inline-block cursor-help" title="Oracle price from external feeds">
            Oracle
          </div>
          <div className="text-[12px] font-medium font-tabular text-t2">
            {oraclePrice?.toFixed(decimals) ?? "—"}
          </div>
        </div>

        {/* 24H Change */}
        <div className="pl-3 border-l border-brd">
          <div className="text-[10px] text-t4 mb-0.5 border-b border-dotted border-t4 inline-block cursor-help" title="24 hour price change">
            24h Change
          </div>
          <div
            className={cn(
              "text-[12px] font-semibold font-tabular",
              stats.change24h !== null && stats.change24h >= 0 ? "text-grn" : "text-red"
            )}
          >
            {stats.change24h !== null
              ? `${stats.change24h >= 0 ? "+" : ""}${stats.change24h.toFixed(2)}%`
              : "—"}
          </div>
        </div>

        {/* Open Interest - FIX 7 */}
        <div className="hidden md:block pl-3 border-l border-brd">
          <div className="text-[10px] text-t4 mb-0.5 border-b border-dotted border-t4 inline-block cursor-help" title="Total open interest">
            Open Interest
          </div>
          <div className="text-[12px] font-medium font-tabular text-t2">
            ${openInterest.toFixed(1)}M
          </div>
        </div>

        {/* 24H Volume */}
        <div className="hidden md:block pl-3 border-l border-brd">
          <div className="text-[10px] text-t4 mb-0.5 border-b border-dotted border-t4 inline-block cursor-help" title="24 hour trading volume">
            24h Volume
          </div>
          <div className="text-[12px] font-medium font-tabular text-t2">
            $254.2M
          </div>
        </div>

        {/* Funding Rate + Countdown - FIX 7 */}
        <div className="hidden xl:block pl-3 border-l border-brd">
          <div className="text-[10px] text-t4 mb-0.5 border-b border-dotted border-t4 inline-block cursor-help" title="Funding rate and time until next funding">
            Funding / Countdown
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[12px] font-medium font-tabular",
              fundingRate >= 0 ? "text-grn" : "text-red"
            )}>
              {fundingRate >= 0 ? "+" : ""}{(fundingRate * 100).toFixed(4)}%
            </span>
            <span className="text-[12px] font-tabular text-t3">
              {fundingCountdown}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
