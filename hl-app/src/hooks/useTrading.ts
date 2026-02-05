'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Position, TradeHistory } from '@/lib/supabase/types'
import { calculateLiquidationPrice, calculatePnl, type SupportedCoin } from '@/lib/utils'

interface UseTradingProps {
  accountId: string | null
  balance: number
  onBalanceChange: (newBalance: number) => void
  price: number
  coin: SupportedCoin
}

export function useTrading({ accountId, balance, onBalanceChange, price, coin }: UseTradingProps) {
  const [positions, setPositions] = useState<Position[]>([])
  const [history, setHistory] = useState<TradeHistory[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const priceRef = useRef(price)

  useEffect(() => { priceRef.current = price }, [price])

  // Load positions from Supabase
  const loadPositions = useCallback(async () => {
    if (!accountId) return
    const { data } = await supabase
      .from('positions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
    if (data) setPositions(data as Position[])
  }, [accountId, supabase])

  // Load trade history
  const loadHistory = useCallback(async () => {
    if (!accountId) return
    const { data } = await supabase
      .from('trade_history')
      .select('*')
      .eq('account_id', accountId)
      .order('closed_at', { ascending: false })
      .limit(20)
    if (data) setHistory(data as TradeHistory[])
  }, [accountId, supabase])

  useEffect(() => {
    loadPositions()
    loadHistory()
  }, [loadPositions, loadHistory])

  // Place order
  const placeOrder = useCallback(async (params: {
    size: number
    side: 'Long' | 'Short'
    leverage: number
    marginMode: 'cross' | 'isolated'
    orderType: 'market' | 'limit'
    limitPrice?: number
  }) => {
    if (!accountId) return { error: 'Not logged in' }
    if (!priceRef.current) return { error: 'Waiting for price...' }

    setLoading(true)
    const px = params.orderType === 'limit' && params.limitPrice
      ? params.limitPrice
      : priceRef.current

    const notional = params.size * px
    const margin = notional / params.leverage
    const fee = notional * 0.0005

    // Check available margin
    let usedMargin = 0
    positions.forEach((p) => {
      usedMargin += (p.size * p.entry_price) / p.leverage
    })
    const available = Math.max(0, balance - usedMargin)

    if (margin + fee > available) {
      setLoading(false)
      return { error: 'Insufficient margin' }
    }

    const isLong = params.side === 'Long'
    const liqPrice = calculateLiquidationPrice(px, isLong, params.leverage)

    // Deduct fee from balance
    const newBalance = balance - fee
    onBalanceChange(newBalance)

    // Insert position
    const { data, error } = await supabase
      .from('positions')
      .insert({
        account_id: accountId,
        coin,
        side: params.side,
        size: params.size,
        entry_price: px,
        leverage: params.leverage,
        margin_mode: params.marginMode,
        liquidation_price: liqPrice,
        fee,
      })
      .select()
      .single()

    // Insert order history
    await supabase.from('order_history').insert({
      account_id: accountId,
      coin,
      side: params.side,
      order_type: params.orderType,
      size: params.size,
      price: px,
      status: 'filled',
      fee,
    })

    if (data) {
      setPositions((prev) => [data as Position, ...prev])
    }

    setLoading(false)
    return { error: error?.message, data: data as Position | null }
  }, [accountId, balance, coin, onBalanceChange, positions, supabase])

  // Close position
  const closePosition = useCallback(async (positionId: string) => {
    if (!priceRef.current) return { error: 'No price' }

    const pos = positions.find((p) => p.id === positionId)
    if (!pos) return { error: 'Position not found' }

    const pnl = calculatePnl(priceRef.current, pos.entry_price, pos.size, pos.side)
    const fee = pos.size * priceRef.current * 0.0005
    const margin = (pos.size * pos.entry_price) / pos.leverage
    const newBalance = balance + margin + pnl - fee

    onBalanceChange(newBalance)

    // Delete position
    await supabase.from('positions').delete().eq('id', positionId)

    // Insert trade history
    const { data: tradeData } = await supabase.from('trade_history').insert({
      account_id: pos.account_id,
      coin: pos.coin,
      side: pos.side,
      size: pos.size,
      entry_price: pos.entry_price,
      close_price: priceRef.current,
      leverage: pos.leverage,
      pnl,
      fee,
      liquidated: false,
    }).select().single()

    setPositions((prev) => prev.filter((p) => p.id !== positionId))
    if (tradeData) setHistory((prev) => [tradeData as TradeHistory, ...prev].slice(0, 20))

    return { pnl }
  }, [balance, onBalanceChange, positions, supabase])

  // Check liquidations
  const checkLiquidations = useCallback(async () => {
    if (!priceRef.current || !positions.length) return

    const toLiq = positions.filter((p) => {
      if (p.side === 'Long' && priceRef.current <= p.liquidation_price) return true
      if (p.side === 'Short' && priceRef.current >= p.liquidation_price) return true
      return false
    })

    for (const pos of toLiq) {
      const loss = -((pos.size * pos.entry_price) / pos.leverage)

      await supabase.from('positions').delete().eq('id', pos.id)
      await supabase.from('trade_history').insert({
        account_id: pos.account_id,
        coin: pos.coin,
        side: pos.side,
        size: pos.size,
        entry_price: pos.entry_price,
        close_price: pos.liquidation_price,
        leverage: pos.leverage,
        pnl: loss,
        fee: 0,
        liquidated: true,
      })

      setPositions((prev) => prev.filter((p) => p.id !== pos.id))
      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          account_id: pos.account_id,
          coin: pos.coin,
          side: pos.side,
          size: pos.size,
          entry_price: pos.entry_price,
          close_price: pos.liquidation_price,
          leverage: pos.leverage,
          pnl: loss,
          fee: 0,
          liquidated: true,
          closed_at: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 20))
    }

    return toLiq
  }, [positions, supabase])

  // Auto-check liquidations
  useEffect(() => {
    if (!price || !positions.length) return
    const timer = setInterval(() => {
      checkLiquidations()
    }, 5000)
    return () => clearInterval(timer)
  }, [price, positions.length, checkLiquidations])

  return {
    positions,
    history,
    loading,
    placeOrder,
    closePosition,
    checkLiquidations,
    loadPositions,
    loadHistory,
  }
}
