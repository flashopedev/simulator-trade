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

export function OrderForm({ coin, price, availableBalance, onPlaceOrder }: OrderFormProps) {
  const [isBuy, setIsBuy] = useState(true);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [leverage, setLeverage] = useState(10);
  const [marginMode, setMarginMode] = useState<"cross" | "isolated">("cross");
  const [size, setSize] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [sliderPct, setSliderPct] = useState(0);

  const decimals = COIN_DECIMALS[coin] || 2;
  const sizeNum = parseFloat(size) || 0;
  const execPrice = orderType === "limit" ? parseFloat(limitPrice) || price || 0 : price || 0;
  const notional = sizeNum * execPrice;
  const fee = notional * 0.0005;
  const liqPrice = execPrice > 0 ? calculateLiquidationPrice(execPrice, isBuy, leverage) : null;

  const handleSlider = useCallback(
    (pct: number) => {
      setSliderPct(pct);
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
    setSliderPct(0);
  };

  useEffect(() => {
    if (price && orderType === "limit" && !limitPrice) {
      setLimitPrice(price.toFixed(decimals));
    }
  }, [price, orderType, decimals, limitPrice]);

  return (
    <div className="flex flex-col bg-s1">
      {/* Order type tabs */}
      <div className="flex border-b border-brd">
        {(["market", "limit"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={cn(
              "flex-1 py-2.5 text-[12px] font-medium capitalize border-b-2 transition-colors",
              orderType === type
                ? "text-t1 border-acc"
                : "text-t3 border-transparent hover:text-t2"
            )}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="p-3 space-y-3">
        {/* Buy/Sell toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsBuy(true)}
            className={cn(
              "flex-1 py-2.5 rounded text-[13px] font-bold transition-all",
              isBuy ? "bg-acc text-black" : "bg-s3 text-t3 hover:text-t2"
            )}
          >
            Buy
          </button>
          <button
            onClick={() => setIsBuy(false)}
            className={cn(
              "flex-1 py-2.5 rounded text-[13px] font-bold transition-all",
              !isBuy ? "bg-red text-white" : "bg-s3 text-t3 hover:text-t2"
            )}
          >
            Sell
          </button>
        </div>

        {/* Available to Trade */}
        <div className="flex justify-between text-[11px]">
          <span className="text-t3">Available to Trade</span>
          <span className="text-t1 font-tabular">{formatNumber(availableBalance)} USDC</span>
        </div>

        {/* Leverage */}
        <div className="bg-s2 border border-brd rounded p-2.5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] text-t3 font-medium uppercase tracking-wide">Leverage</span>
            <span className="text-[13px] font-bold text-acc">{leverage}x</span>
          </div>
          <input type="range" min="1" max="50" value={leverage} onChange={(e) => setLeverage(parseInt(e.target.value))} className="w-full h-1" />
          <div className="flex justify-between mt-1.5">
            {[1, 5, 10, 25, 50].map((v) => (
              <button key={v} onClick={() => setLeverage(v)} className={cn("text-[9px] font-medium py-0.5 px-1 rounded transition-colors", leverage === v ? "text-acc bg-acc/10" : "text-t4 hover:text-t2")}>{v}x</button>
            ))}
          </div>
          <div className="flex gap-1 mt-2">
            {(["cross", "isolated"] as const).map((mode) => (
              <button key={mode} onClick={() => setMarginMode(mode)} className={cn("px-2 py-1 text-[9px] font-semibold rounded border capitalize transition-colors", marginMode === mode ? "border-acc text-acc bg-acc/10" : "border-brd text-t4")}>{mode}</button>
            ))}
          </div>
        </div>

        {/* Limit price */}
        {orderType === "limit" && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-t3 font-medium">Price (USDC)</span>
              <button onClick={() => price && setLimitPrice(price.toFixed(decimals))} className="text-[10px] text-blu font-medium hover:underline">Mid</button>
            </div>
            <div className="flex items-center bg-s2 border border-brd rounded px-3 focus-within:border-acc transition-colors">
              <input type="number" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder="0.00" className="flex-1 bg-transparent py-2 text-[13px] font-medium outline-none font-tabular text-t1" />
              <span className="text-[10px] text-t3 font-medium">USDC</span>
            </div>
          </div>
        )}

        {/* Size */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] text-t3 font-medium">Size</span>
            <span className="text-[10px] text-t3 font-tabular">{"\u2248"} ${formatNumber(notional)}</span>
          </div>
          <div className="flex items-center bg-s2 border border-brd rounded px-3 focus-within:border-acc transition-colors">
            <input type="number" value={size} onChange={(e) => setSize(e.target.value)} placeholder="0.00" className="flex-1 bg-transparent py-2 text-[13px] font-medium outline-none font-tabular text-t1" />
            <span className="text-[10px] text-t3 font-medium">{coin}</span>
          </div>
        </div>

        {/* Slider */}
        <div>
          <input type="range" min="0" max="100" value={sliderPct} onChange={(e) => handleSlider(parseInt(e.target.value))} className="w-full h-1" />
          <div className="text-[10px] text-t3 text-right font-tabular">{sliderPct}%</div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!price || sizeNum <= 0 || (notional / leverage + fee > availableBalance)}
          className={cn(
            "w-full py-3.5 rounded font-bold text-[14px] transition-all disabled:opacity-30 disabled:cursor-not-allowed",
            isBuy ? "bg-acc text-black" : "bg-red text-white"
          )}
        >
          {isBuy ? "Buy" : "Sell"} {orderType === "market" ? "Market" : "Limit"}
        </button>

        {/* Order details */}
        <div className="space-y-1.5 text-[11px] pt-2 border-t border-brd">
          <div className="flex justify-between">
            <span className="text-t3">Order Value</span>
            <span className="text-t2 font-tabular">{notional > 0 ? `$${formatNumber(notional)}` : "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-t3">Slippage</span>
            <span className="text-t2 font-tabular">Est: 0% / Max: 8.00%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-t3">Fees</span>
            <span className="text-t2 font-tabular">0.0700% / 0.0400%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-t3">Est. Liq. Price</span>
            <span className="text-red font-semibold font-tabular">{liqPrice ? liqPrice.toFixed(decimals) : "\u2014"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
