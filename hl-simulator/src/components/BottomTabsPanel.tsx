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
      {/* Tabs row - exact HL match: h-[35px], border-bottom on all tabs #303030, active=white text, inactive=gray */}
      <div className="flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid #303030' }}>
        <div className="flex items-center overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => !tab.disabled && setActiveTab(tab.key)}
              disabled={tab.disabled}
              className={cn(
                "h-[35px] text-[12px] font-normal whitespace-nowrap transition-colors",
                tab.disabled
                  ? "text-t4 cursor-default"
                  : activeTab === tab.key
                    ? "text-[#f6fefd]"
                    : "text-[#949e9c] hover:text-[#c0c8c6] cursor-pointer"
              )}
              style={{ padding: '0 12px' }}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && !tab.disabled && (
                <span className="ml-0.5 text-[12px]">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Right side controls - exact HL style */}
        <div className="flex items-center gap-3 flex-shrink-0 pr-2">
          <button className="flex items-center gap-1 text-[12px] text-[#949e9c] hover:text-[#f6fefd]">
            Filter
            <ChevronDown className="w-3 h-3" />
          </button>
          {activeTab === "balances" && (
            <label className="flex items-center gap-1.5 text-[12px] text-[#f6fefd] cursor-pointer">
              <input
                type="checkbox"
                checked={hideSmallBalances}
                onChange={(e) => setHideSmallBalances(e.target.checked)}
                className="w-3 h-3 rounded border-[#303030] bg-transparent accent-[#50d2c1]"
              />
              Hide Small Balances
            </label>
          )}
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
    <div className="text-center py-8 text-[#949e9c] text-[12px]">
      {tabName} - Coming soon (simulation mode)
    </div>
  );
}

function BalancesContent({ balance, hideSmall }: { balance: number; hideSmall: boolean }) {
  if (hideSmall && balance < 1) {
    return (
      <div className="text-center py-8 text-[#949e9c] text-[12px]">No balances to show</div>
    );
  }

  return (
    <div className="px-3">
      <table className="w-full text-[12px]" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr className="text-[#949e9c] text-left h-[24px]">
            <th className="font-normal px-1">Coin</th>
            <th className="font-normal px-1">Total Balance</th>
            <th className="font-normal px-1">Available Balance</th>
            <th className="font-normal px-1">USDC Value <ChevronDown className="inline w-3 h-3 opacity-50" /></th>
            <th className="font-normal px-1" style={{ textDecoration: 'underline dashed', textUnderlineOffset: '3px', textDecorationColor: '#949e9c' }}>PNL (ROE %)</th>
            <th className="font-normal px-1">Send</th>
            <th className="font-normal px-1">Transfer</th>
            <th className="font-normal px-1">Contract</th>
          </tr>
        </thead>
        <tbody>
          <tr className="h-[24px] hover:bg-[#1b2429]">
            <td className="px-1 text-[#f6fefd] font-normal">USDC</td>
            <td className="px-1 font-tabular text-[#f6fefd]">{formatNumber(balance)} USDC</td>
            <td className="px-1 font-tabular text-[#f6fefd]">{formatNumber(balance)} USDC</td>
            <td className="px-1 font-tabular text-[#f6fefd]">${formatNumber(balance)}</td>
            <td className="px-1 text-[#949e9c]"></td>
            <td className="px-1"><button className="text-[12px] text-[#50d2c1] hover:underline">Send</button></td>
            <td className="px-1"><button className="text-[12px] text-[#50d2c1] hover:underline">Transfer to Perps</button></td>
            <td className="px-1 text-[#949e9c]"></td>
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
      <table className="w-full text-[12px] min-w-[900px]" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr className="text-[#949e9c] text-left h-[24px]">
            <th className="font-normal px-1">Coin</th>
            <th className="font-normal px-1">Size</th>
            <th className="font-normal px-1">Position Value <ChevronDown className="inline w-3 h-3 opacity-50" /></th>
            <th className="font-normal px-1">Entry Price</th>
            <th className="font-normal px-1">Mark Price</th>
            <th className="font-normal px-1 whitespace-nowrap" style={{ textDecoration: 'underline dashed', textUnderlineOffset: '3px', textDecorationColor: '#949e9c' }}>PNL (ROE %)</th>
            <th className="font-normal px-1">Liq. Price</th>
            <th className="font-normal px-1">Margin</th>
            <th className="font-normal px-1">Funding</th>
            <th className="font-normal px-1">Close All</th>
            <th className="font-normal px-1"></th>
          </tr>
        </thead>
        <tbody>
          {positions.length === 0 && (
            <tr>
              <td colSpan={11} className="py-6 text-center text-[#949e9c]">
                No open positions yet
              </td>
            </tr>
          )}
          {[...positions].sort((a, b) => {
            const aVal = a.size * (currentPrices[a.coin] || a.entry_price);
            const bVal = b.size * (currentPrices[b.coin] || b.entry_price);
            return bVal - aVal;
          }).map((p) => {
            const decimals = COIN_DECIMALS[p.coin] ?? 2;
            const markPrice = currentPrices[p.coin] || p.entry_price;
            const pnl = calculatePnl(p.entry_price, markPrice, p.size, p.side === "Long");
            const roe = calculateRoe(pnl, p.entry_price, p.size, p.leverage);
            const margin = (p.size * p.entry_price) / p.leverage;
            const posValue = p.size * markPrice;
            const isLong = p.side === "Long";
            const sizeDecimals = COIN_DECIMALS[p.coin] !== undefined ? (p.coin === 'BTC' ? 5 : 2) : 2;

            return (
              <tr key={`${p.id}-${markPrice.toFixed(decimals)}`} className="h-[24px] hover:bg-[#1b2429] pnl-row">
                {/* Coin + leverage badge - exact HL: "SOL 20x" */}
                <td className="px-1">
                  <span className={cn("font-normal", isLong ? "text-[#50d2c1]" : "text-[#ed7088]")}>
                    {p.coin}
                  </span>
                  <span className="ml-1 text-[12px] text-[#949e9c]">{p.leverage}x</span>
                </td>
                {/* Size - "0,29 SOL" colored */}
                <td className={cn("px-1 font-tabular", isLong ? "text-[#50d2c1]" : "text-[#ed7088]")}>
                  {p.size.toFixed(sizeDecimals).replace('.', ',')} {p.coin}
                </td>
                {/* Position Value - "25,46 USDC" */}
                <td className="px-1 font-tabular text-[#f6fefd]">{formatNumber(posValue)} USDC</td>
                {/* Entry Price */}
                <td className="px-1 font-tabular text-[#f6fefd]">{formatNumber(p.entry_price, decimals)}</td>
                {/* Mark Price */}
                <td className="px-1 font-tabular text-[#f6fefd]">{formatNumber(markPrice, decimals)}</td>
                {/* PNL (ROE %) - colored + share icon */}
                <td className={cn("px-1 font-tabular", pnl >= 0 ? "text-[#50d2c1]" : "text-[#ed7088]")}>
                  {formatPnl(pnl)} ({roe >= 0 ? "+" : ""}{roe.toFixed(1).replace('.', ',')}%)
                </td>
                {/* Liquidation Price */}
                <td className="px-1 font-tabular text-[#f6fefd]">
                  {p.liquidation_price ? formatNumber(p.liquidation_price, decimals || 2) : "N/A"}
                </td>
                {/* Margin - "$1,27 (Cross)" */}
                <td className="px-1 font-tabular text-[#f6fefd]">
                  ${formatNumber(margin)} <span className="text-[#949e9c]">(Cross)</span>
                </td>
                {/* Funding */}
                <td className="px-1 font-tabular text-[#f6fefd]">$0,00</td>
                {/* Close All - "Limit Market Reverse" teal links */}
                <td className="px-1">
                  <div className="flex items-center gap-2">
                    <button className="text-[12px] text-[#50d2c1] hover:underline">Limit</button>
                    <button onClick={() => onMarketClose(p)} className="text-[12px] text-[#50d2c1] hover:underline">Market</button>
                    <button className="text-[12px] text-[#50d2c1] hover:underline">Reverse</button>
                  </div>
                </td>
                {/* TP/SL - just "--" like real HL */}
                <td className="px-1 text-[#949e9c] text-[12px]">--</td>
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
      <div className="text-center py-8 text-[#949e9c] text-[12px]">No open orders</div>
    );
  }

  return (
    <div className="px-3 overflow-x-auto">
      <table className="w-full text-[12px] min-w-[900px]" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr className="text-[#949e9c] text-left h-[24px]">
            <th className="font-normal px-1">Time</th>
            <th className="font-normal px-1">Type</th>
            <th className="font-normal px-1">Coin</th>
            <th className="font-normal px-1">Direction</th>
            <th className="font-normal px-1">Size</th>
            <th className="font-normal px-1">Original Size</th>
            <th className="font-normal px-1">Order Value <ChevronDown className="inline w-3 h-3 opacity-50" /></th>
            <th className="font-normal px-1">Price</th>
            <th className="font-normal px-1">Reduce Only</th>
            <th className="font-normal px-1">Trigger Conditions</th>
            <th className="font-normal px-1">TP/SL</th>
            <th className="font-normal px-1 text-[#50d2c1]">Cancel All</th>
          </tr>
        </thead>
        <tbody>
          {pendingOrders.map((o) => {
            const orderValue = o.size * o.price;
            return (
              <tr key={o.id} className="h-[24px] hover:bg-[#1b2429]">
                <td className="px-1 text-[#949e9c]">
                  {new Date(o.created_at).toLocaleDateString()} - {new Date(o.created_at).toLocaleTimeString()}
                </td>
                <td className="px-1 text-[#f6fefd] capitalize">{o.order_type}</td>
                <td className="px-1 font-normal text-[#f6fefd] font-semibold">{o.coin}</td>
                <td className={cn("px-1", o.side === "Long" ? "text-[#50d2c1]" : "text-[#ed7088]")}>{o.side}</td>
                <td className="px-1 font-tabular text-[#f6fefd]">{o.size.toFixed(2)}</td>
                <td className="px-1 font-tabular text-[#f6fefd]">{o.size.toFixed(2)}</td>
                <td className="px-1 font-tabular text-[#f6fefd]">{formatNumber(orderValue)} USDC</td>
                <td className="px-1 font-tabular text-[#f6fefd]">{formatNumber(o.price)}</td>
                <td className="px-1 text-[#f6fefd]">No</td>
                <td className="px-1 text-[#f6fefd]">N/A</td>
                <td className="px-1 text-[#949e9c]">--</td>
                <td className="px-1">
                  <button
                    onClick={() => onCancelOrder?.(o.id)}
                    className="text-[12px] text-[#50d2c1] hover:underline"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-1 py-1">
        <button className="text-[12px] text-[#50d2c1] hover:underline">View All</button>
      </div>
    </div>
  );
}

function HistoryContent({ history }: { history: TradeHistory[] }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-[#949e9c] text-[12px]">No trade history</div>
    );
  }

  return (
    <div className="px-3 overflow-x-auto">
      <table className="w-full text-[12px] min-w-[700px]" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr className="text-[#949e9c] text-left h-[24px]">
            <th className="font-normal px-1">Time</th>
            <th className="font-normal px-1">Coin</th>
            <th className="font-normal px-1">Side</th>
            <th className="font-normal px-1">Size</th>
            <th className="font-normal px-1">Entry</th>
            <th className="font-normal px-1">Exit</th>
            <th className="font-normal px-1">PNL (ROE %)</th>
          </tr>
        </thead>
        <tbody>
          {history.slice(0, 50).map((h) => {
            const decimals = COIN_DECIMALS[h.coin] || 2;
            const roe = calculateRoe(h.pnl, h.entry_price, h.size, h.leverage);

            return (
              <tr key={h.id} className="h-[24px] hover:bg-[#1b2429]">
                <td className="px-1 text-[#949e9c]">{new Date(h.closed_at).toLocaleTimeString()}</td>
                <td className="px-1 text-[#f6fefd]">
                  {h.coin}{h.liquidated ? " 💀" : ""}
                </td>
                <td className={cn("px-1", h.side === "Long" ? "text-[#50d2c1]" : "text-[#ed7088]")}>
                  {h.leverage}x {h.side}
                </td>
                <td className="px-1 font-tabular text-[#f6fefd]">{h.size.toFixed(5)}</td>
                <td className="px-1 font-tabular text-[#f6fefd]">{h.entry_price.toFixed(decimals)}</td>
                <td className="px-1 font-tabular text-[#f6fefd]">{h.exit_price.toFixed(decimals)}</td>
                <td className={cn("px-1 font-tabular", h.pnl >= 0 ? "text-[#50d2c1]" : "text-[#ed7088]")}>
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
      <div className="text-center py-8 text-[#949e9c] text-[12px]">No order history</div>
    );
  }

  return (
    <div className="px-3 overflow-x-auto">
      <table className="w-full text-[12px] min-w-[700px]" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr className="text-[#949e9c] text-left h-[24px]">
            <th className="font-normal px-1">Time</th>
            <th className="font-normal px-1">Type</th>
            <th className="font-normal px-1">Coin</th>
            <th className="font-normal px-1">Direction</th>
            <th className="font-normal px-1">Size</th>
            <th className="font-normal px-1">Price</th>
            <th className="font-normal px-1">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.slice(0, 50).map((o) => (
            <tr key={o.id} className="h-[24px] hover:bg-[#1b2429]">
              <td className="px-1 text-[#949e9c]">{new Date(o.created_at).toLocaleTimeString()}</td>
              <td className="px-1 text-[#f6fefd] capitalize">{o.order_type}</td>
              <td className="px-1 text-[#f6fefd]">{o.coin}</td>
              <td className={cn("px-1", o.side === "Long" ? "text-[#50d2c1]" : "text-[#ed7088]")}>{o.side}</td>
              <td className="px-1 font-tabular text-[#f6fefd]">{o.size.toFixed(5)}</td>
              <td className="px-1 font-tabular text-[#f6fefd]">{o.price.toFixed(2)}</td>
              <td className={cn(
                "px-1 capitalize",
                o.status === "filled" ? "text-[#50d2c1]" : o.status === "cancelled" ? "text-[#ed7088]" : "text-[#949e9c]"
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
