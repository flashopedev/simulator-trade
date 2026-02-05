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

  // Calculate 24h change value (mock: price * change%)
  const priceChangeValue = stats.price && stats.change24h
    ? (stats.price * stats.change24h / 100).toFixed(2)
    : null;

  return (
    <div className="h-[48px] flex items-center gap-3 px-4 border-b border-brd bg-s1 relative">
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
          className="flex items-center gap-2 h-full"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-acc to-grn flex items-center justify-center text-[9px] font-bold text-black">
            {COIN_ICONS[selectedCoin]}
          </div>
          <span className="font-bold text-[14px] text-t1">{selectedCoin}/USDC</span>
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
                    <span className="text-[12px] font-medium">{c}/USDC</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Contract address */}
      <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-brd">
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

      {/* Price */}
      <div className="pl-3 border-l border-brd">
        <div className="text-[18px] font-bold text-t1 font-tabular leading-tight">
          {stats.price?.toFixed(decimals) ?? "—"}
        </div>
      </div>

      {/* 24H Change - value and percent */}
      <div className="pl-3 border-l border-brd">
        <div className="text-[10px] text-t4 uppercase tracking-wide mb-0.5">24h Change</div>
        <div
          className={cn(
            "text-[12px] font-semibold font-tabular",
            stats.change24h !== null && stats.change24h >= 0 ? "text-grn" : "text-red"
          )}
        >
          {priceChangeValue && stats.change24h !== null
            ? `${stats.change24h >= 0 ? "+" : ""}${priceChangeValue} / ${stats.change24h >= 0 ? "+" : ""}${stats.change24h.toFixed(2)}%`
            : "—"}
        </div>
      </div>

      {/* 24H Volume */}
      <div className="hidden md:block pl-3 border-l border-brd">
        <div className="text-[10px] text-t4 uppercase tracking-wide mb-0.5">24h Volume</div>
        <div className="text-[12px] font-medium font-tabular text-t2">
          $254M USDC
        </div>
      </div>

      {/* Market Cap */}
      <div className="hidden xl:block pl-3 border-l border-brd">
        <div className="text-[10px] text-t4 uppercase tracking-wide mb-0.5">Market Cap</div>
        <div className="text-[12px] font-medium font-tabular text-t2">
          $9.9B USDC
        </div>
      </div>
    </div>
  );
}
