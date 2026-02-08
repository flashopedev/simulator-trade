"use client";

import { useState } from "react";
import { cn, formatPnl, formatNumber, calculatePnl, calculateRoe, COIN_DECIMALS } from "@/lib/utils";
import type { Position, TradeHistory, OrderHistory } from "@/lib/supabase/types";
import { ChevronDown } from "lucide-react";
import { MarketCloseModal } from "./MarketCloseModal";

type BottomTab =
  | "balances"
  | "positions"
  | "orders"
  | "twap"
  | "history"
  | "funding"
  | "order-history";

interface BottomTabsPanelProps {
  positions: Position[];
  history: TradeHistory[];
  orders: OrderHistory[];
  currentPrices: Record<string, number>;
  balance: number;
  onClosePosition: (position: Position, size?: number) => void;
  onCancelOrder?: (orderId: string) => void;
}

export function BottomTabsPanel({
  positions,
  history,
  orders,
  currentPrices,
  balance,
  onClosePosition,
  onCancelOrder,
}: BottomTabsPanelProps) {
  const [activeTab, setActiveTab] = useState<BottomTab>("balances");
  const [closeModal, setCloseModal] = useState<Position | null>(null);
  const [hideSmallBalances, setHideSmallBalances] = useState(false);

  const tabs: { key: BottomTab; label: string; count?: number; disabled?: boolean }[] = [
    { key: "balances", label: "Balances" },
    { key: "positions", label: "Positions", count: positions.length },
    { key: "orders", label: "Open Orders", count: orders?.filter(o => o.status === "pending").length || 0 },
    { key: "twap", label: "TWAP", disabled: true },
    { key: "history", label: "Trade History" },
    { key: "funding", label: "Funding History", disabled: true },
    { key: "order-history", label: "Order History" },
  ];

  const handleMarketClose = (p: Position) => {
    // Check if we should skip confirmation
    const skipConfirm = localStorage.getItem("skipCloseConfirm") === "true";
    if (skipConfirm) {
      onClosePosition(p);
    } else {
      setCloseModal(p);
    }
  };

  const handleConfirmClose = (size: number) => {
    if (!closeModal) return;
    onClosePosition(closeModal, size);
    setCloseModal(null);
  };

  return (
    <div className="h-full flex flex-col bg-s1 border-t border-brd">
      {/* Tabs row - compact like HL */}
      <div className="flex items-center justify-between px-2 border-b border-brd flex-shrink-0">
        <div className="flex items-center overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && setActiveTab(tab.key)}
              disabled={tab.disabled}
              className={cn(
                "px-2 py-1.5 text-[12px] font-normal border-b-2 whitespace-nowrap transition-colors",
                tab.disabled
                  ? "text-t4 border-transparent cursor-default"
                  : activeTab === tab.key
                    ? "text-t1 border-acc"
                    : "text-t3 border-transparent hover:text-t2"
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && !tab.disabled && (
                <span className="ml-1 text-[10px] text-acc">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <button className="flex items-center gap-1 text-[12px] text-t2 hover:text-t1">
            Filter
            <ChevronDown className="w-3 h-3" />
          </button>
          <label className="flex items-center gap-1 text-[12px] text-t2 cursor-pointer">
            <input
              type="checkbox"
              checked={hideSmallBalances}
              onChange={(e) => setHideSmallBalances(e.target.checked)}
              className="w-3 h-3 rounded border-brd"
            />
            Hide Small Balances
          </label>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "balances" && (
          <BalancesContent balance={balance} hideSmall={hideSmallBalances} />
        )}
        {activeTab === "positions" && (
          <PositionsContent
            positions={positions}
            currentPrices={currentPrices}
            onMarketClose={handleMarketClose}
          />
        )}
        {activeTab === "orders" && (
          <OrdersContent orders={orders} onCancelOrder={onCancelOrder} />
        )}
        {activeTab === "history" && (
          <HistoryContent history={history} />
        )}
        {activeTab === "order-history" && (
          <OrderHistoryContent orders={orders} />
        )}
        {(activeTab === "twap" || activeTab === "funding") && (
          <DisabledTabContent tabName={tabs.find(t => t.key === activeTab)?.label || ""} />
        )}
      </div>

      {/* Market Close Modal */}
      <MarketCloseModal
        isOpen={!!closeModal}
        onClose={() => setCloseModal(null)}
        onConfirm={handleConfirmClose}
        position={closeModal}
        currentPrice={closeModal ? (currentPrices[closeModal.coin] || closeModal.entry_price) : 0}
      />
    </div>
  );
}

/* --- Sub-components --- */

function DisabledTabContent({ tabName }: { tabName: string }) {
  return (
    <div className="text-center py-8 text-t3 text-[12px]">
      {tabName} - Coming soon (simulation mode)
    </div>
  );
}

function BalancesContent({ balance, hideSmall }: { balance: number; hideSmall: boolean }) {
  if (hideSmall && balance < 1) {
    return (
      <div className="text-center py-8 text-t3 text-[12px]">No balances to show</div>
    );
  }

  return (
    <div className="px-3">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="text-t3 text-left">
            <th className="py-2 font-normal">Coin</th>
            <th className="py-2 font-normal">Total Balance</th>
            <th className="py-2 font-normal">Available Balance</th>
            <th className="py-2 font-normal">USDC Value</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-brd">
            <td className="py-2 font-normal">USDC</td>
            <td className="py-2 font-tabular">{formatNumber(balance)}</td>
            <td className="py-2 font-tabular">{formatNumber(balance)}</td>
            <td className="py-2 font-tabular">${formatNumber(balance)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PositionsContent({
  positions,
  currentPrices,
  onMarketClose,
}: {
  positions: Position[];
  currentPrices: Record<string, number>;
  onMarketClose: (p: Position) => void;
}) {
  return (
    <div className="px-3 overflow-x-auto">
      <table className="w-full text-[12px] min-w-[900px]">
        <thead>
          <tr className="text-t3 text-left">
            <th className="py-2 font-normal">Coin</th>
            <th className="py-2 font-normal">Size</th>
            <th className="py-2 font-normal">Position Value</th>
            <th className="py-2 font-normal">Entry Price</th>
            <th className="py-2 font-normal">Mark Price</th>
            <th className="py-2 font-normal">PNL (ROE %)</th>
            <th className="py-2 font-normal">Liq. Price</th>
            <th className="py-2 font-normal">Margin</th>
            <th className="py-2 font-normal">Funding</th>
            <th className="py-2 font-normal">Close All</th>
            <th className="py-2 font-normal">TP/SL</th>
          </tr>
        </thead>
        <tbody>
          {positions.length === 0 && (
            <tr>
              <td colSpan={11} className="py-6 text-center text-t3">
                No open positions yet
              </td>
            </tr>
          )}
          {positions.map((p) => {
            const decimals = COIN_DECIMALS[p.coin] || 2;
            const markPrice = currentPrices[p.coin] || p.entry_price;
            const pnl = calculatePnl(p.entry_price, markPrice, p.size, p.side === "Long");
            const roe = calculateRoe(pnl, p.entry_price, p.size, p.leverage);
            const margin = (p.size * p.entry_price) / p.leverage;
            const posValue = p.size * markPrice;
            const isLong = p.side === "Long";

            return (
              <tr key={`${p.id}-${markPrice.toFixed(decimals)}`} className="border-t border-brd hover:bg-s2 pnl-row">
                {/* Coin with leverage badge like real HL */}
                <td className="py-2 font-normal">
                  <span className={cn(isLong ? "text-acc" : "text-red")}>
                    {p.coin}
                  </span>
                  <span className="ml-1.5 text-[10px] text-t3">{p.leverage}x</span>
                </td>
                {/* Size - colored based on side */}
                <td className={cn("py-2 font-tabular", isLong ? "text-acc" : "text-red")}>
                  {p.size.toFixed(5)} {p.coin}
                </td>
                {/* Position Value */}
                <td className="py-2 font-tabular">{formatNumber(posValue)} USDC</td>
                {/* Entry Price */}
                <td className="py-2 font-tabular">{formatNumber(p.entry_price)}</td>
                {/* Mark Price */}
                <td className="py-2 font-tabular">{formatNumber(markPrice)}</td>
                {/* PNL (ROE %) */}
                <td className={cn("py-2 font-normal font-tabular", pnl >= 0 ? "text-acc" : "text-red")}>
                  {formatPnl(pnl)} ({roe >= 0 ? "+" : ""}{roe.toFixed(1)}%)
                </td>
                {/* Liquidation Price */}
                <td className="py-2 font-tabular text-t2">
                  {p.liquidation_price ? formatNumber(p.liquidation_price) : "N/A"}
                </td>
                {/* Margin */}
                <td className="py-2 font-tabular">
                  ${formatNumber(margin)} <span className="text-t4">(Cross)</span>
                </td>
                {/* Funding */}
                <td className="py-2 font-tabular text-t3">$0.00</td>
                {/* Close All - buttons like real HL */}
                <td className="py-2">
                  <div className="flex items-center gap-1">
                    <button
                      className="px-1.5 py-0.5 text-[12px] font-normal text-acc hover:underline transition-colors"
                    >
                      Limit
                    </button>
                    <button
                      onClick={() => onMarketClose(p)}
                      className="px-1.5 py-0.5 text-[12px] font-normal text-acc hover:underline transition-colors"
                    >
                      Market
                    </button>
                    <button
                      className="px-1.5 py-0.5 text-[12px] font-normal text-acc hover:underline transition-colors"
                    >
                      Reverse
                    </button>
                  </div>
                </td>
                {/* TP/SL */}
                <td className="py-2 text-t4 text-[12px]">-- / --</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OrdersContent({ orders, onCancelOrder }: { orders: OrderHistory[]; onCancelOrder?: (id: string) => void }) {
  const pendingOrders = orders?.filter(o => o.status === "pending") || [];

  if (pendingOrders.length === 0) {
    return (
      <div className="text-center py-8 text-t3 text-[12px]">No open orders yet</div>
    );
  }

  return (
    <div className="px-3 overflow-x-auto">
      <table className="w-full text-[12px] min-w-[900px]">
        <thead>
          <tr className="text-t3 text-left">
            <th className="py-2 font-normal">Time</th>
            <th className="py-2 font-normal">Type</th>
            <th className="py-2 font-normal">Coin</th>
            <th className="py-2 font-normal">Direction</th>
            <th className="py-2 font-normal">Size</th>
            <th className="py-2 font-normal">Original Size</th>
            <th className="py-2 font-normal">Order Value</th>
            <th className="py-2 font-normal">Price</th>
            <th className="py-2 font-normal">Reduce Only</th>
            <th className="py-2 font-normal">Trigger Conditions</th>
            <th className="py-2 font-normal">Cancel All</th>
          </tr>
        </thead>
        <tbody>
          {pendingOrders.map((o) => {
            const orderValue = o.size * o.price;
            return (
              <tr key={o.id} className="border-t border-brd hover:bg-s2">
                <td className="py-2 text-t3">
                  {new Date(o.created_at).toLocaleDateString()} - {new Date(o.created_at).toLocaleTimeString()}
                </td>
                <td className="py-2 capitalize">{o.order_type}</td>
                <td className="py-2 font-normal">{o.coin}</td>
                <td className={cn("py-2", o.side === "Long" ? "text-acc" : "text-red")}>{o.side}</td>
                <td className="py-2 font-tabular">{o.size.toFixed(5)}</td>
                <td className="py-2 font-tabular">{o.size.toFixed(5)}</td>
                <td className="py-2 font-tabular">{formatNumber(orderValue)} USDC</td>
                <td className="py-2 font-tabular">{formatNumber(o.price)}</td>
                <td className="py-2 text-t3">No</td>
                <td className="py-2 text-t3">N/A</td>
                <td className="py-2">
                  <button
                    onClick={() => onCancelOrder?.(o.id)}
                    className="text-[12px] font-normal text-red hover:underline"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function HistoryContent({ history }: { history: TradeHistory[] }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-t3 text-[12px]">No trade history</div>
    );
  }

  return (
    <div className="px-3 overflow-x-auto">
      <table className="w-full text-[12px] min-w-[700px]">
        <thead>
          <tr className="text-t3 text-left">
            <th className="py-2 font-normal">Time</th>
            <th className="py-2 font-normal">Coin</th>
            <th className="py-2 font-normal">Side</th>
            <th className="py-2 font-normal">Size</th>
            <th className="py-2 font-normal">Entry</th>
            <th className="py-2 font-normal">Exit</th>
            <th className="py-2 font-normal">PNL (ROE %)</th>
          </tr>
        </thead>
        <tbody>
          {history.slice(0, 50).map((h) => {
            const decimals = COIN_DECIMALS[h.coin] || 2;
            const roe = calculateRoe(h.pnl, h.entry_price, h.size, h.leverage);

            return (
              <tr key={h.id} className="border-t border-brd hover:bg-s2">
                <td className="py-2 text-t3">{new Date(h.closed_at).toLocaleTimeString()}</td>
                <td className="py-2 font-normal">
                  {h.coin}{h.liquidated ? " 💀" : ""}
                </td>
                <td className={cn("py-2", h.side === "Long" ? "text-acc" : "text-red")}>
                  {h.leverage}x {h.side}
                </td>
                <td className="py-2 font-tabular">{h.size.toFixed(5)}</td>
                <td className="py-2 font-tabular">{h.entry_price.toFixed(decimals)}</td>
                <td className="py-2 font-tabular">{h.exit_price.toFixed(decimals)}</td>
                <td className={cn("py-2 font-normal font-tabular", h.pnl >= 0 ? "text-acc" : "text-red")}>
                  {formatPnl(h.pnl)} ({roe >= 0 ? "+" : ""}{roe.toFixed(1)}%)
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OrderHistoryContent({ orders }: { orders: OrderHistory[] }) {
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8 text-t3 text-[12px]">No order history</div>
    );
  }

  return (
    <div className="px-3 overflow-x-auto">
      <table className="w-full text-[12px] min-w-[700px]">
        <thead>
          <tr className="text-t3 text-left">
            <th className="py-2 font-normal">Time</th>
            <th className="py-2 font-normal">Type</th>
            <th className="py-2 font-normal">Coin</th>
            <th className="py-2 font-normal">Direction</th>
            <th className="py-2 font-normal">Size</th>
            <th className="py-2 font-normal">Price</th>
            <th className="py-2 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.slice(0, 50).map((o) => (
            <tr key={o.id} className="border-t border-brd hover:bg-s2">
              <td className="py-2 text-t3">{new Date(o.created_at).toLocaleTimeString()}</td>
              <td className="py-2 capitalize">{o.order_type}</td>
              <td className="py-2 font-normal">{o.coin}</td>
              <td className={cn("py-2", o.side === "Long" ? "text-acc" : "text-red")}>{o.side}</td>
              <td className="py-2 font-tabular">{o.size.toFixed(5)}</td>
              <td className="py-2 font-tabular">{o.price.toFixed(2)}</td>
              <td className={cn(
                "py-2 capitalize",
                o.status === "filled" ? "text-acc" : o.status === "cancelled" ? "text-red" : "text-t3"
              )}>
                {o.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
