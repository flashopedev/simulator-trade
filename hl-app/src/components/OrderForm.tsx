'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  COIN_DECIMALS,
  calculateLiquidationPrice,
  getAvailableBalance,
  type SupportedCoin,
} from '@/lib/utils'
import type { Position } from '@/lib/supabase/types'

interface OrderFormProps {
  coin: SupportedCoin
  price: number
  balance: number
  positions: Position[]
  onPlaceOrder: (params: {
    size: number
    side: 'Long' | 'Short'
    leverage: number
    marginMode: 'cross' | 'isolated'
    orderType: 'market' | 'limit'
    limitPrice?: number
  }) => Promise<{ error?: string }>
  notify: (msg: string, type: 'ok' | 'err' | 'info') => void
}

export function OrderForm({ coin, price, balance, positions, onPlaceOrder, notify }: OrderFormProps) {
  const [isBuy, setIsBuy] = useState(true)
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [leverage, setLeverage] = useState(10)
  const [marginMode, setMarginMode] = useState<'cross' | 'isolated'>('cross')
  const [size, setSize] = useState('')
  const [limitPrice, setLimitPrice] = useState('')

  const dec = COIN_DECIMALS[coin] || 2
  const sizeNum = parseFloat(size) || 0
  const notional = sizeNum * price
  const fee = notional * 0.0005
  const available = useMemo(
    () => getAvailableBalance(balance, positions.map((p) => ({ size: p.size, entry_price: p.entry_price, leverage: p.leverage }))),
    [balance, positions]
  )

  const estLiq = useMemo(() => {
    if (sizeNum > 0 && price > 0) {
      return calculateLiquidationPrice(price, isBuy, leverage)
    }
    return null
  }, [sizeNum, price, isBuy, leverage])

  const handlePercent = useCallback(
    (pct: number) => {
      if (!price) return
      const maxNotional = available * leverage
      const maxSize = maxNotional / price
      setSize((maxSize * pct / 100).toFixed(2))
    },
    [available, leverage, price]
  )

  const handleSubmit = useCallback(async () => {
    const s = parseFloat(size)
    if (!s || s <= 0) { notify('Enter size', 'err'); return }
    if (!price) { notify('Waiting for price...', 'err'); return }

    const result = await onPlaceOrder({
      size: s,
      side: isBuy ? 'Long' : 'Short',
      leverage,
      marginMode,
      orderType,
      limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : undefined,
    })

    if (result.error) {
      notify(result.error, 'err')
    } else {
      notify(`${isBuy ? 'Long' : 'Short'} ${s} ${coin} @ ${price.toFixed(dec)} | ${leverage}x`, 'ok')
      setSize('')
    }
  }, [size, price, isBuy, leverage, marginMode, orderType, limitPrice, coin, dec, onPlaceOrder, notify])

  return (
    <div className="p-[7px] shrink-0 max-md:p-[10px_8px]">
      {/* Side tabs */}
      <div className="flex bg-s2 rounded p-0.5 mb-1.5 max-md:mb-2">
        <button
          onClick={() => setIsBuy(true)}
          className={`flex-1 py-[5px] border-0 rounded-[3px] font-[inherit] font-bold text-[11px] cursor-pointer transition-all duration-100 max-md:py-2.5 max-md:text-[13px] ${
            isBuy ? 'bg-grn text-black' : 'bg-transparent text-t4'
          }`}
        >
          Long
        </button>
        <button
          onClick={() => setIsBuy(false)}
          className={`flex-1 py-[5px] border-0 rounded-[3px] font-[inherit] font-bold text-[11px] cursor-pointer transition-all duration-100 max-md:py-2.5 max-md:text-[13px] ${
            !isBuy ? 'bg-red text-white' : 'bg-transparent text-t4'
          }`}
        >
          Short
        </button>
      </div>

      {/* Order type */}
      <div className="flex gap-0.5 mb-[5px]">
        {(['market', 'limit'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setOrderType(t)}
            className={`py-0.5 px-1.5 bg-transparent border-0 font-[inherit] text-[10px] font-medium cursor-pointer rounded-[2px] ${
              orderType === t ? 'text-t1 bg-s4' : 'text-t4'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Leverage */}
      <div className="mb-1.5 p-[5px] bg-s1 border border-brd rounded max-md:p-2 max-md:mb-2">
        <div className="flex justify-between items-center mb-[3px]">
          <span className="text-[9px] text-t3 font-medium uppercase tracking-[0.3px]">Leverage</span>
          <span className="text-[12px] font-bold text-acc max-md:text-[14px]">{leverage}x</span>
        </div>
        <input
          type="range"
          min="1"
          max="50"
          value={leverage}
          onChange={(e) => setLeverage(+e.target.value)}
          className="w-full"
        />
        <div className="flex justify-between mt-0.5">
          {[1, 5, 10, 25, 50].map((v) => (
            <span
              key={v}
              onClick={() => setLeverage(v)}
              className="text-[8px] text-t4 cursor-pointer hover:text-acc max-md:text-[10px] max-md:p-[3px]"
            >
              {v}x
            </span>
          ))}
        </div>
        <div className="flex gap-0.5 mt-1">
          <button
            onClick={() => setMarginMode('cross')}
            className={`py-0.5 px-1.5 border font-[inherit] text-[9px] font-semibold cursor-pointer rounded-[2px] transition-all duration-100 ${
              marginMode === 'cross'
                ? 'border-acc text-acc bg-acc2'
                : 'border-brd text-t4 bg-transparent'
            }`}
          >
            Cross
          </button>
          <button
            onClick={() => setMarginMode('isolated')}
            className={`py-0.5 px-1.5 border font-[inherit] text-[9px] font-semibold cursor-pointer rounded-[2px] transition-all duration-100 ${
              marginMode === 'isolated'
                ? 'border-acc text-acc bg-acc2'
                : 'border-brd text-t4 bg-transparent'
            }`}
          >
            Isolated
          </button>
        </div>
      </div>

      {/* Limit price field */}
      {orderType === 'limit' && (
        <div className="mb-1">
          <div className="flex justify-between mb-0.5 text-[9px] text-t4 font-medium">
            <span>Price</span>
          </div>
          <div className="flex items-center bg-s2 border border-brd rounded-[3px] px-1.5 focus-within:border-t4 transition-all duration-100">
            <input
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder="Limit price"
              className="flex-1 bg-transparent border-0 outline-0 text-t1 font-[inherit] text-[11px] font-medium py-[5px] tabular-nums max-md:py-2.5 max-md:text-[14px]"
            />
            <span className="text-[9px] text-t4 font-medium max-md:text-[10px]">USD</span>
          </div>
        </div>
      )}

      {/* Size field */}
      <div className="mb-1">
        <div className="flex justify-between mb-0.5 text-[9px] text-t4 font-medium">
          <span>Size</span>
          <span className="text-t2">≈ ${notional.toFixed(2)}</span>
        </div>
        <div className="flex items-center bg-s2 border border-brd rounded-[3px] px-1.5 focus-within:border-t4 transition-all duration-100">
          <input
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent border-0 outline-0 text-t1 font-[inherit] text-[11px] font-medium py-[5px] tabular-nums max-md:py-2.5 max-md:text-[14px]"
          />
          <span className="text-[9px] text-t4 font-medium max-md:text-[10px]">{coin}</span>
        </div>
      </div>

      {/* Percent buttons */}
      <div className="flex gap-0.5 mb-1.5 max-md:gap-[3px] max-md:mb-2">
        {[25, 50, 75, 100].map((pct) => (
          <button
            key={pct}
            onClick={() => handlePercent(pct)}
            className="flex-1 py-0.5 bg-s2 border border-brd rounded-[2px] text-t4 font-[inherit] text-[9px] font-medium cursor-pointer text-center transition-all duration-100 hover:border-t4 hover:text-t2 max-md:py-1.5 max-md:text-[11px]"
          >
            {pct}%
          </button>
        ))}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        className={`w-full py-2 border-0 rounded font-[inherit] font-bold text-[11px] cursor-pointer transition-all duration-[120ms] tracking-[0.2px] hover:brightness-110 active:scale-[0.99] max-md:py-3.5 max-md:text-[14px] max-md:rounded-[6px] ${
          isBuy ? 'bg-grn text-black' : 'bg-red text-white'
        }`}
      >
        {isBuy ? 'Long' : 'Short'} {coin}-USD
      </button>

      {/* Order info */}
      <div className="flex flex-col gap-0.5 mt-1 text-[9px] text-t4 max-md:text-[10px] max-md:gap-[3px] max-md:mt-1.5">
        <div className="flex justify-between">
          <span>Available</span>
          <span className="text-t2 tabular-nums">{available.toFixed(2)} USDC</span>
        </div>
        <div className="flex justify-between">
          <span>Fee (0.05%)</span>
          <span className="text-t2 tabular-nums">${fee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Est. Liq. Price</span>
          <span className="text-red tabular-nums font-semibold">
            {estLiq ? estLiq.toFixed(dec) : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
