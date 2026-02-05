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
};

export const COIN_ICONS: Record<string, string> = {
  HYPE: "H",
  BTC: "₿",
  ETH: "Ξ",
  SOL: "S",
};

export const SUPPORTED_COINS = ["HYPE", "BTC", "ETH", "SOL"] as const;
export type SupportedCoin = (typeof SUPPORTED_COINS)[number];

export const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export const FALLBACK_PRICES: Record<string, number> = {
  HYPE: 21.5,
  BTC: 98000,
  ETH: 3200,
  SOL: 180,
};
