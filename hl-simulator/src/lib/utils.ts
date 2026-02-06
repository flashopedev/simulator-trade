import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatPnl(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${formatNumber(value, 2)}`;
}

export function calculateLiquidationPrice(
  entryPrice: number,
  isLong: boolean,
  leverage: number
): number {
  const maintenanceMargin = 0.95 / leverage;
  if (isLong) {
    return entryPrice * (1 - maintenanceMargin);
  }
  return entryPrice * (1 + maintenanceMargin);
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
  HYPE: 2,
  BTC: 1,
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
};
