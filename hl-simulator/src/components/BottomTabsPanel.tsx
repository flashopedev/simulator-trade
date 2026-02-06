"use client";

import { useState } from "react";
import { cn, formatPnl, formatNumber, calculatePnl, calculateRoe, COIN_DECIMALS } from "@/lib/utils";
import type { Position, TradeHistory, OrderHistory } from "@/lib/supabase/types";
import { ChevronDown } from "lucide-react";

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
}

export function BottomTabsPanel({
  positions,
  history,
  orders,
  currentPrices,
  balance,
  onClosePosition,
}: BottomTabsPanelProps) {
  const [activeTab, setActiveTab] = useState<BottomTab>("balances");
  const [closeModal, setCloseModal] = useState<Position | null>(null);
  const [closeSize, setCloseSize] = useState("");
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

  const handleClose = (p: Position) => {
    setCloseModal(p);
    setCloseSize(p.size.toString());
  };

  const handleConfirmClose = () => {
    if (!closeModal) return;
    const sz = parseFloat(closeSize) || closeModal.size;
    onClosePosition(closeModal, sz);
    setCloseModal(null);
    setCloseSize("");
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
                "px-2 py-1.5 text-[11px] font-medium border-b-2 whitespace-nowrap transition-colors",
                tab.disabled
                  ? "text-t4 border-transparent cursor-default"
                  : activeTab === tab.key
                    ? "text-t1 border-acc"
                    : "text-t3 border-transparent hover:text-t2"
              )}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && !tab.disabled && (
                <span className="ml-1 text-[9px] text-acc">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <button className="flex items-center gap-1 text-[10px] text-t3 hover:text-t2">
            Filter
            <ChevronDown className="w-3 h-3" />
          </button>
          <label className="flex items-center gap-1 text-[10px] text-t3 cursor-pointer">
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
            onClose={handleClose}
          />
        )}
        {activeTab === "orders" && (
          <OrdersContent orders={orders} />
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

      {/* Close Position Modal */}
      {closeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-s2 border border-brd rounded-lg p-5 w-[340px]">
            <h3 className="text-[15px] font-bold mb-4">Close Position</h3>

            <div className="text-[12px] text-t2 mb-3">
              {closeModal.side} {closeModal.coin}/USDC | Size: {closeModal.size}
            </div>

            <div className="mb-3">
              <label className="text-[11px] text-t3 mb-1 block">Close Size</label>
              <input
                type="number"
                value={closeSize}
                onChange={(e) => setCloseSize(e.target.value)}
                max={closeModal.size}
                step="0.01"
                className="w-full bg-s3 border border-brd rounded px-3 py-2 text-[13px] font-tabular outline-none focus:border-acc"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setCloseSize(closeModal.size.toString()); handleConfirmClose(); }}
                className="flex-1 py-2.5 bg-red/10 border border-red/25 rounded text-[12px] font-semibold text-red hover:bg-red/20 transition-colors"
              >
                Close All
              </button>
              <button
                onClick={handleConfirmClose}
                className="flex-1 py-2.5 bg-acc/10 border border-acc/25 rounded text-[12px] font-semibold text-acc hover:bg-acc/20 transition-colors"
              >
                Close Partial
              </button>
            </div>

            <button
              onClick={() => setCloseModal(null)}
              className="w-full mt-2 py-2 text-[11px] text-t3 hover:text-t2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Sub-components --- */

function DisabledTabContent({ tabName }: { tabName: string }) {
  return (
    <div className="text-center py-8 text-t3 text-[11px]">
      {tabName} - Coming soon (simulation mode)
    </div>
  );
}

function BalancesContent({ balance, hideSmall }: { balance: number; hideSmall: boolean }) {
  if (hideSmall && balance < 1) {
    return (
      <div className="text-center py-8 text-t3 text-[11px]">No balances to show</div>
    );
  }

  return (
    <div className="px-3">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-t3 text-left">
            <th className="py-2 font-medium">Coin</th>
            <th className="py-2 font-medium">Total Balance</th>
            <th className="py-2 font-medium">Available Balance</th>
            <th className="py-2 font-medium">USDC Value</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-brd">
            <td className="py-2 font-medium">USDC</td>
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
  onClose,
}: {
  positions: Position[];
  currentPrices: Record<string, number>;
  onClose: (p: Position) => void;
}) {
  if (positions.length === 0) {
    return (
      <div className="text-center py-8 text-t3 text-[11px]">No open positions</div>
    );
  }

  return (
    <div className="px-3 overflow-x-auto">
      <table className="w-full text-[11px] min-w-[800px]">
        <thead>
          <tr className="text-t3 text-left">
            <th className="py-2 font-medium">Coin</th>
            <th className="py-2 font-medium">Size</th>
            <th className="py-2 font-medium">Position Value</th>
            <th className="py-2 font-medium">Entry Price</th>
            <th className="py-2 font-medium">Mark Price</th>
            <th className="py-2 font-medium">PNL (ROE %)</th>
            <th className="py-2 font-medium">Liq. Price</th>
            <th className="py-2 font-medium">Margin</th>
            <th className="py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const decimals = COIN_DECIMALS[p.coin] || 2;
            const markPrice = currentPrices[p.coin] || p.entry_price;
            const pnl = calculatePnl(p.entry_price, markPrice, p.size, p.side === "Long");
            const roe = calculateRoe(pnl, p.entry_price, p.size, p.leverage);
            const margin = (p.size * p.entry_price) / p.leverage;
            const posValue = p.size * markPrice;

            return (
              <tr key={`${p.id}-${markPrice.toFixed(decimals)}`} className="border-t border-brd hover:bg-s2 pnl-row">
                <td className="py-2 font-medium">
                  <span className={cn(p.side === "Long" ? "text-grn" : "text-red")}>
                    {p.coin} {p.leverage}x {p.side[0]}
                  </span>
                </td>
                <td className="py-2 font-tabular">{p.size.toFixed(2)}</td>
                <td className="py-2 font-tabular">${formatNumber(posValue)}</td>
                <td className="py-2 font-tabular">{p.entry_price.toFixed(decimals)}</td>
                <td className="py-2 font-tabular">{markPrice.toFixed(decimals)}</td>
                <td className={cn("py-2 font-semibold font-tabular", pnl >= 0 ? "text-grn" : "text-red")}>
                  {formatPnl(pnl)} ({roe >= 0 ? "+" : ""}{roe.toFixed(1)}%)
                </td>
                <td className="py-2 font-tabular text-red">{p.liquidation_price.toFixed(decimals)}</td>
                <td className="py-2 font-tabular">${formatNumber(margin)}</td>
                <td className="py-2">
                  <button
                    onClick={() => onClose(p)}
                    className="px-2 py-1 bg-s3 border border-brd rounded text-[10px] font-semibold text-t2 hover:bg-red/10 hover:border-red/25 hover:text-red transition-colors"
                  >
                    Close
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

function OrdersContent({ orders }: { orders: OrderHistory[] }) {
  const pendingOrders = orders?.filter(o => o.status === "pending") || [];

  if (pendingOrders.length === 0) {
    return (
      <div className="text-center py-8 text-t3 text-[11px]">No open orders</div>
    );
  }

  return (
    <div className="px-3 overflow-x-auto">
      <table className="w-full text-[11px] min-w-[700px]">
        <thead>
          <tr className="text-t3 text-left">
            <th className="py-2 font-medium">Time</th>
            <th className="py-2 font-medium">Type</th>
            <th className="py-2 font-medium">Coin</th>
            <th className="py-2 font-medium">Direction</th>
            <th className="py-2 font-medium">Size</th>
            <th className="py-2 font-medium">Price</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {pendingOrders.map((o) => (
            <tr key={o.id} className="border-t border-brd">
              <td className="py-2 text-t3">{new Date(o.created_at).toLocaleTimeString()}</td>
              <td className="py-2">{o.order_type}</td>
              <td className="py-2 font-medium">{o.coin}</td>
              <td className={cn("py-2", o.side === "Long" ? "text-grn" : "text-red")}>{o.side}</td>
              <td className="py-2 font-tabular">{o.size.toFixed(2)}</td>
              <td className="py-2 font-tabular">{o.price.toFixed(2)}</td>
              <td className="py-2 text-t3">{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryContent({ history }: { history: TradeHistory[] }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-t3 text-[11px]">No trade history</div>
    );
  }

  return (
    <div className="px-3 overflow-x-auto">
      <table className="w-full text-[11px] min-w-[700px]">
        <thead>
          <tr className="text-t3 text-left">
            <th className="py-2 font-medium">Time</th>
            <th className="py-2 font-medium">Coin</th>
            <th className="py-2 font-medium">Side</th>
            <th className="py-2 font-medium">Size</th>
            <th className="py-2 font-medium">Entry</th>
            <th className="py-2 font-medium">Exit</th>
            <th className="py-2 font-medium">PNL (ROE %)</th>
          </tr>
        </thead>
        <tbody>
          {history.slice(0, 50).map((h) => {
            const decimals = COIN_DECIMALS[h.coin] || 2;
            const roe = calculateRoe(h.pnl, h.entry_price, h.size, h.leverage);

            return (
              <tr key={h.id} className="border-t border-brd">
                <td className="py-2 text-t3">{new Date(h.closed_at).toLocaleTimeString()}</td>
                <td className="py-2 font-medium">
                  {h.coin}{h.liquidated ? " 💀" : ""}
                </td>
                <td className={cn("py-2", h.side === "Long" ? "text-grn" : "text-red")}>
                  {h.leverage}x {h.side}
                </td>
                <td className="py-2 font-tabular">{h.size.toFixed(2)}</td>
                <td className="py-2 font-tabular">{h.entry_price.toFixed(decimals)}</td>
                <td className="py-2 font-tabular">{h.exit_price.toFixed(decimals)}</td>
                <td className={cn("py-2 font-semibold font-tabular", h.pnl >= 0 ? "text-grn" : "text-red")}>
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
      <div className="text-center py-8 text-t3 text-[11px]">No order history</div>
    );
  }

  return (
    <div className="px-3 overflow-x-auto">
      <table className="w-full text-[11px] min-w-[700px]">
        <thead>
          <tr className="text-t3 text-left">
            <th className="py-2 font-medium">Time</th>
            <th className="py-2 font-medium">Type</th>
            <th className="py-2 font-medium">Coin</th>
            <th className="py-2 font-medium">Direction</th>
            <th className="py-2 font-medium">Size</th>
            <th className="py-2 font-medium">Price</th>
            <th className="py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.slice(0, 50).map((o) => (
            <tr key={o.id} className="border-t border-brd">
              <td className="py-2 text-t3">{new Date(o.created_at).toLocaleTimeString()}</td>
              <td className="py-2">{o.order_type}</td>
              <td className="py-2 font-medium">{o.coin}</td>
              <td className={cn("py-2", o.side === "Long" ? "text-grn" : "text-red")}>{o.side}</td>
              <td className="py-2 font-tabular">{o.size.toFixed(2)}</td>
              <td className="py-2 font-tabular">{o.price.toFixed(2)}</td>
              <td className={cn(
                "py-2",
                o.status === "filled" ? "text-grn" : o.status === "cancelled" ? "text-red" : "text-t3"
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
