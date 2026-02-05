"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  calculateLiquidationPrice,
  calculatePnl,
  type SupportedCoin,
} from "@/lib/utils";
import type { Position, TradeHistory, OrderHistory } from "@/lib/supabase/types";
import { notify } from "@/components/Notification";

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

  // Calculate available balance
  const getAvailableBalance = useCallback(() => {
    let usedMargin = 0;
    positions.forEach((p) => {
      usedMargin += (p.size * p.entry_price) / p.leverage;
    });
    return Math.max(0, balance - usedMargin);
  }, [positions, balance]);

  // Place order
  const placeOrder = useCallback(
    async (order: {
      coin: SupportedCoin;
      side: "Long" | "Short";
      size: number;
      price: number;
      leverage: number;
      orderType: "market" | "limit";
      marginMode: "cross" | "isolated";
    }) => {
      if (!accountId) return false;

      const notional = order.size * order.price;
      const margin = notional / order.leverage;
      const fee = notional * 0.0005;
      const available = getAvailableBalance();

      if (margin + fee > available) {
        notify("Insufficient margin", "error");
        return false;
      }

      const liquidationPrice = calculateLiquidationPrice(
        order.price,
        order.side === "Long",
        order.leverage
      );

      try {
        // Create position
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

        // Create order history
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

        // Update balance (deduct fee)
        const newBalance = balance - fee;
        onBalanceChange(newBalance);

        // Update local state
        if (position) {
          setPositions((prev) => [position, ...prev]);
        }

        notify(
          `${order.side} ${order.size} ${order.coin} @ ${order.price.toFixed(2)} | ${order.leverage}x`,
          "success"
        );

        return true;
      } catch (error) {
        console.error("Failed to place order:", error);
        notify("Failed to place order", "error");
        return false;
      }
    },
    [accountId, balance, getAvailableBalance, onBalanceChange, supabase]
  );

  // Close position
  const closePosition = useCallback(
    async (position: Position, currentPrice: number) => {
      if (!accountId) return false;

      const pnl = calculatePnl(
        position.entry_price,
        currentPrice,
        position.size,
        position.side === "Long"
      );
      const fee = position.size * currentPrice * 0.0005;

      try {
        // Delete position
        const { error: delError } = await supabase
          .from("positions")
          .delete()
          .eq("id", position.id);

        if (delError) throw delError;

        // Create trade history
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

        // Update balance
        const margin = (position.size * position.entry_price) / position.leverage;
        const newBalance = balance + margin + pnl - fee;
        onBalanceChange(newBalance);

        // Update local state
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
    [accountId, balance, onBalanceChange, supabase]
  );

  // Check liquidations
  const checkLiquidations = useCallback(
    async (currentPrices: Record<string, number>) => {
      const toClose: Position[] = [];

      positions.forEach((p) => {
        const price = currentPrices[p.coin];
        if (!price) return;

        if (p.side === "Long" && price <= p.liquidation_price) {
          toClose.push(p);
        } else if (p.side === "Short" && price >= p.liquidation_price) {
          toClose.push(p);
        }
      });

      for (const position of toClose) {
        try {
          // Delete position
          await supabase.from("positions").delete().eq("id", position.id);

          // Record as liquidated
          const loss = -((position.size * position.entry_price) / position.leverage);

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

          notify(`⚠ LIQUIDATED ${position.side} ${position.size} ${position.coin}`, "error");
        } catch (error) {
          console.error("Liquidation error:", error);
        }
      }

      if (toClose.length > 0) {
        loadData();
      }
    },
    [accountId, positions, supabase, loadData]
  );

  // Calculate total equity
  const getTotalEquity = useCallback(
    (currentPrices: Record<string, number>) => {
      let equity = balance;
      positions.forEach((p) => {
        const price = currentPrices[p.coin] || p.entry_price;
        const margin = (p.size * p.entry_price) / p.leverage;
        const pnl = calculatePnl(p.entry_price, price, p.size, p.side === "Long");
        equity += pnl; // margin is already in balance
      });
      return equity;
    },
    [balance, positions]
  );

  return {
    positions,
    history,
    orders,
    loading,
    placeOrder,
    closePosition,
    checkLiquidations,
    getAvailableBalance,
    getTotalEquity,
    refetch: loadData,
  };
}
