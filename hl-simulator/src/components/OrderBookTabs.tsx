"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { OrderBook } from "./OrderBook";
import { RecentTrades } from "./RecentTrades";

interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

interface Trade {
  price: number;
  size: number;
  isBuy: boolean;
  time: string;
}

interface OrderBookTabsProps {
  asks: OrderBookLevel[];
  bids: OrderBookLevel[];
  midPrice: number | null;
  trades: Trade[];
  decimals: number;
}

export function OrderBookTabs({
  asks,
  bids,
  midPrice,
  trades,
  decimals,
}: OrderBookTabsProps) {
  const [activeTab, setActiveTab] = useState<"book" | "trades">("book");

  return (
    <div className="flex flex-col border-t border-brd flex-1 min-h-0">
      {/* Tabs */}
      <div className="flex border-b border-brd bg-s1">
        <button
          onClick={() => setActiveTab("book")}
          className={cn(
            "px-3 py-2 text-[11px] font-medium border-b-2 transition-colors",
            activeTab === "book"
              ? "text-t1 border-acc"
              : "text-t3 border-transparent hover:text-t2"
          )}
        >
          Order Book
        </button>
        <button
          onClick={() => setActiveTab("trades")}
          className={cn(
            "px-3 py-2 text-[11px] font-medium border-b-2 transition-colors",
            activeTab === "trades"
              ? "text-t1 border-acc"
              : "text-t3 border-transparent hover:text-t2"
          )}
        >
          Trades
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === "book" ? (
          <OrderBook asks={asks} bids={bids} midPrice={midPrice} decimals={decimals} />
        ) : (
          <RecentTrades trades={trades} decimals={decimals} />
        )}
      </div>
    </div>
  );
}
