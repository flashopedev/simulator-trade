"use client";

import { useState, useCallback, useEffect } from "react";
import { cn, calculateLiquidationPrice, formatNumber, COIN_DECIMALS } from "@/lib/utils";

interface OrderFormProps {
  coin: string;
  price: number | null;
  availableBalance: number;
  onPlaceOrder: (order: {
    side: "Long" | "Short";
    size: number;
    price: number;
    leverage: number;
    orderType: "market" | "limit";
    marginMode: "cross" | "isolated";
  }) => void;
}

export function OrderForm({
  coin,
  price,
  availableBalance,
  onPlaceOrder,
}: OrderFormProps) {
  const [isBuy, setIsBuy] = useState(true);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [leverage, setLeverage] = useState(10);
  const [marginMode, setMarginMode] = useState<"cross" | "isolated">("cross");
  const [size, setSize] = useState("");
  const [limitPrice, setLimitPrice] = useState("");

  const decimals = COIN_DECIMALS[coin] || 2;
  const sizeNum = parseFloat(size) || 0;
  const execPrice = orderType === "limit" ? parseFloat(limitPrice) || price || 0 : price || 0;
  const notional = sizeNum * execPrice;
  const fee = notional * 0.0005;
  const liqPrice = execPrice > 0 ? calculateLiquidationPrice(execPrice, isBuy, leverage) : null;

  const handlePercentage = useCallback(
    (pct: number) => {
      if (!price || availableBalance <= 0) return;
      const maxNotional = availableBalance * leverage;
      const maxSize = maxNotional / price;
      setSize((maxSize * (pct / 100)).toFixed(2));
    },
    [price, availableBalance, leverage]
  );

  const handleSubmit = () => {
    if (!price || sizeNum <= 0) return;
    if (orderType === "limit" && !parseFloat(limitPrice)) return;

    const margin = notional / leverage;
    if (margin + fee > availableBalance) return;

    onPlaceOrder({
      side: isBuy ? "Long" : "Short",
      size: sizeNum,
      price: execPrice,
      leverage,
      orderType,
      marginMode,
    });

    setSize("");
    setLimitPrice("");
  };

  // Reset limit price when price changes
  useEffect(() => {
    if (price && orderType === "limit" && !limitPrice) {
      setLimitPrice(price.toFixed(decimals));
    }
  }, [price, orderType, decimals, limitPrice]);

  return (
    <div className="p-2 flex-shrink-0">
      {/* Side tabs */}
      <div className="flex bg-s2 rounded p-0.5 mb-2">
        <button
          onClick={() => setIsBuy(true)}
          className={cn(
            "flex-1 py-2 md:py-1.5 rounded font-bold text-[13px] md:text-[11px] transition-colors",
            isBuy ? "bg-grn text-black" : "text-t4"
          )}
        >
          Long
        </button>
        <button
          onClick={() => setIsBuy(false)}
          className={cn(
            "flex-1 py-2 md:py-1.5 rounded font-bold text-[13px] md:text-[11px] transition-colors",
            !isBuy ? "bg-red text-white" : "text-t4"
          )}
        >
          Short
        </button>
      </div>

      {/* Order type */}
      <div className="flex gap-0.5 mb-2">
        {(["market", "limit"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={cn(
              "px-2 py-1 text-[10px] font-medium rounded capitalize transition-colors",
              orderType === type ? "text-t1 bg-s4" : "text-t4"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Leverage */}
      <div className="mb-2 p-2 bg-s1 border border-brd rounded">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] text-t3 font-medium uppercase tracking-wide">
            Leverage
          </span>
          <span className="text-[14px] md:text-[12px] font-bold text-acc">
            {leverage}x
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="50"
          value={leverage}
          onChange={(e) => setLeverage(parseInt(e.target.value))}
          className="w-full h-1.5 md:h-1"
        />
        <div className="flex justify-between mt-1">
          {[1, 5, 10, 25, 50].map((v) => (
            <button
              key={v}
              onClick={() => setLeverage(v)}
              className="text-[10px] md:text-[8px] text-t4 hover:text-acc transition-colors py-1"
            >
              {v}x
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 mt-2">
          {(["cross", "isolated"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setMarginMode(mode)}
              className={cn(
                "px-2 py-1 text-[9px] font-semibold rounded border capitalize transition-colors",
                marginMode === mode
                  ? "border-acc text-acc bg-acc/10"
                  : "border-brd text-t4"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Limit price */}
      {orderType === "limit" && (
        <div className="mb-2">
          <div className="text-[9px] text-t4 font-medium mb-1">Price</div>
          <div className="flex items-center bg-s2 border border-brd rounded px-2 focus-within:border-t4 transition-colors">
            <input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder="Limit price"
              className="flex-1 bg-transparent py-2.5 md:py-1.5 text-[14px] md:text-[11px] font-medium outline-none font-tabular"
            />
            <span className="text-[10px] md:text-[9px] text-t4 font-medium">USD</span>
          </div>
        </div>
      )}

      {/* Size */}
      <div className="mb-2">
        <div className="flex justify-between text-[9px] text-t4 font-medium mb-1">
          <span>Size</span>
          <span className="text-t2">≈ ${formatNumber(notional)}</span>
        </div>
        <div className="flex items-center bg-s2 border border-brd rounded px-2 focus-within:border-t4 transition-colors">
          <input
            type="number"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent py-2.5 md:py-1.5 text-[14px] md:text-[11px] font-medium outline-none font-tabular"
          />
          <span className="text-[10px] md:text-[9px] text-t4 font-medium">{coin}</span>
        </div>
      </div>

      {/* Percentages */}
      <div className="flex gap-1 mb-2">
        {[25, 50, 75, 100].map((pct) => (
          <button
            key={pct}
            onClick={() => handlePercentage(pct)}
            className="flex-1 py-1.5 md:py-1 bg-s2 border border-brd rounded text-[11px] md:text-[9px] text-t4 font-medium hover:border-t4 hover:text-t2 transition-colors"
          >
            {pct}%
          </button>
        ))}
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!price || sizeNum <= 0 || (notional / leverage + fee > availableBalance)}
        className={cn(
          "w-full py-3.5 md:py-2 rounded font-bold text-[14px] md:text-[11px] transition-all disabled:opacity-35 disabled:cursor-not-allowed",
          isBuy
            ? "bg-grn text-black hover:brightness-110"
            : "bg-red text-white hover:brightness-110"
        )}
      >
        {isBuy ? "Long" : "Short"} {coin}-USD
      </button>

      {/* Order info */}
      <div className="mt-2 space-y-1 text-[10px] md:text-[9px] text-t4">
        <div className="flex justify-between">
          <span>Available</span>
          <span className="text-t2 font-tabular">
            {formatNumber(availableBalance)} USDC
          </span>
        </div>
        <div className="flex justify-between">
          <span>Fee (0.05%)</span>
          <span className="text-t2 font-tabular">${formatNumber(fee)}</span>
        </div>
        <div className="flex justify-between">
          <span>Est. Liq. Price</span>
          <span className="text-red font-semibold font-tabular">
            {liqPrice ? liqPrice.toFixed(decimals) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
