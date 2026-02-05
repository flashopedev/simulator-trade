"use client";

import { useEffect, useRef, useState } from "react";
import { cn, COIN_DECIMALS, TIMEFRAMES, type Timeframe } from "@/lib/utils";
import type { Candle } from "@/lib/hyperliquid";

interface ChartProps {
  candles: Candle[];
  currentPrice: number | null;
  entryPrice?: number | null;
  liquidationPrice?: number | null;
  coin: string;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  isLoading: boolean;
  status: string;
}

export function Chart({
  candles,
  currentPrice,
  entryPrice,
  liquidationPrice,
  coin,
  timeframe,
  onTimeframeChange,
  isLoading,
  status,
}: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null);

  const decimals = COIN_DECIMALS[coin] || 2;

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const { width, height } = dimensions;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const paddingRight = 52;
    const paddingBottom = 16;
    const paddingTop = 6;
    const chartWidth = width - paddingRight;
    const chartHeight = height - paddingBottom - paddingTop;

    // Calculate price range
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    candles.forEach((c) => {
      if (c.l < minPrice) minPrice = c.l;
      if (c.h > maxPrice) maxPrice = c.h;
    });

    // Include position lines in range
    if (entryPrice) {
      minPrice = Math.min(minPrice, entryPrice * 0.98);
      maxPrice = Math.max(maxPrice, entryPrice * 1.02);
    }
    if (liquidationPrice) {
      minPrice = Math.min(minPrice, liquidationPrice * 0.98);
      maxPrice = Math.max(maxPrice, liquidationPrice * 1.02);
    }

    const range = maxPrice - minPrice || 1;
    minPrice -= range * 0.04;
    maxPrice += range * 0.04;
    const priceRange = maxPrice - minPrice;

    const priceToY = (price: number) =>
      paddingTop + ((maxPrice - price) / priceRange) * chartHeight;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = "#0e0f10";
    ctx.lineWidth = 1;
    ctx.font = "9px -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillStyle = "#333";

    for (let i = 0; i <= 7; i++) {
      const price = minPrice + (priceRange / 7) * i;
      const y = priceToY(price);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();
      ctx.fillText(price.toFixed(decimals), width - 3, y + 3);
    }

    // Time labels
    ctx.textAlign = "center";
    const timeStep = Math.max(1, Math.floor(candles.length / 7));
    for (let i = 0; i < candles.length; i += timeStep) {
      const x = (i / candles.length) * chartWidth;
      const date = new Date(candles[i].t);
      ctx.fillText(
        `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`,
        x,
        height - 3
      );
    }

    // Candles
    const gap = chartWidth / candles.length;
    const candleWidth = Math.max(1, gap * 0.7);

    candles.forEach((c, i) => {
      const x = i * gap;
      const isBullish = c.c >= c.o;
      const color = isBullish ? "#22c55e" : "#ef4444";

      // Wick
      ctx.beginPath();
      ctx.moveTo(x + gap / 2, priceToY(c.h));
      ctx.lineTo(x + gap / 2, priceToY(c.l));
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Body
      const top = priceToY(Math.max(c.o, c.c));
      const bottom = priceToY(Math.min(c.o, c.c));
      const bodyHeight = Math.max(bottom - top, 1);

      if (isBullish) {
        ctx.fillStyle = color;
        ctx.fillRect(x + (gap - candleWidth) / 2, top, candleWidth, bodyHeight);
      } else {
        ctx.fillStyle = "#000";
        ctx.fillRect(x + (gap - candleWidth) / 2, top, candleWidth, bodyHeight);
        ctx.strokeStyle = color;
        ctx.strokeRect(x + (gap - candleWidth) / 2, top, candleWidth, bodyHeight);
      }
    });

    // Volume
    let maxVol = 0;
    candles.forEach((c) => {
      if (c.v > maxVol) maxVol = c.v;
    });
    if (maxVol > 0) {
      candles.forEach((c, i) => {
        const x = i * gap;
        const volHeight = (c.v / maxVol) * 30;
        ctx.fillStyle = c.c >= c.o ? "rgba(34,197,94,.06)" : "rgba(239,68,68,.06)";
        ctx.fillRect(
          x + (gap - candleWidth) / 2,
          height - paddingBottom - volHeight,
          candleWidth,
          volHeight
        );
      });
    }

    // Current price line
    if (currentPrice) {
      const y = priceToY(currentPrice);
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.strokeStyle = "rgba(80,210,193,.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Entry line
    if (entryPrice) {
      const y = priceToY(entryPrice);
      ctx.beginPath();
      ctx.setLineDash([4, 2]);
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.strokeStyle = "rgba(160,164,168,.25)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Liquidation line
    if (liquidationPrice) {
      const y = priceToY(liquidationPrice);
      ctx.beginPath();
      ctx.setLineDash([4, 3]);
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.strokeStyle = "rgba(239,68,68,.45)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [candles, dimensions, currentPrice, entryPrice, liquidationPrice, decimals]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setCrosshair({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="flex flex-col border-r border-brd h-full">
      {/* Toolbar */}
      <div className="flex items-center px-2 py-0.5 border-b border-brd min-h-[26px] gap-1">
        <div className="flex gap-px">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={cn(
                "px-2 py-0.5 text-[10px] font-medium rounded transition-colors",
                timeframe === tf ? "text-t1 bg-s4" : "text-t4 hover:text-t2"
              )}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="ml-auto text-[9px] text-t4 flex items-center gap-1">
          <span>{status}</span>
        </div>
      </div>

      {/* Chart area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#020303]">
        <canvas
          ref={canvasRef}
          className="cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCrosshair(null)}
        />

        {/* Price labels */}
        {currentPrice && (
          <div
            className="absolute right-0 px-1.5 py-0.5 text-[10px] font-semibold font-tabular bg-acc text-black rounded-l pointer-events-none z-10"
            style={{
              top: `${Math.max(0, Math.min(dimensions.height - 20, (1 - (currentPrice - (candles.length ? Math.min(...candles.map(c => c.l)) : currentPrice)) / ((candles.length ? Math.max(...candles.map(c => c.h)) - Math.min(...candles.map(c => c.l)) : 1) * 1.08)) * (dimensions.height - 22)))}px`,
            }}
          >
            {currentPrice.toFixed(decimals)}
          </div>
        )}

        {entryPrice && (
          <div
            className="absolute right-0 px-1.5 py-0.5 text-[9px] font-medium font-tabular bg-s5 text-t2 border border-brd rounded-l pointer-events-none z-10"
            style={{ top: "30%" }}
          >
            ENTRY {entryPrice.toFixed(decimals)}
          </div>
        )}

        {liquidationPrice && (
          <div
            className="absolute right-0 px-1.5 py-0.5 text-[9px] font-medium font-tabular bg-red text-white rounded-l pointer-events-none z-10"
            style={{ top: "70%" }}
          >
            LIQ {liquidationPrice.toFixed(decimals)}
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-20">
            <div className="w-6 h-6 border-2 border-brd border-t-acc rounded-full animate-spin" />
            <span className="mt-2 text-[11px] text-t3">Connecting to Hyperliquid...</span>
          </div>
        )}
      </div>
    </div>
  );
}
