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
      {/* B3: Cross | 10x | Classic - exact proportions */}
      <div className="flex border-b border-brd">
        <button
          onClick={() => setMarginMode("cross")}
          className={cn(
            "flex-1 py-2.5 text-[14px] font-medium text-center border-r border-brd transition-colors",
            marginMode === "cross" ? "text-t1" : "text-t3 hover:text-t2"
          )}
        >
          Cross
        </button>
        <button
          className="flex-1 py-2.5 text-[14px] font-medium text-center border-r border-brd text-acc"
        >
          {leverage}x
        </button>
        <button
          onClick={() => setMarginMode("isolated")}
          className={cn(
            "flex-1 py-2.5 text-[14px] font-medium text-center transition-colors",
            marginMode === "isolated" ? "text-t1" : "text-t3 hover:text-t2"
          )}
        >
          Classic
        </button>
      </div>

      {/* B4: Order type tabs: Market | Limit | Pro */}
      <div className="flex border-b border-brd">
        <button
          onClick={() => setOrderTab("market")}
          className={cn(
            "flex-1 px-6 py-3 text-[14px] font-medium border-b-2 transition-colors",
            orderTab === "market"
              ? "text-t1 border-t1"
              : "text-t3 border-transparent hover:text-t2"
          )}
        >
          Market
        </button>
        <button
          onClick={() => setOrderTab("limit")}
          className={cn(
            "flex-1 px-6 py-3 text-[14px] font-medium border-b-2 transition-colors",
            orderTab === "limit"
              ? "text-t1 border-t1"
              : "text-t3 border-transparent hover:text-t2"
          )}
        >
          Limit
        </button>
        <button
          disabled
          className="flex-1 px-6 py-3 text-[14px] font-medium text-t3 border-b-2 border-transparent cursor-not-allowed flex items-center justify-center gap-1"
        >
          Pro <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* B5: Buy / Long | Sell / Short - exact style */}
        <div className="flex">
          <button
            onClick={() => setIsBuy(true)}
            className={cn(
              "flex-1 py-2.5 text-[14px] font-bold transition-all rounded-l-md",
              isBuy
                ? "bg-acc text-black"
                : "bg-transparent text-t3 border border-brd border-r-0 hover:text-t2"
            )}
          >
            Buy / Long
          </button>
          <button
            onClick={() => setIsBuy(false)}
            className={cn(
              "flex-1 py-2.5 text-[14px] font-bold transition-all rounded-r-md",
              !isBuy
                ? "bg-red text-white"
                : "bg-transparent text-t3 border border-brd border-l-0 hover:text-t2"
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

        {/* Current Position */}
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
              <span className="text-[12px] text-t3">Price</span>
              <button
                onClick={() => price && setLimitPrice(price.toFixed(decimals))}
                className="text-[12px] text-acc font-medium hover:underline"
              >
                Last
              </button>
            </div>
            <div className="flex items-center bg-transparent border border-brd rounded px-3 focus-within:border-acc transition-colors">
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent py-2 text-[14px] font-medium outline-none font-tabular text-t1"
              />
              <span className="text-[12px] text-t3">USDC</span>
            </div>
          </div>
        )}

        {/* B6: Size input */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[12px] text-t3">Size</span>
            <span className="text-[12px] text-t3 font-tabular">≈ ${formatNumber(notional)}</span>
          </div>
          <div className="flex items-center bg-transparent border border-brd rounded px-3 focus-within:border-acc transition-colors">
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent py-2 text-[14px] font-medium outline-none font-tabular text-t1"
            />
            <div className="flex items-center gap-1 text-[12px] text-t3">
              <span>{coin}</span>
              <ChevronDown className="w-3 h-3" />
            </div>
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
            className="w-full h-1 bg-s3 rounded-full appearance-none cursor-pointer accent-acc"
            style={{
              background: `linear-gradient(to right, var(--acc) ${sliderPct}%, var(--s3) ${sliderPct}%)`
            }}
          />
          <div className="flex justify-between mt-1.5">
            {[0, 25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => handleSlider(pct)}
                className={cn(
                  "text-[10px] font-medium py-0.5 px-1.5 rounded transition-colors",
                  sliderPct === pct ? "text-acc bg-acc/10" : "text-t4 hover:text-t2"
                )}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Reduce Only + Take Profit / Stop Loss */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-[12px] text-t2 cursor-pointer">
            <input
              type="checkbox"
              checked={reduceOnly}
              onChange={(e) => setReduceOnly(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-brd accent-acc"
            />
            Reduce Only
          </label>
          <label className="flex items-center gap-1.5 text-[12px] text-t2 cursor-pointer">
            <input
              type="checkbox"
              checked={tpsl}
              onChange={(e) => setTpsl(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-brd accent-acc"
            />
            Take Profit / Stop Loss
          </label>
        </div>

        {/* B7: Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!price || sizeNum <= 0 || margin > availableBalance}
          className={cn(
            "w-full py-3.5 rounded font-bold text-[15px] transition-all disabled:opacity-30 disabled:cursor-not-allowed",
            isBuy ? "bg-acc text-black" : "bg-red text-white"
          )}
        >
          {isBuy ? "Buy / Long" : "Sell / Short"}
        </button>

        {/* Order details with dotted underline labels (C2) */}
        <div className="space-y-2 text-[12px] pt-3 border-t border-brd">
          <div className="flex justify-between">
            <span className="text-t3 border-b border-dotted border-t4 cursor-help">
              Liquidation Price
            </span>
            <span className="text-t1 font-tabular">
              {liqPrice ? liqPrice.toFixed(decimals) : "N/A"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-t3 border-b border-dotted border-t4 cursor-help">
              Order Value
            </span>
            <span className="text-t2 font-tabular">
              {notional > 0 ? `$${formatNumber(notional)}` : "N/A"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-t3 border-b border-dotted border-t4 cursor-help">
              Margin Required
            </span>
            <span className="text-t2 font-tabular">
              {margin > 0 ? `$${formatNumber(margin)}` : "N/A"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-t3 border-b border-dotted border-t4 cursor-help">
              Slippage
            </span>
            <span className="text-acc font-tabular">Est: 0% / Max: 8.00%</span>
          </div>
          {/* D1: Fees row */}
          <div className="flex justify-between">
            <span className="text-t3 border-b border-dotted border-t4 cursor-help">
              Fees
            </span>
            <span className="text-t2 font-tabular">0.0350% / 0.0100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
