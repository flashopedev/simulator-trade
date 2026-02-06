"use client";

import { useState, useCallback, useEffect } from "react";
import { cn, calculateLiquidationPrice, formatNumber, COIN_DECIMALS } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";
import { ConfirmOrderModal } from "./ConfirmOrderModal";
import { AdjustLeverageModal } from "./AdjustLeverageModal";

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
    tpPrice?: number;
    slPrice?: number;
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
  const [tpPrice, setTpPrice] = useState("");
  const [slPrice, setSlPrice] = useState("");

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLeverageModal, setShowLeverageModal] = useState(false);

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

    const skipConfirm = localStorage.getItem("skipOrderConfirm") === "true";
    if (skipConfirm) {
      executeOrder();
    } else {
      setShowConfirmModal(true);
    }
  };

  const executeOrder = () => {
    onPlaceOrder({
      side: isBuy ? "Long" : "Short",
      size: sizeNum,
      price: execPrice,
      leverage,
      orderType,
      marginMode,
      tpPrice: tpsl && parseFloat(tpPrice) ? parseFloat(tpPrice) : undefined,
      slPrice: tpsl && parseFloat(slPrice) ? parseFloat(slPrice) : undefined,
    });
    setSize("");
    setLimitPrice("");
    setSliderPct(0);
    setTpPrice("");
    setSlPrice("");
    setShowConfirmModal(false);
  };

  const handleLeverageConfirm = (newLeverage: number) => {
    setLeverage(newLeverage);
  };

  useEffect(() => {
    if (price && orderType === "limit" && !limitPrice) {
      setLimitPrice(price.toFixed(decimals));
    }
  }, [price, orderType, decimals, limitPrice]);

  return (
    <>
      <div className="flex flex-col bg-s1">
        {/* Cross | Nx | Classic - exact real HL style */}
        <div className="flex gap-2 px-3 py-2">
          <button
            onClick={() => setMarginMode("cross")}
            className="flex-1 h-[33px] text-[12px] font-normal text-center rounded-[8px] text-white bg-[#273035] border border-transparent transition-colors hover:brightness-110"
          >
            Cross
          </button>
          <button
            onClick={() => setShowLeverageModal(true)}
            className="flex-1 h-[33px] text-[12px] font-normal text-center text-acc rounded-[8px] bg-[#273035] border border-transparent transition-colors hover:brightness-110 cursor-pointer"
          >
            {leverage}x
          </button>
          <button
            onClick={() => setMarginMode("isolated")}
            className="flex-1 h-[33px] text-[12px] font-normal text-center rounded-[8px] text-white bg-[#273035] border border-transparent transition-colors hover:brightness-110"
          >
            Classic
          </button>
        </div>

        {/* Order type tabs: Market | Limit | Pro */}
        <div className="flex items-center px-3 border-b border-brd">
          <button
            onClick={() => setOrderTab("market")}
            className={cn(
              "px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors",
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
              "px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors",
              orderTab === "limit"
                ? "text-t1 border-t1"
                : "text-t3 border-transparent hover:text-t2"
            )}
          >
            Limit
          </button>
          <div className="ml-auto flex items-center">
            <span className="text-[13px] font-medium text-t3 flex items-center gap-0.5 cursor-pointer hover:text-t2">
              Pro <ChevronDown className="w-3 h-3" />
            </span>
          </div>
        </div>

        <div className="p-3 space-y-3">
          {/* Buy / Long | Sell / Short - INSIDE gray container like real HL */}
          <div className="flex bg-[#1e2a30] rounded-lg p-0.5">
            <button
              onClick={() => setIsBuy(true)}
              className={cn(
                "flex-1 py-2.5 text-[13px] font-semibold transition-all rounded-md",
                isBuy
                  ? "bg-acc text-[#02231e]"
                  : "bg-transparent text-t2 hover:text-t1"
              )}
            >
              Buy / Long
            </button>
            <button
              onClick={() => setIsBuy(false)}
              className={cn(
                "flex-1 py-2.5 text-[13px] font-semibold transition-all rounded-md",
                !isBuy
                  ? "bg-red text-white"
                  : "bg-transparent text-t2 hover:text-t1"
              )}
            >
              Sell / Short
            </button>
          </div>

          {/* Available to Trade */}
          <div className="flex justify-between text-[12px]">
            <span className="text-t3">Available to Trade</span>
            <span className="text-t1 font-tabular">{formatNumber(availableBalance).replace(".", ",")} USDC</span>
          </div>

          {/* Current Position */}
          <div className="flex justify-between text-[12px]">
            <span className="text-t3">Current Position</span>
            <span className={cn(
              "font-tabular",
              currentPositionSize > 0 ? "text-acc" : currentPositionSize < 0 ? "text-red" : "text-t1"
            )}>
              {currentPositionSize !== 0 ? `${currentPositionSize.toFixed(2).replace(".", ",")} ${coin}` : `0,00 ${coin}`}
            </span>
          </div>

          {/* Size input - with dark background like real HL */}
          <div className="flex items-center bg-[#1e2a30] rounded-lg px-3 py-2">
            <span className="text-[12px] text-t3 mr-2">Size</span>
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-[14px] font-medium outline-none font-tabular text-t1 text-right"
            />
            <div className="flex items-center gap-1 text-[12px] text-t3 ml-2">
              <span>USDC</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          {/* Approximate value */}
          <div className="flex justify-end">
            <span className="text-[11px] text-t4 font-tabular">≈ ${formatNumber(notional).replace(".", ",")}</span>
          </div>

          {/* Slider - matching real HL exactly with 5 dots */}
          <div className="py-1">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative h-6 flex items-center">
                {/* Circular thumb */}
                <div
                  className="absolute z-20 w-[18px] h-[18px] rounded-full border-2 border-acc bg-[#0d1214] cursor-pointer"
                  style={{ left: `calc(${sliderPct}% - 9px)` }}
                />
                {/* Track background */}
                <div className="absolute left-0 right-0 h-[4px] bg-[#3a4449] rounded-full" />
                {/* Track fill */}
                <div
                  className="absolute left-0 h-[4px] bg-acc rounded-full"
                  style={{ width: `${sliderPct}%` }}
                />
                {/* 5 dots at 0%, 25%, 50%, 75%, 100% */}
                <div className="absolute left-0 right-0 flex items-center justify-between">
                  {[0, 25, 50, 75, 100].map((step) => (
                    <button
                      key={step}
                      onClick={() => handleSlider(step)}
                      className={cn(
                        "w-[8px] h-[8px] rounded-full transition-all z-10",
                        sliderPct >= step ? "bg-acc" : "bg-[#4a5459]"
                      )}
                    />
                  ))}
                </div>
                {/* Invisible range input */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPct}
                  onChange={(e) => handleSlider(parseInt(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-30"
                />
              </div>
              {/* % input box */}
              <div className="flex items-center bg-[#1e2a30] rounded-lg px-3 py-2 min-w-[65px]">
                <input
                  type="number"
                  value={sliderPct}
                  onChange={(e) => handleSlider(parseInt(e.target.value) || 0)}
                  className="w-6 bg-transparent text-[13px] text-t1 font-tabular outline-none text-right"
                />
                <span className="text-[12px] text-t3 ml-1">%</span>
              </div>
            </div>
          </div>

          {/* Reduce Only checkbox - custom checkbox like real HL */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className={cn(
              "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
              reduceOnly ? "bg-acc border-acc" : "border-[#4a5459] bg-transparent"
            )}>
              {reduceOnly && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
            </div>
            <span className="text-[12px] text-t2">Reduce Only</span>
          </label>

          {/* Take Profit / Stop Loss checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div className={cn(
              "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
              tpsl ? "bg-acc border-acc" : "border-acc bg-transparent"
            )}>
              {tpsl && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
            </div>
            <span className="text-[12px] text-t2">Take Profit / Stop Loss</span>
          </label>

          {/* TP/SL Fields - exact 50/50 like real HL */}
          <div className="space-y-2">
            {/* TP Price row - both fields equal width, height 33px */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center h-[33px] bg-transparent rounded-[8px] px-3 border border-[#273035]">
                <span className="text-[12px] text-t3 mr-2 whitespace-nowrap">TP Price</span>
                <input
                  type="number"
                  value={tpPrice}
                  onChange={(e) => setTpPrice(e.target.value)}
                  disabled={!tpsl}
                  className="flex-1 bg-transparent text-[13px] outline-none font-tabular text-t1 text-right disabled:opacity-50"
                />
              </div>
              <div className="flex-1 flex items-center h-[33px] bg-transparent rounded-[8px] px-3 border border-[#273035] justify-between">
                <span className="text-[12px] text-t3">Gain</span>
                <div className="flex items-center gap-1">
                  <span className="text-[12px] text-t3">%</span>
                  <ChevronDown className="w-3 h-3 text-t4" />
                </div>
              </div>
            </div>

            {/* SL Price row - both fields equal width, height 33px */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center h-[33px] bg-transparent rounded-[8px] px-3 border border-[#273035]">
                <span className="text-[12px] text-t3 mr-2 whitespace-nowrap">SL Price</span>
                <input
                  type="number"
                  value={slPrice}
                  onChange={(e) => setSlPrice(e.target.value)}
                  disabled={!tpsl}
                  className="flex-1 bg-transparent text-[13px] outline-none font-tabular text-t1 text-right disabled:opacity-50"
                />
              </div>
              <div className="flex-1 flex items-center h-[33px] bg-transparent rounded-[8px] px-3 border border-[#273035] justify-between">
                <span className="text-[12px] text-t3">Loss</span>
                <div className="flex items-center gap-1">
                  <span className="text-[12px] text-t3">%</span>
                  <ChevronDown className="w-3 h-3 text-t4" />
                </div>
              </div>
            </div>
          </div>

          {/* Place Order button */}
          <button
            onClick={handleSubmit}
            disabled={!price || sizeNum <= 0 || margin > availableBalance}
            className={cn(
              "w-full py-3 rounded-lg font-semibold text-[14px] transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-2",
              isBuy ? "bg-acc text-[#02231e]" : "bg-red text-white"
            )}
          >
            Place Order
          </button>

          {/* Order info below button */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-t3 border-b border-dotted border-t4">Liquidation Price</span>
              <span className="text-t1 font-tabular">{liqPrice ? liqPrice.toFixed(decimals).replace(".", ",") : "N/A"}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-t3">Order Value</span>
              <span className="text-t1 font-tabular">{notional > 0 ? `${formatNumber(notional).replace(".", ",")} USDC` : "N/A"}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-t3">Margin Required</span>
              <span className="text-t1 font-tabular">{margin > 0 ? `${formatNumber(margin).replace(".", ",")} USDC` : "N/A"}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-t3 border-b border-dotted border-t4">Slippage</span>
              <span className="text-acc font-tabular">Est: 0% / Max: 8,00%</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-t3 border-b border-dotted border-t4">Fees</span>
              <span className="text-t1 font-tabular">0,0450% / 0,0150%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Order Modal */}
      <ConfirmOrderModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeOrder}
        action={isBuy ? "Long" : "Short"}
        size={sizeNum}
        coin={coin}
        price={orderType === "market" ? "Market" : execPrice}
        liquidationPrice={liqPrice}
        orderType={orderType}
      />

      {/* Adjust Leverage Modal */}
      <AdjustLeverageModal
        isOpen={showLeverageModal}
        onClose={() => setShowLeverageModal(false)}
        onConfirm={handleLeverageConfirm}
        currentLeverage={leverage}
        coin={coin}
        maxLeverage={40}
      />
    </>
  );
}
