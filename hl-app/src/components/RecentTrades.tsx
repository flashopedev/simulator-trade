'use client'

interface TradeRow {
  price: string
  size: string
  time: string
  isBuy: boolean
}

interface RecentTradesProps {
  trades: TradeRow[]
}

export function RecentTrades({ trades }: RecentTradesProps) {
  return (
    <div className="max-h-[110px] overflow-hidden border-b border-brd shrink-0 max-md:max-h-none max-md:shrink-0">
      <div className="py-1 px-2 text-[10px] font-semibold text-t3">Recent Trades</div>
      <div className="grid grid-cols-3 px-2 pb-0.5 text-[8px] text-t4 font-medium">
        <span>Price</span>
        <span className="text-center">Size</span>
        <span className="text-right">Time</span>
      </div>
      {trades.map((t, i) => (
        <div key={i} className="grid grid-cols-3 py-[1px] px-2 text-[10px] tabular-nums leading-[1.5]">
          <span className={t.isBuy ? 'text-grn' : 'text-red'}>{t.price}</span>
          <span className="text-center text-t2">{t.size}</span>
          <span className="text-right text-t4">{t.time}</span>
        </div>
      ))}
    </div>
  )
}
