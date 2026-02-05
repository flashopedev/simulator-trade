'use client'

import { SUPPORTED_COINS, COIN_ICONS, COIN_DECIMALS, type SupportedCoin, type Timeframe } from '@/lib/utils'

interface CoinSelectorProps {
  coin: SupportedCoin
  price: number
  onCoinChange: (coin: SupportedCoin) => void
  candles: Array<{ o: number; h: number; l: number; c: number }>
}

export function CoinSelector({ coin, price, onCoinChange, candles }: CoinSelectorProps) {
  const dec = COIN_DECIMALS[coin] || 2

  // Calculate 24h stats
  let change = 0
  let high = 0
  let low = Infinity

  if (candles.length > 1) {
    const first = candles[0]
    const last = candles[candles.length - 1]
    change = ((last.c - first.o) / first.o) * 100
    candles.forEach((c) => {
      if (c.h > high) high = c.h
      if (c.l < low) low = c.l
    })
  }

  return (
    <div className="flex items-center min-h-[34px] px-2.5 border-b border-brd gap-3 flex-wrap md:flex-nowrap py-1.5 md:py-0">
      {/* Pair */}
      <div className="flex items-center gap-[5px] order-1">
        <div className="w-[17px] h-[17px] rounded-full bg-gradient-to-br from-acc to-grn flex items-center justify-center text-[8px] font-bold text-black">
          {COIN_ICONS[coin]}
        </div>
        <span className="font-bold text-[13px]">{coin}-USD</span>
        <span className="text-[8px] py-[1px] px-1 bg-s3 text-t4 rounded-[2px] font-semibold">PERP</span>
      </div>

      {/* Coin buttons */}
      <div className="flex gap-0.5 ml-1.5 border-l border-brd pl-2 order-2 md:order-2 max-md:ml-0 max-md:border-0 max-md:pl-0">
        {SUPPORTED_COINS.map((c) => (
          <button
            key={c}
            onClick={() => onCoinChange(c)}
            className={`py-[3px] px-1.5 border text-[10px] font-semibold cursor-pointer rounded-[3px] transition-all duration-100 ${
              c === coin
                ? 'text-acc border-[rgba(80,210,193,0.25)] bg-acc2'
                : 'text-t4 border-transparent hover:text-t2 hover:border-brd bg-transparent'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex gap-3.5 items-center order-3 max-md:w-full max-md:gap-0 max-md:justify-between max-md:pt-1 max-md:border-t max-md:border-brd">
        <div className="flex flex-col max-md:flex-1 max-md:items-center">
          <span className="text-[8px] text-t4 font-medium uppercase tracking-[0.4px] max-md:text-[7px]">Mark</span>
          <span className="text-[11px] font-semibold tabular-nums max-md:text-[10px]">
            {price ? price.toFixed(dec) : '—'}
          </span>
        </div>
        <div className="flex flex-col max-md:flex-1 max-md:items-center">
          <span className="text-[8px] text-t4 font-medium uppercase tracking-[0.4px] max-md:text-[7px]">24h Chg</span>
          <span className={`text-[11px] font-semibold tabular-nums max-md:text-[10px] ${change >= 0 ? 'text-grn' : 'text-red'}`}>
            {candles.length > 1 ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '—'}
          </span>
        </div>
        <div className="flex flex-col max-md:flex-1 max-md:items-center">
          <span className="text-[8px] text-t4 font-medium uppercase tracking-[0.4px] max-md:text-[7px]">24h High</span>
          <span className="text-[11px] font-semibold tabular-nums max-md:text-[10px]">
            {high > 0 ? high.toFixed(dec) : '—'}
          </span>
        </div>
        <div className="flex flex-col max-md:flex-1 max-md:items-center">
          <span className="text-[8px] text-t4 font-medium uppercase tracking-[0.4px] max-md:text-[7px]">24h Low</span>
          <span className="text-[11px] font-semibold tabular-nums max-md:text-[10px]">
            {low < Infinity ? low.toFixed(dec) : '—'}
          </span>
        </div>
        <div className="flex flex-col max-md:flex-1 max-md:items-center">
          <span className="text-[8px] text-t4 font-medium uppercase tracking-[0.4px] max-md:text-[7px]">Funding</span>
          <span className="text-[11px] font-semibold tabular-nums max-md:text-[10px]">—</span>
        </div>
      </div>
    </div>
  )
}
