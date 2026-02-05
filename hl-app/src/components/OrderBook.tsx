'use client'

interface OrderBookRow {
  price: string
  size: string
  total: string
  pct: number
}

interface OrderBookProps {
  asks: OrderBookRow[]
  bids: OrderBookRow[]
  midPrice: string
  midUsd: string
}

export function OrderBook({ asks, bids, midPrice, midUsd }: OrderBookProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden border-b border-brd min-h-0 max-md:flex-none max-md:max-h-none max-md:min-h-0">
      <div className="py-1 px-2 text-[10px] font-semibold text-t3">Order Book</div>
      <div className="grid grid-cols-3 px-2 pb-0.5 text-[8px] text-t4 font-medium uppercase tracking-[0.3px]">
        <span>Price</span>
        <span className="text-center">Size</span>
        <span className="text-right">Total</span>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col max-md:max-h-[200px]">
        {/* Asks */}
        <div className="flex-1 flex flex-col justify-end overflow-hidden max-md:max-h-[80px]">
          {asks.map((row, i) => (
            <div key={`a-${i}`} className="grid grid-cols-3 py-[1px] px-2 text-[10px] relative font-medium leading-[1.55] tabular-nums max-md:py-0.5">
              <span className="text-red">{row.price}</span>
              <span className="text-center text-t2">{row.size}</span>
              <span className="text-right text-t4">{row.total}</span>
              <div className="absolute right-0 top-0 bottom-0 opacity-[0.04] pointer-events-none bg-red" style={{ width: `${row.pct}%` }} />
            </div>
          ))}
        </div>

        {/* Mid price */}
        <div className="py-[3px] px-2 flex items-center gap-1 border-t border-b border-brd bg-s1">
          <span className="text-[13px] font-bold tabular-nums">{midPrice}</span>
          <span className="text-[9px] text-t4">{midUsd}</span>
        </div>

        {/* Bids */}
        <div className="flex-1 flex flex-col overflow-hidden max-md:max-h-[80px]">
          {bids.map((row, i) => (
            <div key={`b-${i}`} className="grid grid-cols-3 py-[1px] px-2 text-[10px] relative font-medium leading-[1.55] tabular-nums max-md:py-0.5">
              <span className="text-grn">{row.price}</span>
              <span className="text-center text-t2">{row.size}</span>
              <span className="text-right text-t4">{row.total}</span>
              <div className="absolute right-0 top-0 bottom-0 opacity-[0.04] pointer-events-none bg-grn" style={{ width: `${row.pct}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
