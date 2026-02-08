"use client";

import { useState, useEffect, useCallback } from "react";
import { cn, type SupportedCoin } from "@/lib/utils";
import { Search, Star, X, Settings, Maximize2 } from "lucide-react";
import { CoinIcon } from "./CoinIcon";

// Real HL doesn't use category color tags - removed

interface CoinData {
  symbol: SupportedCoin;
  displayName: string;
  leverage: string;
  price: number;
  change24h: number;
  funding8h: number;
  volume: string;
  openInterest: string;
  isFavorite?: boolean;
  categories?: string[];
}

const COINS_DATA: CoinData[] = [
  { symbol: "HYPE", displayName: "HYPE-USDC", leverage: "10x", price: 33.07, change24h: -3.22, funding8h: 0.0100, volume: "$254M", openInterest: "$156M", categories: ["DeFi", "L1"] },
  { symbol: "BTC", displayName: "BTC-USDC", leverage: "50x", price: 98000, change24h: 1.50, funding8h: 0.0050, volume: "$1.2B", openInterest: "$890M", categories: ["L1"] },
  { symbol: "ETH", displayName: "ETH-USDC", leverage: "50x", price: 3200, change24h: -0.80, funding8h: 0.0080, volume: "$450M", openInterest: "$320M", categories: ["L1"] },
  { symbol: "SOL", displayName: "SOL-USDC", leverage: "25x", price: 180, change24h: 2.10, funding8h: 0.0120, volume: "$120M", openInterest: "$78M", categories: ["L1"] },
];

// Extended list of display-only coins (not tradeable but shown in selector like real HL)
interface DisplayCoin {
  symbol: string;
  displayName: string;
  leverage: string;
  price: number;
  change24h: number;
  funding8h: number;
  volume: string;
  openInterest: string;
  categories?: string[];
  tradeable: boolean;
}

const ALL_COINS: DisplayCoin[] = [
  { symbol: "HYPE", displayName: "HYPE-USDC", leverage: "10x", price: 33.07, change24h: -3.22, funding8h: 0.0100, volume: "$254M", openInterest: "$156M", categories: ["DeFi", "L1"], tradeable: true },
  { symbol: "BTC", displayName: "BTC-USDC", leverage: "50x", price: 98245, change24h: 1.50, funding8h: 0.0050, volume: "$1.2B", openInterest: "$890M", categories: ["L1"], tradeable: true },
  { symbol: "ETH", displayName: "ETH-USDC", leverage: "50x", price: 2756, change24h: -0.80, funding8h: 0.0080, volume: "$450M", openInterest: "$320M", categories: ["L1"], tradeable: true },
  { symbol: "SOL", displayName: "SOL-USDC", leverage: "25x", price: 206.5, change24h: 2.10, funding8h: 0.0120, volume: "$120M", openInterest: "$78M", categories: ["L1"], tradeable: true },
  { symbol: "DOGE", displayName: "DOGE-USDC", leverage: "20x", price: 0.2634, change24h: 5.42, funding8h: 0.0085, volume: "$89M", openInterest: "$45M", categories: [], tradeable: true },
  { symbol: "AVAX", displayName: "AVAX-USDC", leverage: "20x", price: 37.82, change24h: -1.15, funding8h: 0.0065, volume: "$67M", openInterest: "$34M", categories: [], tradeable: true },
  { symbol: "LINK", displayName: "LINK-USDC", leverage: "20x", price: 19.45, change24h: 3.78, funding8h: 0.0072, volume: "$58M", openInterest: "$29M", categories: [], tradeable: true },
  { symbol: "ARB", displayName: "ARB-USDC", leverage: "15x", price: 0.8234, change24h: -2.45, funding8h: 0.0045, volume: "$45M", openInterest: "$22M", categories: [], tradeable: true },
  { symbol: "OP", displayName: "OP-USDC", leverage: "15x", price: 1.856, change24h: 1.22, funding8h: 0.0055, volume: "$38M", openInterest: "$19M", categories: [], tradeable: true },
  { symbol: "SUI", displayName: "SUI-USDC", leverage: "15x", price: 3.542, change24h: 8.34, funding8h: 0.0150, volume: "$156M", openInterest: "$67M", categories: [], tradeable: true },
  { symbol: "WIF", displayName: "WIF-USDC", leverage: "10x", price: 1.234, change24h: -6.78, funding8h: -0.0120, volume: "$78M", openInterest: "$34M", categories: [], tradeable: true },
  { symbol: "PEPE", displayName: "PEPE-USDC", leverage: "10x", price: 0.00001234, change24h: 12.45, funding8h: 0.0200, volume: "$134M", openInterest: "$56M", categories: [], tradeable: true },
  { symbol: "JUP", displayName: "JUP-USDC", leverage: "10x", price: 0.876, change24h: -1.56, funding8h: 0.0034, volume: "$23M", openInterest: "$11M", categories: [], tradeable: true },
  { symbol: "TIA", displayName: "TIA-USDC", leverage: "15x", price: 4.567, change24h: -3.21, funding8h: 0.0089, volume: "$45M", openInterest: "$23M", categories: [], tradeable: true },
  { symbol: "SEI", displayName: "SEI-USDC", leverage: "10x", price: 0.3421, change24h: 4.56, funding8h: 0.0067, volume: "$34M", openInterest: "$16M", categories: [], tradeable: true },
  { symbol: "INJ", displayName: "INJ-USDC", leverage: "15x", price: 24.56, change24h: 2.34, funding8h: 0.0078, volume: "$56M", openInterest: "$28M", categories: [], tradeable: true },
  { symbol: "RENDER", displayName: "RENDER-USDC", leverage: "10x", price: 7.234, change24h: -4.12, funding8h: 0.0056, volume: "$34M", openInterest: "$17M", categories: [], tradeable: true },
  { symbol: "FET", displayName: "FET-USDC", leverage: "10x", price: 1.567, change24h: 6.78, funding8h: 0.0123, volume: "$45M", openInterest: "$22M", categories: [], tradeable: true },
  { symbol: "ONDO", displayName: "ONDO-USDC", leverage: "10x", price: 1.234, change24h: 3.45, funding8h: 0.0067, volume: "$28M", openInterest: "$14M", categories: [], tradeable: true },
  { symbol: "STX", displayName: "STX-USDC", leverage: "10x", price: 1.876, change24h: -1.23, funding8h: 0.0045, volume: "$19M", openInterest: "$9M", categories: [], tradeable: true },
  { symbol: "NEAR", displayName: "NEAR-USDC", leverage: "15x", price: 5.234, change24h: 1.89, funding8h: 0.0056, volume: "$34M", openInterest: "$17M", categories: [], tradeable: true },
  { symbol: "BONK", displayName: "BONK-USDC", leverage: "5x", price: 0.00002345, change24h: -8.45, funding8h: -0.0089, volume: "$67M", openInterest: "$28M", categories: [], tradeable: true },
];

interface CoinSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCoin: (coin: SupportedCoin) => void;
  selectedCoin: SupportedCoin;
}

export function CoinSelectorModal({
  isOpen,
  onClose,
  onSelectCoin,
  selectedCoin,
}: CoinSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("perps");
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(["HYPE"]));
  const [filterMode, setFilterMode] = useState<"strict" | "all">("all");

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  const toggleFavorite = useCallback((symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  }, []);

  const handleSelectCoin = (coin: DisplayCoin) => {
    if (coin.tradeable) {
      onSelectCoin(coin.symbol as SupportedCoin);
      onClose();
    }
  };

  // Filter coins
  const filteredCoins = ALL_COINS.filter(coin => {
    if (searchQuery) {
      return coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
             coin.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Sort: favorites first, then by volume
  const sortedCoins = [...filteredCoins].sort((a, b) => {
    const aFav = favorites.has(a.symbol) ? 1 : 0;
    const bFav = favorites.has(b.symbol) ? 1 : 0;
    if (bFav !== aFav) return bFav - aFav;
    return 0;
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[8vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Modal */}
      <div
        className="relative w-[860px] max-w-[92vw] max-h-[75vh] bg-s1 border border-brd rounded-lg overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with search */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-brd">
          <div className="flex-1 flex items-center gap-2 bg-s2 border border-brd rounded px-3 py-2">
            <Search className="w-4 h-4 text-t4" />
            <input
              type="text"
              placeholder="Search name or paste address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-t1 placeholder-t4 outline-none"
              autoFocus
            />
          </div>

          {/* Strict / All toggle */}
          <div className="flex border border-brd rounded overflow-hidden">
            <button
              onClick={() => setFilterMode("strict")}
              className={cn(
                "px-3 py-1.5 text-[11px] font-medium transition-colors",
                filterMode === "strict" ? "bg-red text-white" : "text-t3 hover:text-t2"
              )}
            >
              Strict
            </button>
            <button
              onClick={() => setFilterMode("all")}
              className={cn(
                "px-3 py-1.5 text-[11px] font-medium transition-colors",
                filterMode === "all" ? "bg-red text-white" : "text-t3 hover:text-t2"
              )}
            >
              All
            </button>
          </div>

          <button className="p-1.5 text-t3 hover:text-t2">
            <Settings className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-t3 hover:text-t2">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 text-t3 hover:text-t2">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-brd overflow-x-auto">
          {[
            { id: "all", label: "All" },
            { id: "perps", label: "Perps" },
            { id: "spot", label: "Spot", disabled: true },
            { id: "crypto", label: "Crypto", disabled: true },
            { id: "tradfi", label: "Tradfi", disabled: true },
            { id: "hip3", label: "HIP-3", disabled: true },
            { id: "trending", label: "Trending", disabled: true },
            { id: "prelaunch", label: "Pre-launch", disabled: true },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={cn(
                "px-3 py-1.5 text-[12px] font-medium rounded transition-colors whitespace-nowrap",
                activeTab === tab.id ? "bg-s3 text-t1" : "text-t3 hover:text-t2",
                tab.disabled && "opacity-40 cursor-not-allowed"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[36px_1fr_100px_100px_90px_90px_90px] gap-2 px-4 py-2 border-b border-brd text-[10px] text-t4 uppercase tracking-wider">
          <span></span>
          <span>Symbol</span>
          <span className="text-right">Last Price</span>
          <span className="text-right">24H Change ▽</span>
          <span className="text-right">8H Funding</span>
          <span className="text-right">Volume</span>
          <span className="text-right">OI</span>
        </div>

        {/* Coins list */}
        <div className="flex-1 overflow-y-auto">
          {sortedCoins.map(coin => (
            <div
              key={coin.symbol}
              onClick={() => handleSelectCoin(coin)}
              className={cn(
                "grid grid-cols-[36px_1fr_100px_100px_90px_90px_90px] gap-2 px-4 py-2 transition-colors",
                coin.tradeable ? "cursor-pointer" : "cursor-default opacity-70",
                selectedCoin === coin.symbol && coin.tradeable ? "bg-acc/10" : coin.tradeable ? "hover:bg-s2" : ""
              )}
            >
              {/* Favorite star */}
              <button
                onClick={(e) => toggleFavorite(coin.symbol, e)}
                className="flex items-center justify-center"
              >
                <Star
                  className={cn(
                    "w-3.5 h-3.5 transition-colors",
                    favorites.has(coin.symbol)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-t4 hover:text-t3"
                  )}
                />
              </button>

              {/* Symbol with icon and leverage badge - matching real HL */}
              <div className="flex items-center gap-2">
                <CoinIcon coin={coin.symbol} size={20} />
                <span className="text-[13px] font-medium text-t1">{coin.displayName}</span>
                <span className="px-1.5 py-0.5 bg-acc/20 text-acc text-[10px] font-medium rounded">
                  {coin.leverage}
                </span>
              </div>

              {/* Last Price */}
              <span className="text-right text-[12px] text-t1 font-tabular self-center">
                {coin.price >= 1
                  ? coin.price.toLocaleString(undefined, { minimumFractionDigits: coin.price < 100 ? 2 : 0, maximumFractionDigits: coin.price < 100 ? 2 : 0 })
                  : coin.price < 0.001
                    ? coin.price.toFixed(8)
                    : coin.price.toFixed(4)
                }
              </span>

              {/* 24H Change */}
              <span className={cn(
                "text-right text-[12px] font-tabular self-center",
                coin.change24h >= 0 ? "text-grn" : "text-red"
              )}>
                {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%
              </span>

              {/* 8H Funding */}
              <span className={cn(
                "text-right text-[12px] font-tabular self-center",
                coin.funding8h >= 0 ? "text-grn" : "text-red"
              )}>
                {coin.funding8h >= 0 ? "" : "-"}{Math.abs(coin.funding8h).toFixed(4)}%
              </span>

              {/* Volume */}
              <span className="text-right text-[12px] text-t2 font-tabular self-center">
                {coin.volume}
              </span>

              {/* Open Interest */}
              <span className="text-right text-[12px] text-t2 font-tabular self-center">
                {coin.openInterest}
              </span>
            </div>
          ))}
        </div>

        {/* Keyboard shortcuts footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-brd text-[10px] text-t4">
          <span><kbd className="px-1.5 py-0.5 bg-s3 rounded text-t3">⌘K</kbd> Open</span>
          <span><kbd className="px-1.5 py-0.5 bg-s3 rounded text-t3">↑↓</kbd> Navigate</span>
          <span><kbd className="px-1.5 py-0.5 bg-s3 rounded text-t3">Enter</kbd> Select</span>
          <span><kbd className="px-1.5 py-0.5 bg-s3 rounded text-t3">⌘S</kbd> Favorite</span>
          <span><kbd className="px-1.5 py-0.5 bg-s3 rounded text-t3">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
