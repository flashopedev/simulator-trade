"use client";

import { useState } from "react";
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
      {/* Tabs — real HL: h=42px, lineHeight=41px, 12px, borderBottom 1px solid #303030 */}
      <div className="flex" style={{ borderBottom: "1px solid rgb(48, 48, 48)" }}>
        {(["book", "trades"] as const).map((tab) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="relative cursor-pointer flex items-center"
            style={{
              height: "42px",
              lineHeight: "41px",
              padding: "0 12px",
              fontSize: "12px",
              fontWeight: 400,
              color: activeTab === tab ? "rgb(246, 254, 253)" : "rgb(148, 158, 156)",
            }}
          >
            {tab === "book" ? "Order Book" : "Trades"}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0" style={{ height: "1px", background: "rgb(80, 210, 193)" }} />
            )}
          </div>
        ))}
        {/* Three dots menu on the right */}
        <div className="flex-1" />
        <div className="flex items-center pr-2 cursor-pointer" style={{ color: "rgb(148, 158, 156)", fontSize: "14px" }}>
          ⋮
        </div>
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
