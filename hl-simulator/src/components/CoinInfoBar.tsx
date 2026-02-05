"use client";

import { useState } from "react";
import { cn, COIN_ICONS, SUPPORTED_COINS, type SupportedCoin } from "@/lib/utils";
import { Star, ChevronDown, Copy, ExternalLink } from "lucide-react";

// Mock contract addresses for demo
const CONTRACT_ADDRESSES: Record<SupportedCoin, string> = {
  BTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  ETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  SOL: "0xD31a59c85aE9D8edEFeC411D448f90841571b89c",
  HYPE: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
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
  const [isFavorite, setIsFavorite] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const contractAddress = CONTRACT_ADDRESSES[selectedCoin];
  const shortAddress = `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-[52px] flex items-center gap-4 px-4 border-b border-brd bg-s1 relative">
      {/* Star favorite button */}
      <button
        onClick={() => setIsFavorite(!isFavorite)}
        className="flex-shrink-0"
      >
        <Star
          className={cn(
            "w-4 h-4 transition-colors",
            isFavorite ? "fill-yellow-400 text-yellow-400" : "text-t4 hover:text-t3"
          )}
        />
      </button>

      {/* Coin selector dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 pr-3 h-full"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-acc to-grn flex items-center justify-center text-[10px] font-bold text-black">
            {COIN_ICONS[selectedCoin]}
          </div>
          <span className="font-bold text-[15px] text-t1">{selectedCoin}-PERP</span>
          <ChevronDown className={cn(
            "w-4 h-4 text-t3 transition-transform",
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
            <div className="absolute top-full left-0 mt-1 bg-s2 border border-brd rounded-lg shadow-xl z-50 min-w-[200px] py-1">
              <div className="px-3 py-2 border-b border-brd">
                <input
                  type="text"
                  placeholder="Search markets..."
                  className="w-full bg-s3 border border-brd rounded px-2 py-1.5 text-[12px] text-t1 placeholder-t4 outline-none focus:border-acc"
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto">
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
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-acc to-grn flex items-center justify-center text-[8px] font-bold text-black">
                      {COIN_ICONS[c]}
                    </div>
                    <span className="text-[13px] font-medium">{c}-PERP</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Contract address */}
      <div className="hidden lg:flex items-center gap-1.5 px-3 border-l border-brd">
        <span className="text-[10px] text-t4">Contract:</span>
        <span className="text-[11px] text-t3 font-mono">{shortAddress}</span>
        <button
          onClick={handleCopyAddress}
          className="p-0.5 hover:bg-s3 rounded transition-colors"
          title="Copy address"
        >
          <Copy className={cn(
            "w-3 h-3",
            copied ? "text-grn" : "text-t4 hover:text-t3"
          )} />
        </button>
        <a
          href={`https://etherscan.io/address/${contractAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-0.5 hover:bg-s3 rounded transition-colors"
          title="View on Etherscan"
        >
          <ExternalLink className="w-3 h-3 text-t4 hover:text-t3" />
        </a>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-brd" />

      {/* Price */}
      <div>
        <div className="text-[18px] font-bold text-t1 font-tabular leading-tight">
          {stats.price?.toFixed(decimals) ?? "\u2014"}
        </div>
      </div>

      {/* 24H Change */}
      <div className="pl-3 border-l border-brd">
        <div className="text-[9px] text-t4 uppercase tracking-wide mb-0.5">24h Change</div>
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
      <div className="hidden md:block pl-3 border-l border-brd">
        <div className="text-[9px] text-t4 uppercase tracking-wide mb-0.5">24h High</div>
        <div className="text-[13px] font-medium font-tabular text-t2">
          {stats.high24h?.toFixed(decimals) ?? "\u2014"}
        </div>
      </div>

      {/* 24H Low */}
      <div className="hidden md:block pl-3 border-l border-brd">
        <div className="text-[9px] text-t4 uppercase tracking-wide mb-0.5">24h Low</div>
        <div className="text-[13px] font-medium font-tabular text-t2">
          {stats.low24h?.toFixed(decimals) ?? "\u2014"}
        </div>
      </div>

      {/* 24H Volume */}
      <div className="hidden lg:block pl-3 border-l border-brd">
        <div className="text-[9px] text-t4 uppercase tracking-wide mb-0.5">24h Volume</div>
        <div className="text-[13px] font-medium font-tabular text-t2">
          $1.2B
        </div>
      </div>

      {/* Open Interest */}
      <div className="hidden xl:block pl-3 border-l border-brd">
        <div className="text-[9px] text-t4 uppercase tracking-wide mb-0.5">Open Interest</div>
        <div className="text-[13px] font-medium font-tabular text-t2">
          $450M
        </div>
      </div>

      {/* Funding Rate */}
      <div className="hidden xl:block pl-3 border-l border-brd">
        <div className="text-[9px] text-t4 uppercase tracking-wide mb-0.5">Funding / Countdown</div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[13px] font-medium font-tabular",
            stats.fundingRate !== null && stats.fundingRate >= 0 ? "text-grn" : "text-red"
          )}>
            {stats.fundingRate !== null ? `${(stats.fundingRate * 100).toFixed(4)}%` : "\u2014"}
          </span>
          <span className="text-[11px] text-t4">/ 07:12:34</span>
        </div>
      </div>
    </div>
  );
}
