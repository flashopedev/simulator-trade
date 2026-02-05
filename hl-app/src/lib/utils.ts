import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Coin configuration
export const SUPPORTED_COINS = ['HYPE', 'BTC', 'ETH', 'SOL'] as const
export type SupportedCoin = (typeof SUPPORTED_COINS)[number]

export const COIN_ICONS: Record<SupportedCoin, string> = {
  HYPE: 'H',
  BTC: '₿',
  ETH: 'Ξ',
  SOL: 'S',
}

export const COIN_DECIMALS: Record<SupportedCoin, number> = {
  HYPE: 2,
  BTC: 1,
  ETH: 2,
  SOL: 3,
}

export const FALLBACK_PRICES: Record<SupportedCoin, number> = {
  HYPE: 21.5,
  BTC: 98000,
  ETH: 3200,
  SOL: 180,
}

export const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'] as const
export type Timeframe = (typeof TIMEFRAMES)[number]

export const TIMEFRAME_MS: Record<Timeframe, number> = {
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '1h': 3_600_000,
  '4h': 14_400_000,
  '1d': 86_400_000,
}

// Formatting
export function formatNumber(value: number, decimals: number): string {
  return value.toFixed(decimals)
}

export function formatPnl(pnl: number): string {
  const prefix = pnl >= 0 ? '+' : ''
  return `${prefix}${pnl.toFixed(2)}`
}

export function formatPercent(value: number): string {
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}${value.toFixed(1)}%`
}

// Trading calculations (from index.html lines 597-600)
export function calculateLiquidationPrice(
  entry: number,
  isLong: boolean,
  leverage: number
): number {
  return isLong
    ? entry * (1 - 0.95 / leverage)
    : entry * (1 + 0.95 / leverage)
}

export function calculatePnl(
  currentPrice: number,
  entryPrice: number,
  size: number,
  side: 'Long' | 'Short'
): number {
  const diff = currentPrice - entryPrice
  return side === 'Long' ? diff * size : -diff * size
}

export function calculateRoe(
  pnl: number,
  size: number,
  entryPrice: number,
  leverage: number
): number {
  const margin = (size * entryPrice) / leverage
  if (margin === 0) return 0
  return (pnl / margin) * 100
}

export function getAvailableBalance(
  balance: number,
  positions: { size: number; entry_price: number; leverage: number }[]
): number {
  let usedMargin = 0
  positions.forEach((p) => {
    usedMargin += (p.size * p.entry_price) / p.leverage
  })
  return Math.max(0, balance - usedMargin)
}

export function getTotalEquity(
  balance: number,
  positions: { size: number; entry_price: number; leverage: number; side: 'Long' | 'Short' }[],
  currentPrice: number
): number {
  let equity = balance
  positions.forEach((p) => {
    const margin = (p.size * p.entry_price) / p.leverage
    const pnl = calculatePnl(currentPrice, p.entry_price, p.size, p.side)
    equity += margin + pnl
  })
  return equity
}
