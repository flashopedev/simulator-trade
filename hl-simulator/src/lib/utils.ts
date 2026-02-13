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
  HYPE: 3,
  BTC: 0,
  ETH: 2,
  SOL: 3,
  DOGE: 4,
  AVAX: 2,
  LINK: 2,
  ARB: 4,
  OP: 3,
  SUI: 3,
  WIF: 3,
  PEPE: 8,
  JUP: 3,
  TIA: 3,
  SEI: 4,
  INJ: 2,
  RENDER: 3,
  FET: 3,
  ONDO: 3,
  STX: 3,
  NEAR: 3,
  BONK: 8,
  // Tradfi coins (stocks use 2 decimals, gold uses 1)
  "xyz:TSLA": 2, "xyz:NVDA": 2, "xyz:AAPL": 2, "xyz:GOOGL": 2, "xyz:AMZN": 2,
  "xyz:META": 2, "xyz:MSFT": 2, "xyz:COIN": 2, "xyz:PLTR": 2, "xyz:HOOD": 2,
  "xyz:AMD": 2, "xyz:NFLX": 2, "xyz:GOLD": 1, "xyz:MSTR": 2, "xyz:INTC": 2,
};

export const COIN_ICONS: Record<string, string> = {
  HYPE: "H",
  BTC: "₿",
  ETH: "Ξ",
  SOL: "S",
  DOGE: "D",
  AVAX: "A",
  LINK: "L",
  ARB: "A",
  OP: "O",
  SUI: "S",
  WIF: "W",
  PEPE: "P",
  JUP: "J",
  TIA: "T",
  SEI: "S",
  INJ: "I",
  RENDER: "R",
  FET: "F",
  ONDO: "O",
  STX: "S",
  NEAR: "N",
  BONK: "B",
};

export const SUPPORTED_COINS = [
  "HYPE", "BTC", "ETH", "SOL", "DOGE", "AVAX", "LINK", "ARB", "OP", "SUI",
  "WIF", "PEPE", "JUP", "TIA", "SEI", "INJ", "RENDER", "FET", "ONDO", "STX", "NEAR", "BONK"
] as const;
export type SupportedCoin = (typeof SUPPORTED_COINS)[number];

// Tradfi coins (deployer markets on HL, xyz: prefix)
export const TRADFI_COINS = [
  "xyz:TSLA", "xyz:NVDA", "xyz:AAPL", "xyz:GOOGL", "xyz:AMZN", "xyz:META", "xyz:MSFT",
  "xyz:COIN", "xyz:PLTR", "xyz:HOOD", "xyz:AMD", "xyz:NFLX", "xyz:GOLD", "xyz:MSTR", "xyz:INTC",
] as const;
export type TradfiCoin = (typeof TRADFI_COINS)[number];

// All tradeable coins (crypto + tradfi)
export const ALL_SUPPORTED_COINS = [...SUPPORTED_COINS, ...TRADFI_COINS] as const;
export type AnyCoin = SupportedCoin | TradfiCoin;

export const TRADFI_NAMES: Record<string, string> = {
  "xyz:TSLA": "Tesla", "xyz:NVDA": "NVIDIA", "xyz:AAPL": "Apple", "xyz:GOOGL": "Google",
  "xyz:AMZN": "Amazon", "xyz:META": "Meta", "xyz:MSFT": "Microsoft", "xyz:COIN": "Coinbase",
  "xyz:PLTR": "Palantir", "xyz:HOOD": "Robinhood", "xyz:AMD": "AMD", "xyz:NFLX": "Netflix",
  "xyz:GOLD": "Gold", "xyz:MSTR": "MicroStrategy", "xyz:INTC": "Intel",
};

export const TRADFI_MAX_LEVERAGE: Record<string, number> = {
  "xyz:TSLA": 10, "xyz:NVDA": 10, "xyz:AAPL": 10, "xyz:GOOGL": 10, "xyz:AMZN": 10,
  "xyz:META": 10, "xyz:MSFT": 10, "xyz:COIN": 10, "xyz:PLTR": 10, "xyz:HOOD": 10,
  "xyz:AMD": 10, "xyz:NFLX": 10, "xyz:GOLD": 20, "xyz:MSTR": 10, "xyz:INTC": 10,
};

export function isTradfiCoin(coin: string): boolean {
  return coin.startsWith("xyz:");
}

export function coinDisplayName(coin: string): string {
  return isTradfiCoin(coin) ? coin.replace("xyz:", "") : coin;
}

export const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export const FALLBACK_PRICES: Record<string, number> = {
  HYPE: 33,
  BTC: 98000,
  ETH: 2800,
  SOL: 200,
  DOGE: 0.26,
  AVAX: 38,
  LINK: 19,
  ARB: 0.82,
  OP: 1.85,
  SUI: 3.5,
  WIF: 1.2,
  PEPE: 0.00001234,
  JUP: 0.87,
  TIA: 4.5,
  SEI: 0.34,
  INJ: 24,
  RENDER: 7.2,
  FET: 1.5,
  ONDO: 1.2,
  STX: 1.8,
  NEAR: 5.2,
  BONK: 0.00002345,
  // Tradfi fallback prices
  "xyz:TSLA": 417, "xyz:NVDA": 189, "xyz:AAPL": 265, "xyz:GOOGL": 313, "xyz:AMZN": 199,
  "xyz:META": 653, "xyz:MSFT": 401, "xyz:COIN": 140, "xyz:PLTR": 127, "xyz:HOOD": 71,
  "xyz:AMD": 207, "xyz:NFLX": 800, "xyz:GOLD": 4960, "xyz:MSTR": 121, "xyz:INTC": 47,
};
