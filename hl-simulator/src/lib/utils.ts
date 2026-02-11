import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals: number = 2): string {
  // Use European format: comma as decimal, space as thousands (matches real HL display)
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).replace(/\./g, ' ');
}

export function formatUsd(value: number): string {
  // European format with $ prefix
  return '$' + formatNumber(value, 2);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatPnl(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}$${formatNumber(Math.abs(value), 2)}`;
}

export function calculateLiquidationPrice(
  entryPrice: number,
  isLong: boolean,
  leverage: number
): number {
  // Real HL formula: maintenance margin ~0.5% for most assets
  // Liquidation when: initialMargin + unrealizedPnL <= maintenanceMargin
  const initialMarginRate = 1 / leverage;
  const maintenanceMarginRate = 0.005; // 0.5% maintenance margin (real HL standard)
  if (isLong) {
    return entryPrice * (1 - initialMarginRate + maintenanceMarginRate);
  }
  return entryPrice * (1 + initialMarginRate - maintenanceMarginRate);
}

export function calculatePnl(
  entryPrice: number,
  currentPrice: number,
  size: number,
  isLong: boolean
): number {
  const priceDiff = currentPrice - entryPrice;
  return isLong ? priceDiff * size : -priceDiff * size;
}

export function calculateRoe(
  pnl: number,
  entryPrice: number,
  size: number,
  leverage: number
): number {
  const margin = (size * entryPrice) / leverage;
  if (margin === 0) return 0;
  return (pnl / margin) * 100;
}

export const COIN_DECIMALS: Record<string, number> = {
  HYPE: 3, BTC: 0, ETH: 2, SOL: 3, DOGE: 4, AVAX: 2, LINK: 2, ARB: 4,
  OP: 3, SUI: 3, WIF: 3, PEPE: 8, JUP: 3, TIA: 3, SEI: 4, INJ: 2,
  RENDER: 3, FET: 3, ONDO: 3, STX: 3, NEAR: 3, BONK: 8,
  // Tradifi (xyz: deployer) — price decimals for display
  "xyz:TSLA": 2, "xyz:NVDA": 2, "xyz:AAPL": 2, "xyz:MSFT": 2, "xyz:GOOGL": 2,
  "xyz:AMZN": 2, "xyz:META": 2, "xyz:HOOD": 2, "xyz:PLTR": 2, "xyz:COIN": 2,
  "xyz:INTC": 2, "xyz:AMD": 2, "xyz:MU": 2, "xyz:SNDK": 2, "xyz:MSTR": 2,
  "xyz:CRCL": 2, "xyz:NFLX": 2, "xyz:ORCL": 2, "xyz:TSM": 2, "xyz:BABA": 2,
  "xyz:RIVN": 2, "xyz:CRWV": 2, "xyz:USAR": 2, "xyz:URNM": 2,
  "xyz:XYZ100": 0, "xyz:GOLD": 1, "xyz:SILVER": 2, "xyz:CL": 2,
  "xyz:COPPER": 3, "xyz:NATGAS": 3, "xyz:PLATINUM": 1,
  "xyz:JPY": 2, "xyz:EUR": 4,
};

export const COIN_ICONS: Record<string, string> = {
  HYPE: "H", BTC: "₿", ETH: "Ξ", SOL: "S", DOGE: "D", AVAX: "A",
  LINK: "L", ARB: "A", OP: "O", SUI: "S", WIF: "W", PEPE: "P",
  JUP: "J", TIA: "T", SEI: "S", INJ: "I", RENDER: "R", FET: "F",
  ONDO: "O", STX: "S", NEAR: "N", BONK: "B",
};

// Native crypto perps
export const SUPPORTED_COINS = [
  "HYPE", "BTC", "ETH", "SOL", "DOGE", "AVAX", "LINK", "ARB", "OP", "SUI",
  "WIF", "PEPE", "JUP", "TIA", "SEI", "INJ", "RENDER", "FET", "ONDO", "STX", "NEAR", "BONK"
] as const;

// Tradifi perps (xyz: deployer, USDC collateral)
export const TRADIFI_COINS = [
  // Stocks
  "xyz:TSLA", "xyz:NVDA", "xyz:AAPL", "xyz:MSFT", "xyz:GOOGL", "xyz:AMZN",
  "xyz:META", "xyz:HOOD", "xyz:PLTR", "xyz:COIN", "xyz:INTC", "xyz:AMD",
  "xyz:MU", "xyz:SNDK", "xyz:MSTR", "xyz:CRCL", "xyz:NFLX", "xyz:ORCL",
  "xyz:TSM", "xyz:BABA", "xyz:RIVN", "xyz:CRWV", "xyz:USAR", "xyz:URNM",
  // Index
  "xyz:XYZ100",
  // Commodities
  "xyz:GOLD", "xyz:SILVER", "xyz:CL", "xyz:COPPER", "xyz:NATGAS", "xyz:PLATINUM",
  // FX
  "xyz:JPY", "xyz:EUR",
] as const;

// All supported coins (crypto + tradifi)
export const ALL_COINS = [...SUPPORTED_COINS, ...TRADIFI_COINS] as const;

export type SupportedCoin = string;

// Helper: check if coin is a tradifi pair
export function isTradifiCoin(coin: string): boolean {
  return coin.startsWith("xyz:") || coin.startsWith("flx:") || coin.startsWith("vntl:") || coin.startsWith("km:") || coin.startsWith("cash:");
}

// Get the short symbol from a prefixed coin name (e.g., "xyz:TSLA" -> "TSLA")
export function getTradifiSymbol(coin: string): string {
  const idx = coin.indexOf(":");
  return idx >= 0 ? coin.slice(idx + 1) : coin;
}

// Human-readable names for tradifi pairs
export const TRADIFI_NAMES: Record<string, string> = {
  "xyz:TSLA": "Tesla", "xyz:NVDA": "Nvidia", "xyz:AAPL": "Apple", "xyz:MSFT": "Microsoft",
  "xyz:GOOGL": "Alphabet", "xyz:AMZN": "Amazon", "xyz:META": "Meta", "xyz:HOOD": "Robinhood",
  "xyz:PLTR": "Palantir", "xyz:COIN": "Coinbase", "xyz:INTC": "Intel", "xyz:AMD": "AMD",
  "xyz:MU": "Micron", "xyz:SNDK": "Western Digital", "xyz:MSTR": "MicroStrategy",
  "xyz:CRCL": "Circle", "xyz:NFLX": "Netflix", "xyz:ORCL": "Oracle", "xyz:TSM": "TSMC",
  "xyz:BABA": "Alibaba", "xyz:RIVN": "Rivian", "xyz:CRWV": "CoreWeave",
  "xyz:USAR": "US Aerospace", "xyz:URNM": "Uranium ETF",
  "xyz:XYZ100": "Nasdaq 100",
  "xyz:GOLD": "Gold", "xyz:SILVER": "Silver", "xyz:CL": "Crude Oil",
  "xyz:COPPER": "Copper", "xyz:NATGAS": "Natural Gas", "xyz:PLATINUM": "Platinum",
  "xyz:JPY": "USD/JPY", "xyz:EUR": "EUR/USD",
};

// Max leverage for tradifi pairs
export const TRADIFI_MAX_LEVERAGE: Record<string, number> = {
  "xyz:TSLA": 10, "xyz:NVDA": 10, "xyz:AAPL": 10, "xyz:MSFT": 10, "xyz:GOOGL": 10,
  "xyz:AMZN": 10, "xyz:META": 10, "xyz:HOOD": 10, "xyz:PLTR": 10, "xyz:COIN": 10,
  "xyz:INTC": 10, "xyz:AMD": 10, "xyz:MU": 10, "xyz:SNDK": 10, "xyz:MSTR": 10,
  "xyz:CRCL": 10, "xyz:NFLX": 10, "xyz:ORCL": 10, "xyz:TSM": 10, "xyz:BABA": 10,
  "xyz:RIVN": 10, "xyz:CRWV": 10, "xyz:USAR": 10, "xyz:URNM": 10,
  "xyz:XYZ100": 25,
  "xyz:GOLD": 20, "xyz:SILVER": 20, "xyz:CL": 20, "xyz:COPPER": 20, "xyz:NATGAS": 10, "xyz:PLATINUM": 20,
  "xyz:JPY": 50, "xyz:EUR": 50,
};

// Tradifi category classification
export type TradifiCategory = "stocks" | "indices" | "commodities" | "fx";
export function getTradifiCategory(coin: string): TradifiCategory {
  const sym = getTradifiSymbol(coin);
  if (["XYZ100"].includes(sym)) return "indices";
  if (["GOLD", "SILVER", "CL", "COPPER", "NATGAS", "PLATINUM"].includes(sym)) return "commodities";
  if (["JPY", "EUR"].includes(sym)) return "fx";
  return "stocks";
}

export const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export const FALLBACK_PRICES: Record<string, number> = {
  HYPE: 33, BTC: 98000, ETH: 2800, SOL: 200, DOGE: 0.26, AVAX: 38,
  LINK: 19, ARB: 0.82, OP: 1.85, SUI: 3.5, WIF: 1.2, PEPE: 0.00001234,
  JUP: 0.87, TIA: 4.5, SEI: 0.34, INJ: 24, RENDER: 7.2, FET: 1.5,
  ONDO: 1.2, STX: 1.8, NEAR: 5.2, BONK: 0.00002345,
  // Tradifi
  "xyz:TSLA": 423, "xyz:NVDA": 192, "xyz:AAPL": 279, "xyz:MSFT": 403,
  "xyz:GOOGL": 311, "xyz:AMZN": 204, "xyz:META": 661, "xyz:HOOD": 75,
  "xyz:PLTR": 134, "xyz:COIN": 149, "xyz:INTC": 48, "xyz:AMD": 211,
  "xyz:MU": 403, "xyz:SNDK": 598, "xyz:MSTR": 125, "xyz:CRCL": 56,
  "xyz:NFLX": 80, "xyz:ORCL": 156, "xyz:TSM": 377, "xyz:BABA": 164,
  "xyz:RIVN": 14, "xyz:CRWV": 93, "xyz:USAR": 21, "xyz:URNM": 71,
  "xyz:XYZ100": 25162, "xyz:GOLD": 5089, "xyz:SILVER": 84,
  "xyz:CL": 65, "xyz:COPPER": 6, "xyz:NATGAS": 3, "xyz:PLATINUM": 2142,
  "xyz:JPY": 153, "xyz:EUR": 1.19,
};
