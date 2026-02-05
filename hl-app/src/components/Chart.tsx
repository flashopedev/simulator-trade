'use client'

import { useEffect, useRef, useCallback } from 'react'
import { COIN_DECIMALS, TIMEFRAMES, type SupportedCoin, type Timeframe } from '@/lib/utils'
import type { Candle } from '@/lib/hyperliquid'
import type { Position } from '@/lib/supabase/types'

interface ChartProps {
  candles: Candle[]
  price: number
  coin: SupportedCoin
  interval: Timeframe
  onIntervalChange: (interval: Timeframe) => void
  chartStatus: string
  positions: Position[]
  loading: boolean
}

export function Chart({
  candles,
  price,
  coin,
  interval,
  onIntervalChange,
  chartStatus,
  positions,
  loading,
}: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastLblRef = useRef<HTMLDivElement>(null)
  const liqLblRef = useRef<HTMLDivElement>(null)
  const entryLblRef = useRef<HTMLDivElement>(null)
  const crYRef = useRef<HTMLDivElement>(null)
  const crXRef = useRef<HTMLDivElement>(null)

  const dec = COIN_DECIMALS[coin] || 2

  const drawChart = useCallback(() => {
    const cvs = canvasRef.current
    const cw = containerRef.current
    if (!cvs || !cw || !candles.length) return

    const cx = cvs.getContext('2d')
    if (!cx) return

    const rect = cw.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    cvs.width = rect.width * dpr
    cvs.height = rect.height * dpr
    cvs.style.width = rect.width + 'px'
    cvs.style.height = rect.height + 'px'
    cx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const w = rect.width
    const h = rect.height
    const pR = 52, pB = 16, pT = 6
    const cW = w - pR, cH = h - pB - pT

    let lo = Infinity, hi = -Infinity
    candles.forEach((c) => {
      if (c.l < lo) lo = c.l
      if (c.h > hi) hi = c.h
    })

    // Extend range for position lines
    const coinPositions = positions.filter((p) => p.coin === coin)
    coinPositions.forEach((p) => {
      if (p.liquidation_price < lo) lo = p.liquidation_price * 0.98
      if (p.liquidation_price > hi) hi = p.liquidation_price * 1.02
    })

    const range = hi - lo || 1
    lo -= range * 0.04
    hi += range * 0.04
    const rr = hi - lo

    const p2y = (p: number) => pT + ((hi - p) / rr) * cH

    cx.clearRect(0, 0, w, h)

    // Grid
    for (let i = 0; i <= 7; i++) {
      const pr = lo + (rr / 7) * i
      const y = p2y(pr)
      cx.beginPath()
      cx.moveTo(0, y)
      cx.lineTo(cW, y)
      cx.strokeStyle = '#0e0f10'
      cx.lineWidth = 1
      cx.stroke()
      cx.fillStyle = '#333'
      cx.font = '9px -apple-system'
      cx.textAlign = 'right'
      cx.fillText(pr.toFixed(dec), w - 3, y + 3)
    }

    // Time labels
    const tStep = Math.max(1, Math.floor(candles.length / 7))
    cx.textAlign = 'center'
    cx.fillStyle = '#333'
    for (let i = 0; i < candles.length; i += tStep) {
      const x = (i / candles.length) * cW
      const dt = new Date(candles[i].t)
      cx.fillText(
        `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`,
        x,
        h - 3
      )
    }

    // Candles
    const gap = cW / candles.length
    const bw = Math.max(1, gap * 0.7)
    candles.forEach((c, i) => {
      const x = i * gap
      const bull = c.c >= c.o
      const clr = bull ? '#22c55e' : '#ef4444'

      cx.beginPath()
      cx.moveTo(x + gap / 2, p2y(c.h))
      cx.lineTo(x + gap / 2, p2y(c.l))
      cx.strokeStyle = clr
      cx.lineWidth = 1
      cx.stroke()

      const top = p2y(Math.max(c.o, c.c))
      const bot = p2y(Math.min(c.o, c.c))
      const bh = Math.max(bot - top, 1)

      if (bull) {
        cx.fillStyle = clr
        cx.fillRect(x + (gap - bw) / 2, top, bw, bh)
      } else {
        cx.fillStyle = '#000'
        cx.fillRect(x + (gap - bw) / 2, top, bw, bh)
        cx.strokeStyle = clr
        cx.strokeRect(x + (gap - bw) / 2, top, bw, bh)
      }
    })

    // Volume
    let mxV = 0
    candles.forEach((c) => { if (c.v > mxV) mxV = c.v })
    if (mxV > 0) {
      candles.forEach((c, i) => {
        const x = i * gap
        const vh = (c.v / mxV) * 30
        cx.fillStyle = c.c >= c.o ? 'rgba(34,197,94,.06)' : 'rgba(239,68,68,.06)'
        cx.fillRect(x + (gap - bw) / 2, h - pB - vh, bw, vh)
      })
    }

    // Price line
    if (price) {
      const ly = p2y(price)
      cx.beginPath()
      cx.setLineDash([3, 3])
      cx.moveTo(0, ly)
      cx.lineTo(cW, ly)
      cx.strokeStyle = 'rgba(80,210,193,.3)'
      cx.lineWidth = 1
      cx.stroke()
      cx.setLineDash([])

      if (lastLblRef.current) {
        lastLblRef.current.textContent = price.toFixed(dec)
        lastLblRef.current.style.top = `${ly - 9}px`
        lastLblRef.current.style.display = 'block'
      }
    }

    // Position lines
    let hasPos = false
    coinPositions.forEach((pos) => {
      hasPos = true
      const ey = p2y(pos.entry_price)
      cx.beginPath()
      cx.setLineDash([4, 2])
      cx.moveTo(0, ey)
      cx.lineTo(cW, ey)
      cx.strokeStyle = 'rgba(160,164,168,.25)'
      cx.lineWidth = 1
      cx.stroke()
      cx.setLineDash([])

      if (entryLblRef.current) {
        entryLblRef.current.textContent = `ENTRY ${pos.entry_price.toFixed(dec)}`
        entryLblRef.current.style.top = `${ey - 9}px`
        entryLblRef.current.style.display = 'block'
      }

      const lqy = p2y(pos.liquidation_price)
      cx.beginPath()
      cx.setLineDash([4, 3])
      cx.moveTo(0, lqy)
      cx.lineTo(cW, lqy)
      cx.strokeStyle = 'rgba(239,68,68,.45)'
      cx.lineWidth = 1
      cx.stroke()
      cx.setLineDash([])

      if (liqLblRef.current) {
        liqLblRef.current.textContent = `LIQ ${pos.liquidation_price.toFixed(dec)}`
        liqLblRef.current.style.top = `${lqy - 9}px`
        liqLblRef.current.style.display = 'block'
      }
    })

    if (!hasPos) {
      if (liqLblRef.current) liqLblRef.current.style.display = 'none'
      if (entryLblRef.current) entryLblRef.current.style.display = 'none'
    }
  }, [candles, price, coin, positions, dec])

  useEffect(() => {
    drawChart()
    const handleResize = () => drawChart()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [drawChart])

  // Crosshair
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!candles.length || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const w = rect.width, h = rect.height
      const pR = 52, pB = 16, pT = 6

      let lo = Infinity, hi = -Infinity
      candles.forEach((c) => {
        if (c.l < lo) lo = c.l
        if (c.h > hi) hi = c.h
      })
      const rng = hi - lo || 1
      lo -= rng * 0.04
      hi += rng * 0.04
      const priceAtY = hi - ((y - pT) / (h - pB - pT)) * (hi - lo)

      if (crYRef.current) {
        crYRef.current.style.display = 'block'
        crYRef.current.style.top = `${y - 8}px`
        crYRef.current.textContent = priceAtY.toFixed(dec)
      }
      if (crXRef.current) {
        crXRef.current.style.display = 'block'
        crXRef.current.style.left = `${x}px`
        const idx = Math.floor((x / (w - pR)) * candles.length)
        if (idx >= 0 && idx < candles.length) {
          const d = new Date(candles[idx].t)
          crXRef.current.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        }
      }
    },
    [candles, dec]
  )

  const handleMouseLeave = useCallback(() => {
    if (crYRef.current) crYRef.current.style.display = 'none'
    if (crXRef.current) crXRef.current.style.display = 'none'
  }, [])

  return (
    <div className="flex flex-col border-r border-brd max-md:border-r-0 max-md:h-[50vh] max-md:min-h-[280px] max-md:max-h-[420px] max-md:shrink-0 min-h-0 flex-1 md:flex-auto">
      {/* Timeframe bar */}
      <div className="flex items-center py-[3px] px-2 border-b border-brd min-h-[26px] gap-1">
        <div className="flex gap-[1px]">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => onIntervalChange(tf)}
              className={`py-0.5 px-1.5 border-0 bg-transparent font-[inherit] text-[10px] font-medium cursor-pointer rounded-[2px] transition-all duration-100 max-md:py-[3px] max-md:px-1.5 max-md:text-[10px] ${
                tf === interval
                  ? 'text-t1 bg-s4'
                  : 'text-t4 hover:text-t2'
              }`}
            >
              {tf === '1h' ? '1H' : tf === '4h' ? '4H' : tf === '1d' ? '1D' : tf}
            </button>
          ))}
        </div>
        <div className="ml-auto text-[9px] text-t4 flex items-center gap-[3px]">{chartStatus}</div>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#020303]">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        <div ref={lastLblRef} className="absolute right-0 py-0.5 px-1.5 text-[10px] font-semibold tabular-nums pointer-events-none z-10 rounded-l-[2px] bg-acc text-black" style={{ display: 'none' }} />
        <div ref={liqLblRef} className="absolute right-0 py-0.5 px-1.5 text-[9px] font-semibold tabular-nums pointer-events-none z-10 rounded-l-[2px] bg-red text-white" style={{ display: 'none' }} />
        <div ref={entryLblRef} className="absolute right-0 py-0.5 px-1.5 text-[9px] font-semibold tabular-nums pointer-events-none z-10 rounded-l-[2px] bg-s5 text-t2 border border-brd" style={{ display: 'none' }} />
        <div ref={crYRef} className="absolute right-0 py-[1px] px-[5px] bg-s5 text-t1 text-[9px] tabular-nums pointer-events-none z-[9] rounded-[2px]" style={{ display: 'none' }} />
        <div ref={crXRef} className="absolute bottom-0 py-[1px] px-[5px] bg-s5 text-t1 text-[9px] tabular-nums pointer-events-none z-[9] rounded-[2px] -translate-x-1/2" style={{ display: 'none' }} />

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.7)] z-20 flex-col gap-1.5">
            <div className="w-6 h-6 border-2 border-brd border-t-acc rounded-full animate-[spin_0.7s_linear_infinite]" />
            <span className="text-[11px] text-t3">Connecting to Hyperliquid...</span>
          </div>
        )}
      </div>
    </div>
  )
}
