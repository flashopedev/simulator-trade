"use client";

import { useState, useCallback, useEffect } from "react";
import { cn, calculateLiquidationPrice, formatNumber, COIN_DECIMALS } from "@/lib/utils";

type OrderTab = "market" | "limit";

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
  const [orderTab, setOrderTab] = useState<OrderTab>("market");
  const [leverage] = useState(10); // Hidden but used internally
  const [marginMode] = useState<"cross" | "isolated">("cross"); // Hidden but used internally
  const [size, setSize] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [sliderPct, setSliderPct] = useState(0);

  const decimals = COIN_DECIMALS[coin] || 2;
  const sizeNum = parseFloat(size) || 0;
  const orderType = orderTab;
  const execPrice = orderType === "limit" ? parseFloat(limitPrice) || price || 0 : price || 0;
  const notional = sizeNum * execPrice;
  const margin = notional / leverage;

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

  const buttonText = orderType === "market"
    ? `${isBuy ? "Buy" : "Sell"} Market`
    : `${isBuy ? "Buy" : "Sell"} Limit`;

  return (
    <div className="flex flex-col bg-s1">
      {/* Order type tabs: Market | Limit */}
      <div className="flex border-b border-brd">
        {(["market", "limit"] as OrderTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setOrderTab(tab)}
            className={cn(
              "flex-1 py-2.5 text-[12px] font-medium capitalize border-b-2 transition-colors",
              orderTab === tab
                ? "text-t1 border-acc"
                : "text-t3 border-transparent hover:text-t2"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-3 space-y-3">
        {/* Buy/Sell toggle */}
        <div className="flex gap-1">
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

        {/* Limit price (only for limit) */}
        {orderTab === "limit" && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-t3 font-medium">Price</span>
              <button
                onClick={() => price && setLimitPrice(price.toFixed(decimals))}
                className="text-[10px] text-acc font-medium hover:underline"
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
              <span className="text-[10px] text-t3 font-medium">USDC</span>
            </div>
          </div>
        )}

        {/* Size */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[10px] text-t3 font-medium">Size</span>
            <span className="text-[10px] text-t3 font-tabular">≈ ${formatNumber(notional)}</span>
          </div>
          <div className="flex items-center bg-s2 border border-brd rounded px-3 focus-within:border-acc transition-colors">
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent py-2 text-[13px] font-medium outline-none font-tabular text-t1"
            />
            <span className="text-[10px] text-t3 font-medium">{coin}</span>
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

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!price || sizeNum <= 0 || margin > availableBalance}
          className={cn(
            "w-full py-3.5 rounded font-bold text-[14px] transition-all disabled:opacity-30 disabled:cursor-not-allowed",
            isBuy ? "bg-acc text-black" : "bg-red text-white"
          )}
        >
          {buttonText}
        </button>

        {/* Order details - minimal like HL */}
        <div className="space-y-1.5 text-[12px] pt-3 border-t border-brd">
          <div className="flex justify-between">
            <span className="text-t3">Order Value</span>
            <span className="text-t2 font-tabular">{notional > 0 ? `$${formatNumber(notional)}` : "N/A"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-t3">Fees</span>
            <span className="text-t2 font-tabular">0.0350% / 0.0100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
