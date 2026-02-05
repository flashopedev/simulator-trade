'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  HyperliquidWebSocket,
  fetchCandles,
  fetchL2Book,
  generateFakeCandles,
  generateFakeOrderBook,
  type Candle,
} from '@/lib/hyperliquid'
import { FALLBACK_PRICES, COIN_DECIMALS, type SupportedCoin, type Timeframe } from '@/lib/utils'

interface OrderBookRow {
  price: string
  size: string
  total: string
  pct: number
}

interface TradeRow {
  price: string
  size: string
  time: string
  isBuy: boolean
}

export function useMarketData(coin: SupportedCoin, interval: Timeframe) {
  const [candles, setCandles] = useState<Candle[]>([])
  const [price, setPrice] = useState(0)
  const [asks, setAsks] = useState<OrderBookRow[]>([])
  const [bids, setBids] = useState<OrderBookRow[]>([])
  const [trades, setTrades] = useState<TradeRow[]>([])
  const [wsConnected, setWsConnected] = useState(false)
  const [apiOk, setApiOk] = useState(false)
  const [chartStatus, setChartStatus] = useState('Loading...')

  const wsRef = useRef<HyperliquidWebSocket | null>(null)
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const priceRef = useRef(0)
  const candlesRef = useRef<Candle[]>([])
  const apiOkRef = useRef(false)
  const wsConnectedRef = useRef(false)

  // Sync refs
  useEffect(() => { priceRef.current = price }, [price])
  useEffect(() => { candlesRef.current = candles }, [candles])
  useEffect(() => { apiOkRef.current = apiOk }, [apiOk])
  useEffect(() => { wsConnectedRef.current = wsConnected }, [wsConnected])

  const dec = COIN_DECIMALS[coin] || 2

  // Parse L2 data
  const renderL2 = useCallback((data: { levels?: [Array<{ px: string; sz: string }>, Array<{ px: string; sz: string }>] }) => {
    if (!data?.levels) return
    const [rawBids, rawAsks] = data.levels

    let at = 0
    const parsedAsks = (rawAsks || []).slice(0, 8).reverse().map((l) => {
      at += +l.sz
      return {
        price: (+l.px).toFixed(dec),
        size: (+l.sz).toFixed(1),
        total: at.toFixed(0),
        pct: Math.min((+l.sz / (at || 1)) * 100, 55),
      }
    })

    let bt = 0
    const parsedBids = (rawBids || []).slice(0, 8).map((l) => {
      bt += +l.sz
      return {
        price: (+l.px).toFixed(dec),
        size: (+l.sz).toFixed(1),
        total: bt.toFixed(0),
        pct: Math.min((+l.sz / (bt || 1)) * 100, 55),
      }
    })

    setAsks(parsedAsks)
    setBids(parsedBids)
  }, [dec])

  // Handle WS messages
  const handleWSMessage = useCallback((m: Record<string, unknown>) => {
    if (m.channel === 'allMids' && (m.data as Record<string, unknown>)?.mids) {
      const mids = (m.data as Record<string, Record<string, string>>).mids
      const mid = mids[coin]
      if (mid) {
        const p = +mid
        setPrice(p)
      }
    }

    if (m.channel === 'trades' && m.data) {
      const arr = Array.isArray(m.data) ? m.data : [m.data]
      arr.forEach((t: Record<string, string>) => {
        if (t.coin === coin) {
          const now = new Date()
          const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
          setTrades((prev) => {
            const next = [
              { price: (+t.px).toFixed(dec), size: (+t.sz).toFixed(2), time, isBuy: t.side === 'B' },
              ...prev,
            ]
            return next.slice(0, 14)
          })
        }
      })
    }

    if (m.channel === 'l2Book' && m.data) {
      renderL2(m.data as { levels?: [Array<{ px: string; sz: string }>, Array<{ px: string; sz: string }>] })
    }

    if (m.channel === 'candle' && m.data) {
      const cd = m.data as Record<string, string | number>
      const c: Candle = { t: cd.t as number, o: +cd.o, h: +cd.h, l: +cd.l, c: +cd.c, v: +cd.v }
      setCandles((prev) => {
        const next = [...prev]
        if (next.length && next[next.length - 1].t === c.t) {
          next[next.length - 1] = c
        } else {
          next.push(c)
          if (next.length > 300) next.shift()
        }
        return next
      })
    }
  }, [coin, dec, renderL2])

  // Load candles
  const loadData = useCallback(async () => {
    setChartStatus('Loading...')
    try {
      const data = await fetchCandles(coin, interval)
      setCandles(data)
      setApiOk(true)
      if (data.length) setPrice(data[data.length - 1].c)
      setChartStatus(`${data.length} candles loaded`)
    } catch {
      setApiOk(false)
      setChartStatus('API error — using simulated data')
      const fake = generateFakeCandles(coin)
      setCandles(fake)
      if (fake.length) setPrice(fake[fake.length - 1].c)
    }

    try {
      const l2 = await fetchL2Book(coin)
      if (l2) renderL2(l2)
    } catch {
      const p = priceRef.current || FALLBACK_PRICES[coin]
      const fake = generateFakeOrderBook(p, coin)
      setAsks(fake.asks)
      setBids(fake.bids)
    }
  }, [coin, interval, renderL2])

  // Initialize
  useEffect(() => {
    loadData()
  }, [loadData])

  // WebSocket
  useEffect(() => {
    wsRef.current?.disconnect()
    wsRef.current = new HyperliquidWebSocket(
      coin,
      interval,
      handleWSMessage as (data: unknown) => void,
      setWsConnected
    )
    wsRef.current.connect()

    return () => {
      wsRef.current?.disconnect()
    }
  }, [coin, interval, handleWSMessage])

  // Simulation fallback
  useEffect(() => {
    if (simTimerRef.current) clearInterval(simTimerRef.current)
    simTimerRef.current = setInterval(() => {
      if (wsConnectedRef.current && apiOkRef.current) return
      const p = priceRef.current || FALLBACK_PRICES[coin]
      const chg = (Math.random() - 0.49) * p * 0.001
      const newPrice = p + chg

      setPrice(newPrice)
      setCandles((prev) => {
        if (!prev.length) return prev
        const next = [...prev]
        const lc = { ...next[next.length - 1] }
        lc.c = newPrice
        if (newPrice > lc.h) lc.h = newPrice
        if (newPrice < lc.l) lc.l = newPrice
        next[next.length - 1] = lc
        return next
      })

      if (Math.random() < 0.3) {
        const fake = generateFakeOrderBook(newPrice, coin)
        setAsks(fake.asks)
        setBids(fake.bids)
      }

      if (Math.random() < 0.2) {
        const now = new Date()
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
        const isBuy = Math.random() > 0.5
        setTrades((prev) => {
          const next = [
            { price: newPrice.toFixed(dec), size: (Math.random() * 100 + 1).toFixed(2), time, isBuy },
            ...prev,
          ]
          return next.slice(0, 14)
        })
      }
    }, 1500)

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current)
    }
  }, [coin, dec])

  return {
    candles,
    price,
    asks,
    bids,
    trades,
    wsConnected,
    chartStatus,
    reload: loadData,
  }
}
