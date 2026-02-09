"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  calculateLiquidationPrice,
  calculatePnl,
  type SupportedCoin,
} from "@/lib/utils";
import type { Position, TradeHistory, OrderHistory } from "@/lib/supabase/types";
import { notify } from "@/components/Notification";

// Real HL fee structure
const TAKER_FEE = 0.00045; // 0.045% - market orders
const MAKER_FEE = 0.00015; // 0.015% - limit orders

interface UseTradingProps {
  accountId: string | null;
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

export function useTrading({ accountId, balance, onBalanceChange }: UseTradingProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<TradeHistory[]>([]);
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const lastPricesRef = useRef<Record<string, number>>({});

  // Keep a ref to always have the latest balance in closures
  const balanceRef = useRef(balance);
  balanceRef.current = balance;

  // Wrap onBalanceChange to also update ref immediately (before next render)
  const onBalanceChangeRef = useRef(onBalanceChange);
  onBalanceChangeRef.current = onBalanceChange;
  const updateBalance = useCallback((newBalance: number) => {
    balanceRef.current = newBalance; // Immediate update for subsequent sync reads
    onBalanceChangeRef.current(newBalance);
  }, []);

  const supabase = createClient();

  // Load positions and history
  const loadData = useCallback(async () => {
    if (!accountId) return;

    setLoading(true);
    try {
      const [posRes, histRes, ordRes] = await Promise.all([
        supabase
          .from("positions")
          .select("*")
          .eq("account_id", accountId)
          .order("created_at", { ascending: false }),
        supabase
          .from("trade_history")
          .select("*")
          .eq("account_id", accountId)
          .order("closed_at", { ascending: false })
          .limit(50),
        supabase
          .from("order_history")
          .select("*")
          .eq("account_id", accountId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (posRes.data) setPositions(posRes.data);
      if (histRes.data) setHistory(histRes.data);
      if (ordRes.data) setOrders(ordRes.data);
    } catch (error) {
      console.error("Failed to load trading data:", error);
    } finally {
      setLoading(false);
    }
  }, [accountId, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate used margin across all positions
  const getUsedMargin = useCallback(() => {
    let usedMargin = 0;
    positions.forEach((p) => {
      usedMargin += (p.size * p.entry_price) / p.leverage;
    });
    return usedMargin;
  }, [positions]);

  // Calculate unrealized PnL across all positions
  const getUnrealizedPnl = useCallback(
    (currentPrices?: Record<string, number>) => {
      const prices = currentPrices || lastPricesRef.current;
      let totalPnl = 0;
      positions.forEach((p) => {
        const price = prices[p.coin] || p.entry_price;
        totalPnl += calculatePnl(p.entry_price, price, p.size, p.side === "Long");
      });
      return totalPnl;
    },
    [positions]
  );

  // Margin reserved by pending limit orders
  const getPendingOrdersMargin = useCallback(() => {
    let reserved = 0;
    orders.forEach((o) => {
      if (o.status === "pending") {
        reserved += (o.size * o.price) / 10; // default 10x for limit orders
      }
    });
    return reserved;
  }, [orders]);

  // Available to Trade = cash balance + unrealizedPnL (negative only reduces) - pending order margin
  // Note: `balance` already has position margin deducted, so it IS the free cash
  const getAvailableBalance = useCallback(
    (currentPrices?: Record<string, number>) => {
      const uPnl = getUnrealizedPnl(currentPrices);
      const pendingMargin = getPendingOrdersMargin();
      return Math.max(0, balanceRef.current + Math.min(0, uPnl) - pendingMargin);
    },
    [getUnrealizedPnl, getPendingOrdersMargin]
  );

  // Place order — handles market (instant), limit (pending), and pro (forced entry price)
  const placeOrder = useCallback(
    async (order: {
      coin: SupportedCoin;
      side: "Long" | "Short";
      size: number;
      price: number;
      leverage: number;
      orderType: "market" | "limit" | "pro";
      marginMode: "cross" | "isolated";
    }) => {
      if (!accountId) return false;

      const notional = order.size * order.price;
      const margin = notional / order.leverage;
      const feeRate = order.orderType === "limit" ? MAKER_FEE : TAKER_FEE;
      const fee = notional * feeRate;
      // In simulator mode, allow orders as long as balance > 0
      if (balanceRef.current <= 0) {
        notify("Insufficient margin", "error");
        return false;
      }

      // --- LIMIT ORDER: create pending order, don't open position yet ---
      if (order.orderType === "limit") {
        try {
          const { data: newOrder, error: ordError } = await supabase
            .from("order_history")
            .insert({
              account_id: accountId,
              coin: order.coin,
              side: order.side,
              order_type: "limit",
              size: order.size,
              price: order.price,
              status: "pending",
              fee: 0,
            })
            .select()
            .single();

          if (ordError) throw ordError;

          if (newOrder) {
            setOrders((prev) => [newOrder, ...prev]);
          }

          notify(
            `Limit ${order.side} ${order.size.toFixed(4)} ${order.coin} @ ${order.price.toFixed(2)}`,
            "success"
          );
          return true;
        } catch (error) {
          console.error("Failed to place limit order:", error);
          notify("Failed to place limit order", "error");
          return false;
        }
      }

      // --- MARKET ORDER: execute immediately ---
      try {
        // Check if we already have a position on this coin
        const existingPosition = positions.find((p) => p.coin === order.coin);

        if (existingPosition) {
          // Same side → merge (increase position)
          if (existingPosition.side === order.side) {
            const totalSize = existingPosition.size + order.size;
            const avgEntry =
              (existingPosition.size * existingPosition.entry_price +
                order.size * order.price) /
              totalSize;
            const newLiqPrice = calculateLiquidationPrice(
              avgEntry,
              order.side === "Long",
              order.leverage
            );

            const { error: updateError } = await supabase
              .from("positions")
              .update({
                size: totalSize,
                entry_price: avgEntry,
                leverage: order.leverage,
                liquidation_price: newLiqPrice,
              })
              .eq("id", existingPosition.id);

            if (updateError) throw updateError;

            // Update local state
            setPositions((prev) =>
              prev.map((p) =>
                p.id === existingPosition.id
                  ? { ...p, size: totalSize, entry_price: avgEntry, leverage: order.leverage, liquidation_price: newLiqPrice }
                  : p
              )
            );
          } else {
            // Opposite side → reduce or flip
            if (order.size < existingPosition.size) {
              // Partial close
              const closedSize = order.size;
              const remainingSize = existingPosition.size - closedSize;
              const pnl = calculatePnl(
                existingPosition.entry_price,
                order.price,
                closedSize,
                existingPosition.side === "Long"
              );
              const closeFee = closedSize * order.price * TAKER_FEE;

              // Update position size
              const { error: updateError } = await supabase
                .from("positions")
                .update({ size: remainingSize })
                .eq("id", existingPosition.id);

              if (updateError) throw updateError;

              // Record partial close in trade history
              await supabase.from("trade_history").insert({
                account_id: accountId,
                position_id: existingPosition.id,
                coin: existingPosition.coin,
                side: existingPosition.side,
                size: closedSize,
                entry_price: existingPosition.entry_price,
                exit_price: order.price,
                pnl,
                leverage: existingPosition.leverage,
                liquidated: false,
              });

              // Update balance: return closed margin + pnl - fees
              // Floor at 0 — balance can never go negative
              const closedMargin = (closedSize * existingPosition.entry_price) / existingPosition.leverage;
              const newBalance = Math.max(0, balanceRef.current + closedMargin + pnl - closeFee);
              updateBalance(newBalance);

              setPositions((prev) =>
                prev.map((p) =>
                  p.id === existingPosition.id ? { ...p, size: remainingSize } : p
                )
              );

              setHistory((prev) => [
                {
                  id: crypto.randomUUID(),
                  account_id: accountId,
                  position_id: existingPosition.id,
                  coin: existingPosition.coin,
                  side: existingPosition.side,
                  size: closedSize,
                  entry_price: existingPosition.entry_price,
                  exit_price: order.price,
                  pnl,
                  leverage: existingPosition.leverage,
                  liquidated: false,
                  closed_at: new Date().toISOString(),
                },
                ...prev,
              ]);

              notify(
                `Reduced ${existingPosition.side} ${existingPosition.coin} by ${closedSize.toFixed(4)} | PnL: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}`,
                pnl >= 0 ? "success" : "error"
              );
              return true;
            } else if (order.size === existingPosition.size) {
              // Full close — delegate to closePosition
              await closePositionInternal(existingPosition, order.price, fee);
              return true;
            } else {
              // Flip: close existing, open remainder in opposite direction
              const closePnl = calculatePnl(
                existingPosition.entry_price,
                order.price,
                existingPosition.size,
                existingPosition.side === "Long"
              );
              const closeFee = existingPosition.size * order.price * TAKER_FEE;

              // Close existing
              await supabase.from("positions").delete().eq("id", existingPosition.id);

              await supabase.from("trade_history").insert({
                account_id: accountId,
                position_id: existingPosition.id,
                coin: existingPosition.coin,
                side: existingPosition.side,
                size: existingPosition.size,
                entry_price: existingPosition.entry_price,
                exit_price: order.price,
                pnl: closePnl,
                leverage: existingPosition.leverage,
                liquidated: false,
              });

              // Return margin from closed position
              const closedMargin = (existingPosition.size * existingPosition.entry_price) / existingPosition.leverage;
              let newBalance = Math.max(0, balanceRef.current + closedMargin + closePnl - closeFee);

              // Open new position with remaining size
              const remainingSize = order.size - existingPosition.size;
              const newMargin = (remainingSize * order.price) / order.leverage;
              const openFee = remainingSize * order.price * TAKER_FEE;
              newBalance = newBalance - newMargin - openFee;

              const newLiqPrice = calculateLiquidationPrice(
                order.price,
                order.side === "Long",
                order.leverage
              );

              const { data: newPos } = await supabase
                .from("positions")
                .insert({
                  account_id: accountId,
                  coin: order.coin,
                  side: order.side,
                  size: remainingSize,
                  entry_price: order.price,
                  leverage: order.leverage,
                  margin_mode: order.marginMode,
                  liquidation_price: newLiqPrice,
                })
                .select()
                .single();

              updateBalance(newBalance);

              setPositions((prev) => {
                const filtered = prev.filter((p) => p.id !== existingPosition.id);
                return newPos ? [newPos, ...filtered] : filtered;
              });

              setHistory((prev) => [
                {
                  id: crypto.randomUUID(),
                  account_id: accountId,
                  position_id: existingPosition.id,
                  coin: existingPosition.coin,
                  side: existingPosition.side,
                  size: existingPosition.size,
                  entry_price: existingPosition.entry_price,
                  exit_price: order.price,
                  pnl: closePnl,
                  leverage: existingPosition.leverage,
                  liquidated: false,
                  closed_at: new Date().toISOString(),
                },
                ...prev,
              ]);

              notify(
                `Flipped to ${order.side} ${remainingSize.toFixed(4)} ${order.coin} | Close PnL: ${closePnl >= 0 ? "+" : ""}${closePnl.toFixed(2)}`,
                closePnl >= 0 ? "success" : "error"
              );
              return true;
            }
          }
        } else {
          // No existing position — open new one
          const liquidationPrice = calculateLiquidationPrice(
            order.price,
            order.side === "Long",
            order.leverage
          );

          const { data: position, error: posError } = await supabase
            .from("positions")
            .insert({
              account_id: accountId,
              coin: order.coin,
              side: order.side,
              size: order.size,
              entry_price: order.price,
              leverage: order.leverage,
              margin_mode: order.marginMode,
              liquidation_price: liquidationPrice,
            })
            .select()
            .single();

          if (posError) throw posError;

          if (position) {
            setPositions((prev) => [position, ...prev]);
          }
        }

        // Record order in history
        await supabase.from("order_history").insert({
          account_id: accountId,
          coin: order.coin,
          side: order.side,
          order_type: order.orderType,
          size: order.size,
          price: order.price,
          status: "filled",
          fee,
        });

        // Deduct margin + fee from balance (floor at 0)
        const newBalance = Math.max(0, balanceRef.current - margin - fee);
        updateBalance(newBalance);

        notify(
          `${order.side} ${order.size.toFixed(4)} ${order.coin} @ ${order.price.toFixed(2)} | ${order.leverage}x`,
          "success"
        );

        return true;
      } catch (error) {
        console.error("Failed to place order:", error);
        notify("Failed to place order", "error");
        return false;
      }
    },
    [accountId, positions, getAvailableBalance, updateBalance, supabase]
  );

  // Internal close position (used by merge flip and direct close)
  const closePositionInternal = useCallback(
    async (position: Position, currentPrice: number, precomputedFee?: number) => {
      if (!accountId) return false;

      const pnl = calculatePnl(
        position.entry_price,
        currentPrice,
        position.size,
        position.side === "Long"
      );
      const fee = precomputedFee ?? position.size * currentPrice * TAKER_FEE;

      try {
        const { error: delError } = await supabase
          .from("positions")
          .delete()
          .eq("id", position.id);

        if (delError) throw delError;

        await supabase.from("trade_history").insert({
          account_id: accountId,
          position_id: position.id,
          coin: position.coin,
          side: position.side,
          size: position.size,
          entry_price: position.entry_price,
          exit_price: currentPrice,
          pnl,
          leverage: position.leverage,
          liquidated: false,
        });

        // Return margin + PnL - fee
        // Balance = cash + returned_margin + realized_pnl - close_fee
        // Floor at 0 — balance can never go negative (like real HL)
        const margin = (position.size * position.entry_price) / position.leverage;
        const newBalance = Math.max(0, balanceRef.current + margin + pnl - fee);
        updateBalance(newBalance);

        setPositions((prev) => prev.filter((p) => p.id !== position.id));
        setHistory((prev) => [
          {
            id: crypto.randomUUID(),
            account_id: accountId,
            position_id: position.id,
            coin: position.coin,
            side: position.side,
            size: position.size,
            entry_price: position.entry_price,
            exit_price: currentPrice,
            pnl,
            leverage: position.leverage,
            liquidated: false,
            closed_at: new Date().toISOString(),
          },
          ...prev,
        ]);

        notify(
          `Closed ${position.side} ${position.coin} | PnL: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}`,
          pnl >= 0 ? "success" : "error"
        );

        return true;
      } catch (error) {
        console.error("Failed to close position:", error);
        notify("Failed to close position", "error");
        return false;
      }
    },
    [accountId, updateBalance, supabase]
  );

  // Public close position
  const closePosition = useCallback(
    async (position: Position, currentPrice: number) => {
      return closePositionInternal(position, currentPrice);
    },
    [closePositionInternal]
  );

  // Check and fill pending limit orders
  const checkLimitOrders = useCallback(
    async (currentPrices: Record<string, number>) => {
      const pendingOrders = orders.filter((o) => o.status === "pending");
      if (pendingOrders.length === 0) return;

      for (const order of pendingOrders) {
        const currentPrice = currentPrices[order.coin];
        if (!currentPrice) continue;

        // Check if limit price is reached
        let shouldFill = false;
        if (order.side === "Long") {
          // Buy limit: fill when market price <= limit price
          shouldFill = currentPrice <= order.price;
        } else {
          // Sell limit: fill when market price >= limit price
          shouldFill = currentPrice >= order.price;
        }

        if (shouldFill) {
          try {
            // Update order status to filled
            const fee = order.size * order.price * MAKER_FEE;
            await supabase
              .from("order_history")
              .update({ status: "filled", fee })
              .eq("id", order.id);

            // Open position at limit price
            const margin = (order.size * order.price) / 10; // default 10x for limit fills
            const liquidationPrice = calculateLiquidationPrice(
              order.price,
              order.side === "Long",
              10
            );

            // Check if position exists for merge
            const existingPosition = positions.find((p) => p.coin === order.coin && p.side === order.side);

            if (existingPosition) {
              const totalSize = existingPosition.size + order.size;
              const avgEntry =
                (existingPosition.size * existingPosition.entry_price +
                  order.size * order.price) /
                totalSize;
              const newLiqPrice = calculateLiquidationPrice(
                avgEntry,
                order.side === "Long",
                existingPosition.leverage
              );

              await supabase
                .from("positions")
                .update({
                  size: totalSize,
                  entry_price: avgEntry,
                  liquidation_price: newLiqPrice,
                })
                .eq("id", existingPosition.id);
            } else {
              await supabase.from("positions").insert({
                account_id: accountId!,
                coin: order.coin,
                side: order.side,
                size: order.size,
                entry_price: order.price,
                leverage: 10,
                margin_mode: "cross",
                liquidation_price: liquidationPrice,
              });
            }

            // Deduct margin + fee (floor at 0)
            const newBalance = Math.max(0, balanceRef.current - margin - fee);
            updateBalance(newBalance);

            notify(
              `Limit filled: ${order.side} ${order.size.toFixed(4)} ${order.coin} @ ${order.price.toFixed(2)}`,
              "success"
            );

            // Reload all data to get consistent state
            await loadData();
          } catch (error) {
            console.error("Failed to fill limit order:", error);
          }
        }
      }
    },
    [accountId, orders, positions, updateBalance, supabase, loadData]
  );

  // Cancel pending order
  const cancelOrder = useCallback(
    async (orderId: string) => {
      if (!accountId) return false;
      try {
        await supabase
          .from("order_history")
          .update({ status: "cancelled" })
          .eq("id", orderId);

        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" as const } : o))
        );

        notify("Order cancelled", "success");
        return true;
      } catch (error) {
        console.error("Failed to cancel order:", error);
        notify("Failed to cancel order", "error");
        return false;
      }
    },
    [accountId, supabase]
  );

  // Check liquidations
  const checkLiquidations = useCallback(
    async (currentPrices: Record<string, number>) => {
      lastPricesRef.current = currentPrices;
      const toClose: Position[] = [];

      positions.forEach((p) => {
        const price = currentPrices[p.coin];
        if (!price) return;

        // Only liquidate if liq_price makes sense (below entry for Long, above entry for Short)
        if (p.side === "Long" && p.liquidation_price > 0 && p.liquidation_price < p.entry_price && price <= p.liquidation_price) {
          toClose.push(p);
        } else if (p.side === "Short" && p.liquidation_price > 0 && p.liquidation_price > p.entry_price && price >= p.liquidation_price) {
          toClose.push(p);
        }
      });

      for (const position of toClose) {
        try {
          await supabase.from("positions").delete().eq("id", position.id);

          // Liquidation loss = entire margin
          const margin = (position.size * position.entry_price) / position.leverage;
          const loss = -margin;

          await supabase.from("trade_history").insert({
            account_id: accountId,
            position_id: position.id,
            coin: position.coin,
            side: position.side,
            size: position.size,
            entry_price: position.entry_price,
            exit_price: position.liquidation_price,
            pnl: loss,
            leverage: position.leverage,
            liquidated: true,
          });

          // Balance loses the margin (it was already deducted when opening)
          // No balance change needed — margin was already reserved
          // But we need to update local state
          setPositions((prev) => prev.filter((p) => p.id !== position.id));
          setHistory((prev) => [
            {
              id: crypto.randomUUID(),
              account_id: accountId!,
              position_id: position.id,
              coin: position.coin,
              side: position.side,
              size: position.size,
              entry_price: position.entry_price,
              exit_price: position.liquidation_price,
              pnl: loss,
              leverage: position.leverage,
              liquidated: true,
              closed_at: new Date().toISOString(),
            },
            ...prev,
          ]);

          notify(`LIQUIDATED ${position.side} ${position.size.toFixed(4)} ${position.coin}`, "error");
        } catch (error) {
          console.error("Liquidation error:", error);
        }
      }

      // Also check limit orders
      await checkLimitOrders(currentPrices);
    },
    [accountId, positions, supabase, checkLimitOrders]
  );

  // Calculate total equity = balance + unrealized PnL
  // (balance already has margin deducted, so equity = balance + uPnL)
  const getTotalEquity = useCallback(
    (currentPrices: Record<string, number>) => {
      lastPricesRef.current = currentPrices;
      let uPnl = 0;
      let usedMargin = 0;
      positions.forEach((p) => {
        const price = currentPrices[p.coin] || p.entry_price;
        uPnl += calculatePnl(p.entry_price, price, p.size, p.side === "Long");
        usedMargin += (p.size * p.entry_price) / p.leverage;
      });
      // Equity = cash balance + margin in positions + unrealized PnL
      return balanceRef.current + usedMargin + uPnl;
    },
    [positions]
  );

  return {
    positions,
    history,
    orders,
    loading,
    placeOrder,
    closePosition,
    cancelOrder,
    checkLiquidations,
    getAvailableBalance,
    getTotalEquity,
    getUnrealizedPnl,
    getUsedMargin,
    refetch: loadData,
  };
}
