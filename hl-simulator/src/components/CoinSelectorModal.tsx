"use client";

import { useState, useEffect, useCallback } from "react";
import { cn, type SupportedCoin, SUPPORTED_COINS, COIN_DECIMALS } from "@/lib/utils";
import { Search, Star, X, Settings, Maximize2 } from "lucide-react";
import { CoinIcon } from "./CoinIcon";
import { fetchMetaAndAssetCtxs, type AssetCtx } from "@/lib/hyperliquid";

// Leverage per coin (max leverage from real HL)
const COIN_LEVERAGE: Record<string, string> = {
  HYPE: "10x", BTC: "50x", ETH: "50x", SOL: "25x", DOGE: "20x",
  AVAX: "20x", LINK: "20x", ARB: "15x", OP: "15x", SUI: "15x",
  WIF: "10x", PEPE: "10x", JUP: "10x", TIA: "15x", SEI: "10x",
  INJ: "15x", RENDER: "10x", FET: "10x", ONDO: "10x", STX: "10x",
  NEAR: "15x", BONK: "5x",
};

interface CoinMarketData {
  symbol: string;
  displayName: string;
  leverage: string;
  price: number;
  change24h: number;
  funding8h: number;
  volume: number;
  openInterest: number;
  tradeable: boolean;
}

interface CoinSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCoin: (coin: SupportedCoin) => void;
  selectedCoin: SupportedCoin;
}

function formatVolume(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.001) return price.toFixed(4);
  return price.toFixed(8);
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
  const [coins, setCoins] = useState<CoinMarketData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real market data from HL API
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchMetaAndAssetCtxs();
        if (data) {
          const coinMap = new Map<string, AssetCtx>();
          data.universe.forEach((u, i) => {
            coinMap.set(u.name, data.assetCtxs[i]);
          });

          const marketData: CoinMarketData[] = SUPPORTED_COINS.map((symbol) => {
            const ctx = coinMap.get(symbol);
            const midPrice = ctx ? parseFloat(ctx.midPx) : 0;
            const prevDayPx = ctx ? parseFloat(ctx.prevDayPx) : 0;
            const change24h = prevDayPx > 0 ? ((midPrice - prevDayPx) / prevDayPx) * 100 : 0;
            const funding = ctx ? parseFloat(ctx.funding) * 100 : 0; // convert to %
            const oi = ctx ? parseFloat(ctx.openInterest) * midPrice : 0; // OI in USD
            const volume = ctx ? parseFloat(ctx.dayNtlVlm) : 0;

            return {
              symbol,
              displayName: `${symbol}-USDC`,
              leverage: COIN_LEVERAGE[symbol] || "10x",
              price: midPrice,
              change24h,
              funding8h: funding * 8, // 8h funding = hourly * 8
              volume,
              openInterest: oi,
              tradeable: true,
            };
          });

          setCoins(marketData);
        }
      } catch {
        // Fallback: show coins with zero data
        setCoins(SUPPORTED_COINS.map((symbol) => ({
          symbol,
          displayName: `${symbol}-USDC`,
          leverage: COIN_LEVERAGE[symbol] || "10x",
          price: 0,
          change24h: 0,
          funding8h: 0,
          volume: 0,
          openInterest: 0,
          tradeable: true,
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen]);

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
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  }, []);

  const handleSelectCoin = (coin: CoinMarketData) => {
    if (coin.tradeable) {
      onSelectCoin(coin.symbol as SupportedCoin);
      onClose();
    }
  };

  // Filter coins
  const filteredCoins = coins.filter(coin => {
    if (searchQuery) {
      return coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
             coin.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Sort: favorites first, then by volume descending
  const sortedCoins = [...filteredCoins].sort((a, b) => {
    const aFav = favorites.has(a.symbol) ? 1 : 0;
    const bFav = favorites.has(b.symbol) ? 1 : 0;
    if (bFav !== aFav) return bFav - aFav;
    return b.volume - a.volume;
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
          <span className="text-right">24H Change</span>
          <span className="text-right">8H Funding</span>
          <span className="text-right">Volume</span>
          <span className="text-right">OI</span>
        </div>

        {/* Coins list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-t3 text-[12px]">Loading market data...</div>
          ) : sortedCoins.map(coin => (
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

              {/* Symbol with icon and leverage badge */}
              <div className="flex items-center gap-2">
                <CoinIcon coin={coin.symbol} size={20} />
                <span className="text-[13px] font-medium text-t1">{coin.displayName}</span>
                <span className="px-1.5 py-0.5 bg-acc/20 text-acc text-[10px] font-medium rounded">
                  {coin.leverage}
                </span>
              </div>

              {/* Last Price */}
              <span className="text-right text-[12px] text-t1 font-tabular self-center">
                {formatPrice(coin.price)}
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
                {formatVolume(coin.volume)}
              </span>

              {/* Open Interest */}
              <span className="text-right text-[12px] text-t2 font-tabular self-center">
                {formatVolume(coin.openInterest)}
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
