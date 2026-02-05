"use client";

import { useState } from "react";
import { cn, formatNumber, formatPnl, calculatePnl, calculateRoe, COIN_DECIMALS } from "@/lib/utils";
import type { Position, TradeHistory } from "@/lib/supabase/types";

interface PositionWithPnl extends Position {
  pnl: number;
  roe: number;
}

interface PositionsProps {
  positions: Position[];
  history: TradeHistory[];
  currentPrices: Record<string, number>;
  onClosePosition: (position: Position) => void;
}

export function Positions({
  positions,
  history,
  currentPrices,
  onClosePosition,
}: PositionsProps) {
  const [tab, setTab] = useState<"positions" | "history">("positions");

  const positionsWithPnl: PositionWithPnl[] = positions.map((p) => {
    const currentPrice = currentPrices[p.coin] || p.entry_price;
    const pnl = calculatePnl(p.entry_price, currentPrice, p.size, p.side === "Long");
    const roe = calculateRoe(pnl, p.entry_price, p.size, p.leverage);
    return { ...p, pnl, roe };
  });

  return (
    <div className="border-t border-brd flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-brd">
        <button
          onClick={() => setTab("positions")}
          className={cn(
            "px-2.5 py-1 text-[10px] font-medium border-b-2 transition-colors",
            tab === "positions"
              ? "text-t1 border-acc"
              : "text-t4 border-transparent hover:text-t2"
          )}
        >
          Positions ({positions.length})
        </button>
        <button
          onClick={() => setTab("history")}
          className={cn(
            "px-2.5 py-1 text-[10px] font-medium border-b-2 transition-colors",
            tab === "history"
              ? "text-t1 border-acc"
              : "text-t4 border-transparent hover:text-t2"
          )}
        >
          History
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-2">
        {tab === "positions" ? (
          <PositionsTable
            positions={positionsWithPnl}
            currentPrices={currentPrices}
            onClose={onClosePosition}
          />
        ) : (
          <HistoryTable history={history} />
        )}
      </div>
    </div>
  );
}

function PositionsTable({
  positions,
  currentPrices,
  onClose,
}: {
  positions: PositionWithPnl[];
  currentPrices: Record<string, number>;
  onClose: (p: Position) => void;
}) {
  if (positions.length === 0) {
    return (
      <div className="text-center py-4 text-t4 text-[11px]">
        No open positions
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Header */}
      <div className="grid grid-cols-[70px_55px_55px_65px_65px_60px_80px_55px_50px] gap-1 py-1 text-[9px] text-t4 font-medium border-b border-brd sticky top-0 bg-bg min-w-[600px]">
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

      {/* Rows */}
      {positions.map((p) => {
        const decimals = COIN_DECIMALS[p.coin] || 2;
        const markPrice = currentPrices[p.coin] || p.entry_price;

        return (
          <div
            key={p.id}
            className="grid grid-cols-[70px_55px_55px_65px_65px_60px_80px_55px_50px] gap-1 py-1 text-[10px] font-medium hover:bg-s2 min-w-[600px]"
          >
            <span>{p.coin}-USD</span>
            <span
              className={cn(
                "font-bold",
                p.side === "Long" ? "text-grn" : "text-red"
              )}
            >
              {p.leverage}x {p.side}
            </span>
            <span className="font-tabular">{p.size.toFixed(2)}</span>
            <span className="font-tabular">{p.entry_price.toFixed(decimals)}</span>
            <span className="font-tabular">{markPrice.toFixed(decimals)}</span>
            <span className="text-red font-tabular">
              {p.liquidation_price.toFixed(decimals)}
            </span>
            <span
              className={cn("font-semibold font-tabular", p.pnl >= 0 ? "text-grn" : "text-red")}
            >
              {formatPnl(p.pnl)}
            </span>
            <span
              className={cn("font-tabular", p.roe >= 0 ? "text-grn" : "text-red")}
            >
              {p.roe >= 0 ? "+" : ""}
              {p.roe.toFixed(1)}%
            </span>
            <button
              onClick={() => onClose(p)}
              className="px-1.5 py-0.5 bg-s3 border border-brd rounded text-[9px] text-t2 font-semibold hover:bg-red/10 hover:border-red/25 hover:text-red transition-colors"
            >
              Close
            </button>
          </div>
        );
      })}
    </div>
  );
}

function HistoryTable({ history }: { history: TradeHistory[] }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-4 text-t4 text-[11px]">No history</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Header */}
      <div className="grid grid-cols-[70px_55px_55px_65px_65px_60px_80px_55px_70px] gap-1 py-1 text-[9px] text-t4 font-medium border-b border-brd sticky top-0 bg-bg min-w-[600px]">
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

      {/* Rows */}
      {history.slice(0, 50).map((h) => {
        const decimals = COIN_DECIMALS[h.coin] || 2;
        const roe = calculateRoe(h.pnl, h.entry_price, h.size, h.leverage);

        return (
          <div
            key={h.id}
            className="grid grid-cols-[70px_55px_55px_65px_65px_60px_80px_55px_70px] gap-1 py-1 text-[10px] font-medium min-w-[600px]"
          >
            <span>
              {h.coin}
              {h.liquidated ? " 💀" : ""}
            </span>
            <span className={h.side === "Long" ? "text-grn" : "text-red"}>
              {h.leverage}x {h.side}
            </span>
            <span className="font-tabular">{h.size.toFixed(2)}</span>
            <span className="font-tabular">{h.entry_price.toFixed(decimals)}</span>
            <span className="font-tabular">{h.exit_price.toFixed(decimals)}</span>
            <span className="text-red font-tabular">—</span>
            <span
              className={cn("font-semibold font-tabular", h.pnl >= 0 ? "text-grn" : "text-red")}
            >
              {formatPnl(h.pnl)}
            </span>
            <span className={cn("font-tabular", roe >= 0 ? "text-grn" : "text-red")}>
              {roe >= 0 ? "+" : ""}
              {roe.toFixed(1)}%
            </span>
            <span className="text-[9px] text-t4">
              {new Date(h.closed_at).toLocaleTimeString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
