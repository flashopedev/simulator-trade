"use client";

import { cn, formatNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AccountEquityProps {
  totalEquity: number;
  availableBalance: number;
  marginUsed: number;
  unrealizedPnl: number;
  marginRatio: number;
}

export function AccountEquity({
  totalEquity,
  availableBalance,
  marginUsed,
  unrealizedPnl,
  marginRatio,
}: AccountEquityProps) {
  const isPnlPositive = unrealizedPnl >= 0;

  return (
    <div className="bg-s1 border-b border-brd p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] font-semibold text-t1 uppercase tracking-wide">Account</h3>
        <span className="text-[10px] text-t4">Cross Margin</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Total Equity */}
        <div className="bg-s2 rounded p-2.5">
          <div className="text-[9px] text-t4 uppercase tracking-wide mb-1">Total Equity</div>
          <div className="text-[16px] font-bold text-t1 font-tabular">
            ${formatNumber(totalEquity)}
          </div>
        </div>

        {/* Unrealized PnL */}
        <div className="bg-s2 rounded p-2.5">
          <div className="text-[9px] text-t4 uppercase tracking-wide mb-1">Unrealized PnL</div>
          <div className={cn(
            "flex items-center gap-1 text-[16px] font-bold font-tabular",
            isPnlPositive ? "text-grn" : "text-red"
          )}>
            {isPnlPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{isPnlPositive ? "+" : ""}{formatNumber(unrealizedPnl)}</span>
          </div>
        </div>

        {/* Available Balance */}
        <div>
          <div className="text-[9px] text-t4 uppercase tracking-wide mb-0.5">Available</div>
          <div className="text-[13px] font-medium text-t2 font-tabular">
            ${formatNumber(availableBalance)}
          </div>
        </div>

        {/* Margin Used */}
        <div>
          <div className="text-[9px] text-t4 uppercase tracking-wide mb-0.5">Margin Used</div>
          <div className="text-[13px] font-medium text-t2 font-tabular">
            ${formatNumber(marginUsed)}
          </div>
        </div>

        {/* Margin Ratio */}
        <div className="col-span-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] text-t4 uppercase tracking-wide">Margin Ratio</span>
            <span className={cn(
              "text-[11px] font-semibold font-tabular",
              marginRatio > 80 ? "text-red" : marginRatio > 50 ? "text-yellow-500" : "text-grn"
            )}>
              {marginRatio.toFixed(2)}%
            </span>
          </div>
          <div className="h-1.5 bg-s3 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                marginRatio > 80 ? "bg-red" : marginRatio > 50 ? "bg-yellow-500" : "bg-grn"
              )}
              style={{ width: `${Math.min(marginRatio, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
