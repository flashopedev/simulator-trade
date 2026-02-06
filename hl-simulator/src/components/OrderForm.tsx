"use client";

import { useState, useCallback, useEffect } from "react";
import { cn, calculateLiquidationPrice, formatNumber, COIN_DECIMALS } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type OrderTab = "market" | "limit";

interface OrderFormProps {
  coin: string;
  price: number | null;
  availableBalance: number;
  currentPositionSize?: number;
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
  currentPositionSize = 0,
  onPlaceOrder
}: OrderFormProps) {
  const [isBuy, setIsBuy] = useState(true);
  const [orderTab, setOrderTab] = useState<OrderTab>("market");
  const [leverage, setLeverage] = useState(10);
  const [marginMode, setMarginMode] = useState<"cross" | "isolated">("cross");
  const [size, setSize] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [sliderPct, setSliderPct] = useState(0);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [tpsl, setTpsl] = useState(false);

  const decimals = COIN_DECIMALS[coin] || 2;
  const sizeNum = parseFloat(size) || 0;
  const orderType = orderTab;
  const execPrice = orderType === "limit" ? parseFloat(limitPrice) || price || 0 : price || 0;
  const notional = sizeNum * execPrice;
  const margin = notional / leverage;
  const liqPrice = execPrice > 0 && sizeNum > 0
    ? calculateLiquidationPrice(execPrice, isBuy, leverage)
    : null;

  const handleSlider = useCallback(
    (pct: number) => {
      setSliderPct(pct);
      if (!price || availableBalance <= 0) return;
      const maxNotional = availableBalance * leverage;
      const maxSize = maxNotional / price;
      setSize((maxSize * (pct / 100)).toFixed(4));
    },
    [price, availableBalance, leverage]
  );

  const handleSubmit = () => {
    if (!price || sizeNum <= 0) return;
    if (orderType === "limit" && !parseFloat(limitPrice)) return;
    if (margin > availableBalance) return;

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
    setSliderPct(0);
  };

  useEffect(() => {
    if (price && orderType === "limit" && !limitPrice) {
      setLimitPrice(price.toFixed(decimals));
    }
  }, [price, orderType, decimals, limitPrice]);

  return (
    <div className="flex flex-col bg-s1">
      {/* FIX 1: Cross | 10x | Classic - TOP OF SIDEBAR */}
      <div className="flex border-b border-brd">
        <button
          onClick={() => setMarginMode("cross")}
          className={cn(
            "flex-1 py-2 text-[12px] font-medium text-center border-r border-brd transition-colors",
            marginMode === "cross" ? "text-t1 bg-s2" : "text-t3 hover:text-t2"
          )}
        >
          Cross
        </button>
        <button
          className="flex-1 py-2 text-[12px] font-medium text-center border-r border-brd text-acc bg-s2"
        >
          {leverage}x
        </button>
        <button
          onClick={() => setMarginMode("isolated")}
          className={cn(
            "flex-1 py-2 text-[12px] font-medium text-center transition-colors",
            marginMode === "isolated" ? "text-t1 bg-s2" : "text-t3 hover:text-t2"
          )}
        >
          Classic
        </button>
      </div>

      {/* FIX 2: Order type tabs: Market | Limit | Pro */}
      <div className="flex border-b border-brd">
        <button
          onClick={() => setOrderTab("market")}
          className={cn(
            "flex-1 py-2.5 text-[12px] font-medium capitalize border-b-2 transition-colors",
            orderTab === "market"
              ? "text-t1 border-acc"
              : "text-t3 border-transparent hover:text-t2"
          )}
        >
          Market
        </button>
        <button
          onClick={() => setOrderTab("limit")}
          className={cn(
            "flex-1 py-2.5 text-[12px] font-medium capitalize border-b-2 transition-colors",
            orderTab === "limit"
              ? "text-t1 border-acc"
              : "text-t3 border-transparent hover:text-t2"
          )}
        >
          Limit
        </button>
        <button
          disabled
          className="flex-1 py-2.5 text-[12px] font-medium text-t4 border-b-2 border-transparent cursor-not-allowed flex items-center justify-center gap-1"
        >
          Pro <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* FIX 3: Buy / Long | Sell / Short toggle */}
        <div className="flex gap-1">
          <button
            onClick={() => setIsBuy(true)}
            className={cn(
              "flex-1 py-2.5 rounded text-[13px] font-bold transition-all",
              isBuy ? "bg-acc text-black" : "bg-s3 text-t3 hover:text-t2"
            )}
          >
            Buy / Long
          </button>
          <button
            onClick={() => setIsBuy(false)}
            className={cn(
              "flex-1 py-2.5 rounded text-[13px] font-bold transition-all",
              !isBuy ? "bg-red text-white" : "bg-s3 text-t3 hover:text-t2"
            )}
          >
            Sell / Short
          </button>
        </div>

        {/* Available to Trade */}
        <div className="flex justify-between text-[12px]">
          <span className="text-t3">Available to Trade</span>
          <span className="text-t1 font-tabular">{formatNumber(availableBalance)} USDC</span>
        </div>

        {/* FIX 4: Current Position */}
        <div className="flex justify-between text-[12px]">
          <span className="text-t3">Current Position</span>
          <span className="text-t1 font-tabular">
            {currentPositionSize !== 0 ? `${currentPositionSize.toFixed(2)} ${coin}` : `0.00 ${coin}`}
          </span>
        </div>

        {/* Limit price (only for limit) */}
        {orderTab === "limit" && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[11px] text-t3">Price</span>
              <button
                onClick={() => price && setLimitPrice(price.toFixed(decimals))}
                className="text-[11px] text-acc font-medium hover:underline"
              >
                Last
              </button>
            </div>
            <div className="flex items-center bg-s2 border border-brd rounded px-3 focus-within:border-acc transition-colors">
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent py-2 text-[13px] font-medium outline-none font-tabular text-t1"
              />
              <span className="text-[11px] text-t3">USDC</span>
            </div>
          </div>
        )}

        {/* Size */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-t3">Size</span>
            <span className="text-[11px] text-t3 font-tabular">≈ ${formatNumber(notional)}</span>
          </div>
          <div className="flex items-center bg-s2 border border-brd rounded px-3 focus-within:border-acc transition-colors">
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent py-2 text-[13px] font-medium outline-none font-tabular text-t1"
            />
            <span className="text-[11px] text-t3">{coin}</span>
          </div>
        </div>

        {/* Slider */}
        <div>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPct}
            onChange={(e) => handleSlider(parseInt(e.target.value))}
            className="w-full h-1"
          />
          <div className="flex justify-between mt-1">
            {[0, 25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => handleSlider(pct)}
                className={cn(
                  "text-[9px] font-medium py-0.5 px-1.5 rounded transition-colors",
                  sliderPct === pct ? "text-acc bg-acc/10" : "text-t4 hover:text-t2"
                )}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* FIX 5: Reduce Only + Take Profit / Stop Loss */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-[11px] text-t2 cursor-pointer">
            <input
              type="checkbox"
              checked={reduceOnly}
              onChange={(e) => setReduceOnly(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-brd accent-acc"
            />
            Reduce Only
          </label>
          <label className="flex items-center gap-1.5 text-[11px] text-t2 cursor-pointer">
            <input
              type="checkbox"
              checked={tpsl}
              onChange={(e) => setTpsl(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-brd accent-acc"
            />
            Take Profit / Stop Loss
          </label>
        </div>

        {/* FIX 12: Submit button - "Buy / Long" not "Buy Market" */}
        <button
          onClick={handleSubmit}
          disabled={!price || sizeNum <= 0 || margin > availableBalance}
          className={cn(
            "w-full py-3 rounded font-bold text-[14px] transition-all disabled:opacity-30 disabled:cursor-not-allowed",
            isBuy ? "bg-acc text-black" : "bg-red text-white"
          )}
        >
          {isBuy ? "Buy / Long" : "Sell / Short"}
        </button>

        {/* FIX 6: Full order details */}
        <div className="space-y-1.5 text-[12px] pt-3 border-t border-brd">
          <div className="flex justify-between">
            <span className="text-t3">Liquidation Price</span>
            <span className="text-t1 font-tabular">
              {liqPrice ? liqPrice.toFixed(decimals) : "N/A"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-t3">Order Value</span>
            <span className="text-t2 font-tabular">
              {notional > 0 ? `$${formatNumber(notional)}` : "N/A"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-t3">Margin Required</span>
            <span className="text-t2 font-tabular">
              {margin > 0 ? `$${formatNumber(margin)}` : "N/A"}
            </span>
          </div>
          {/* FIX 14: Slippage instead of Fees */}
          <div className="flex justify-between">
            <span className="text-t3">Slippage</span>
            <span className="text-acc font-tabular">Est: 0% / Max: 8.00%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
