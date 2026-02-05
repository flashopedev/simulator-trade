import { FALLBACK_PRICES, COIN_DECIMALS, type SupportedCoin, type Timeframe, TIMEFRAME_MS } from './utils'

const API_URL = 'https://api.hyperliquid.xyz'
const WS_URL = 'wss://api.hyperliquid.xyz/ws'

export interface Candle {
  t: number
  o: number
  h: number
  l: number
  c: number
  v: number
}

export interface L2Level {
  px: string
  sz: string
}

export interface L2Data {
  levels: [L2Level[], L2Level[]]
}

export interface TradeData {
  coin: string
  px: string
  sz: string
  side: string
  time: number
}

// REST API
async function apiPost<T>(body: Record<string, unknown>, timeout = 8000): Promise<T> {
  const ctrl = new AbortController()
  const tm = setTimeout(() => ctrl.abort(), timeout)
  try {
    const r = await fetch(`${API_URL}/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    clearTimeout(tm)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return await r.json()
  } catch (e) {
    clearTimeout(tm)
    throw e
  }
}

export async function fetchCandles(coin: string, interval: Timeframe): Promise<Candle[]> {
  const ms = TIMEFRAME_MS[interval] || 900_000
  const now = Date.now()
  const start = now - ms * 200

  const data = await apiPost<Array<{ t: number; o: string; h: string; l: string; c: string; v: string }>>({
    type: 'candleSnapshot',
    req: { coin, interval, startTime: start, endTime: now },
  })

  return data.map((c) => ({
    t: c.t,
    o: +c.o,
    h: +c.h,
    l: +c.l,
    c: +c.c,
    v: +c.v,
  }))
}

export async function fetchL2Book(coin: string): Promise<L2Data> {
  return apiPost<L2Data>({ type: 'l2Book', coin })
}

// Fallback generators
export function generateFakeCandles(coin: SupportedCoin): Candle[] {
  const base = FALLBACK_PRICES[coin] || 20
  const candles: Candle[] = []
  let p = base

  for (let i = 0; i < 200; i++) {
    const o = p
    const chg = (Math.random() - 0.48) * base * 0.008
    const c = o + chg
    const h = Math.max(o, c) + Math.random() * base * 0.003
    const l = Math.min(o, c) - Math.random() * base * 0.003
    candles.push({
      t: Date.now() - (200 - i) * 900000,
      o, h, l, c,
      v: Math.random() * 1000,
    })
    p = c
  }
  return candles
}

export function generateFakeOrderBook(price: number, coin: SupportedCoin) {
  const d = COIN_DECIMALS[coin] || 2
  const asks: Array<{ price: string; size: string; total: string; pct: number }> = []
  const bids: Array<{ price: string; size: string; total: string; pct: number }> = []

  let at = 0
  let bt = 0

  for (let i = 8; i >= 1; i--) {
    const px = (price + i * price * 0.001 + Math.random() * price * 0.0005).toFixed(d)
    const sz = (Math.random() * 200 + 10).toFixed(0)
    at += +sz
    asks.push({ price: px, size: sz, total: at.toFixed(0), pct: Math.random() * 50 + 5 })
  }

  for (let i = 1; i <= 8; i++) {
    const px = (price - i * price * 0.001 - Math.random() * price * 0.0005).toFixed(d)
    const sz = (Math.random() * 200 + 10).toFixed(0)
    bt += +sz
    bids.push({ price: px, size: sz, total: bt.toFixed(0), pct: Math.random() * 50 + 5 })
  }

  return { asks, bids }
}

// WebSocket
type WSCallback = (data: unknown) => void

export class HyperliquidWebSocket {
  private ws: WebSocket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private coin: string
  private interval: Timeframe
  private onMessage: WSCallback
  private onStatusChange: (connected: boolean) => void

  constructor(
    coin: string,
    interval: Timeframe,
    onMessage: WSCallback,
    onStatusChange: (connected: boolean) => void
  ) {
    this.coin = coin
    this.interval = interval
    this.onMessage = onMessage
    this.onStatusChange = onStatusChange
  }

  connect() {
    try {
      this.ws = new WebSocket(WS_URL)

      this.ws.onopen = () => {
        this.onStatusChange(true)
        this.subscribe()
      }

      this.ws.onmessage = (e) => {
        try {
          const m = JSON.parse(e.data)
          this.onMessage(m)
        } catch { /* ignore parse errors */ }
      }

      this.ws.onclose = () => {
        this.onStatusChange(false)
        this.reconnectTimer = setTimeout(() => this.connect(), 4000)
      }

      this.ws.onerror = () => {
        this.ws?.close()
      }
    } catch {
      this.reconnectTimer = setTimeout(() => this.connect(), 4000)
    }
  }

  private subscribe() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    const send = (msg: Record<string, unknown>) => this.ws!.send(JSON.stringify(msg))

    send({ method: 'subscribe', subscription: { type: 'allMids' } })
    send({ method: 'subscribe', subscription: { type: 'trades', coin: this.coin } })
    send({ method: 'subscribe', subscription: { type: 'l2Book', coin: this.coin } })
    send({ method: 'subscribe', subscription: { type: 'candle', coin: this.coin, interval: this.interval } })
  }

  updateSubscription(coin: string, interval: Timeframe) {
    this.coin = coin
    this.interval = interval
    this.subscribe()
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
    }
    this.ws = null
  }
}
