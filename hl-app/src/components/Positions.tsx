'use client'

import { useState } from 'react'
import { COIN_DECIMALS, calculatePnl, calculateRoe, calculateLiquidationPrice, type SupportedCoin } from '@/lib/utils'
import type { Position, TradeHistory } from '@/lib/supabase/types'

interface PositionsProps {
  positions: Position[]
  history: TradeHistory[]
  price: number
  onClosePosition: (id: string) => void
}

export function Positions({ positions, history, price, onClosePosition }: PositionsProps) {
  const [tab, setTab] = useState<'positions' | 'history'>('positions')

  return (
    <div className="border-t border-brd flex flex-col overflow-hidden max-md:border-t max-md:min-h-auto max-md:shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-brd">
        <button
          onClick={() => setTab('positions')}
          className={`py-1 px-2.5 bg-transparent border-0 border-b-2 font-[inherit] text-[10px] font-medium cursor-pointer transition-all duration-100 ${
            tab === 'positions' ? 'text-t1 border-acc' : 'text-t4 border-transparent hover:text-t2'
          }`}
        >
          Positions ({positions.length})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`py-1 px-2.5 bg-transparent border-0 border-b-2 font-[inherit] text-[10px] font-medium cursor-pointer transition-all duration-100 ${
            tab === 'history' ? 'text-t1 border-acc' : 'text-t4 border-transparent hover:text-t2'
          }`}
        >
          History
        </button>
      </div>

      {/* Positions table */}
      {tab === 'positions' && (
        <div className="flex-1 overflow-y-auto px-2 max-md:px-1.5 max-md:max-h-[200px]">
          <div className="grid grid-cols-[70px_55px_55px_65px_65px_60px_80px_55px_50px] gap-[3px] py-[3px] items-center text-[9px] text-t4 font-medium border-b border-brd sticky top-0 bg-bg max-md:overflow-x-auto max-md:whitespace-nowrap max-lg:grid-cols-[60px_50px_50px_58px_58px_52px_70px_48px_42px] max-lg:gap-0.5 max-lg:text-[9px]">
            <span>Market</span>
            <span>Side</span>
            <span>Size</span>
            <span>Entry</span>
            <span>Mark</span>
            <span>Liq.</span>
            <span>PnL</span>
            <span>ROE</span>
            <span></span>
          </div>
          {positions.length === 0 ? (
            <div className="text-center py-3.5 text-t4 text-[11px] max-md:py-5 max-md:text-[12px]">No open positions</div>
          ) : (
            positions.map((p) => {
              const d = (COIN_DECIMALS[p.coin as SupportedCoin]) || 2
              const pnl = calculatePnl(price, p.entry_price, p.size, p.side)
              const roe = calculateRoe(pnl, p.size, p.entry_price, p.leverage)
              const pnlColor = pnl >= 0 ? 'text-grn' : 'text-red'

              return (
                <div key={p.id} className="grid grid-cols-[70px_55px_55px_65px_65px_60px_80px_55px_50px] gap-[3px] py-[3px] items-center text-[10px] font-medium tabular-nums hover:bg-s2 max-lg:grid-cols-[60px_50px_50px_58px_58px_52px_70px_48px_42px] max-lg:gap-0.5 max-md:overflow-x-auto max-md:whitespace-nowrap max-md:text-[9px]">
                  <span>{p.coin}-USD</span>
                  <span className={`font-bold ${p.side === 'Long' ? 'text-grn' : 'text-red'}`}>
                    {p.leverage}x {p.side}
                  </span>
                  <span>{p.size.toFixed(2)}</span>
                  <span>{p.entry_price.toFixed(d)}</span>
                  <span>{price.toFixed(d)}</span>
                  <span className="text-red">{p.liquidation_price.toFixed(d)}</span>
                  <span className={`${pnlColor} font-semibold`}>
                    {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                  </span>
                  <span className={`${pnlColor} font-semibold`}>
                    {roe >= 0 ? '+' : ''}{roe.toFixed(1)}%
                  </span>
                  <span>
                    <button
                      onClick={() => onClosePosition(p.id)}
                      className="py-0.5 px-[5px] bg-s3 border border-brd rounded-[2px] text-t2 font-[inherit] text-[9px] cursor-pointer font-semibold transition-all duration-100 hover:bg-red2 hover:border-[rgba(239,68,68,0.25)] hover:text-red max-md:py-1 max-md:px-2.5 max-md:text-[10px]"
                    >
                      Close
                    </button>
                  </span>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* History table */}
      {tab === 'history' && (
        <div className="flex-1 overflow-y-auto px-2 max-md:px-1.5 max-md:max-h-[200px]">
          <div className="grid grid-cols-[70px_55px_55px_65px_65px_60px_80px_55px_50px] gap-[3px] py-[3px] items-center text-[9px] text-t4 font-medium border-b border-brd sticky top-0 bg-bg max-lg:grid-cols-[60px_50px_50px_58px_58px_52px_70px_48px_42px] max-lg:gap-0.5">
            <span>Market</span>
            <span>Side</span>
            <span>Size</span>
            <span>Entry</span>
            <span>Close</span>
            <span>Liq.</span>
            <span>PnL</span>
            <span>ROE</span>
            <span>Time</span>
          </div>
          {history.length === 0 ? (
            <div className="text-center py-3.5 text-t4 text-[11px]">No history</div>
          ) : (
            history.map((h) => {
              const d = (COIN_DECIMALS[h.coin as SupportedCoin]) || 2
              const roe = calculateRoe(h.pnl, h.size, h.entry_price, h.leverage)
              const pnlColor = h.pnl >= 0 ? 'text-grn' : 'text-red'
              const closedTime = h.closed_at ? new Date(h.closed_at).toLocaleTimeString() : ''

              return (
                <div key={h.id} className="grid grid-cols-[70px_55px_55px_65px_65px_60px_80px_55px_50px] gap-[3px] py-[3px] items-center text-[10px] font-medium tabular-nums hover:bg-s2 max-lg:grid-cols-[60px_50px_50px_58px_58px_52px_70px_48px_42px] max-lg:gap-0.5">
                  <span>{h.coin}{h.liquidated ? ' \u{1F480}' : ''}</span>
                  <span className={h.side === 'Long' ? 'text-grn' : 'text-red'}>
                    {h.leverage}x {h.side}
                  </span>
                  <span>{h.size.toFixed(2)}</span>
                  <span>{h.entry_price.toFixed(d)}</span>
                  <span>{h.close_price.toFixed(d)}</span>
                  <span className="text-red">{calculateLiquidationPrice(h.entry_price, h.side === 'Long', h.leverage).toFixed(d)}</span>
                  <span className={`${pnlColor} font-semibold`}>
                    {h.pnl >= 0 ? '+' : ''}{h.pnl.toFixed(2)}
                  </span>
                  <span className={pnlColor}>
                    {roe >= 0 ? '+' : ''}{roe.toFixed(1)}%
                  </span>
                  <span className="text-[9px] text-t4">{closedTime}</span>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
