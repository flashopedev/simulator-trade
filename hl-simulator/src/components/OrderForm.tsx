"use client";

import { useState, useCallback, useEffect } from "react";
import { cn, calculateLiquidationPrice, formatNumber, COIN_DECIMALS, isTradifiCoin, getTradifiSymbol, TRADIFI_MAX_LEVERAGE } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { ConfirmOrderModal } from "./ConfirmOrderModal";
import { AdjustLeverageModal } from "./AdjustLeverageModal";

type OrderTab = "market" | "limit" | "pro";

// Tab index for sliding indicator
const TAB_INDEX: Record<string, number> = { market: 0, limit: 1, pro: 2 };

// Per-coin max leverage matching real HL
const COIN_MAX_LEVERAGE: Record<string, number> = {
  HYPE: 10, BTC: 50, ETH: 50, SOL: 25, DOGE: 20, AVAX: 20,
  LINK: 20, ARB: 15, OP: 15, SUI: 15, WIF: 10, PEPE: 10,
  JUP: 10, TIA: 15, SEI: 10, INJ: 15, RENDER: 10, FET: 10,
  ONDO: 10, STX: 10, NEAR: 15, BONK: 5,
};

// Real HL fee rates
const TAKER_FEE_PCT = 0.045; // 0.045%
const MAKER_FEE_PCT = 0.015; // 0.015%

interface OrderFormProps {
  coin: string;
  price: number | null;
  availableBalance: number;
  totalBalance: number;
  currentPositionSize?: number;
  onPlaceOrder: (order: {
    side: "Long" | "Short";
    size: number;
    price: number;
    leverage: number;
    orderType: "market" | "limit" | "pro";
    marginMode: "cross" | "isolated";
    tpPrice?: number;
    slPrice?: number;
  }) => void;
}

export function OrderForm({
  coin,
  price,
  availableBalance,
  totalBalance,
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
  const maxLeverage = isTradifiCoin(coin) ? (TRADIFI_MAX_LEVERAGE[coin] || 10) : (COIN_MAX_LEVERAGE[coin] || 10);
  const coinDisplayName = isTradifiCoin(coin) ? getTradifiSymbol(coin) : coin;
  const sizeNum = parseFloat(size) || 0;
  const orderType = orderTab;
  const execPrice = orderType === "limit" || orderType === "pro" ? parseFloat(limitPrice) || price || 0 : price || 0;
  const notional = sizeNum * execPrice;
  const margin = notional / leverage;
  const feeRate = orderType === "limit" ? MAKER_FEE_PCT : TAKER_FEE_PCT;
  const liqPrice = execPrice > 0 && sizeNum > 0
    ? calculateLiquidationPrice(execPrice, isBuy, leverage)
    : null;

  // Clamp leverage when coin changes
  useEffect(() => {
    const max = COIN_MAX_LEVERAGE[coin] || 10;
    if (leverage > max) setLeverage(max);
  }, [coin, leverage]);

  const handleSlider = useCallback(
    (pct: number) => {
      setSliderPct(pct);
      if (!price) return;
      const effectiveBalance = availableBalance > 0 ? availableBalance : totalBalance;
      if (effectiveBalance <= 0) return;
      const maxNotional = effectiveBalance * leverage;
      const maxSize = maxNotional / price;
      setSize((maxSize * (pct / 100)).toFixed(decimals));
    },
    [price, availableBalance, totalBalance, leverage, decimals]
  );

  const handleSubmit = () => {
    if (sizeNum <= 0) return;
    if (orderType === "pro") {
      // Pro mode: requires custom price, no market price needed
      if (!parseFloat(limitPrice)) return;
    } else {
      if (!price) return;
      if (orderType === "limit" && !parseFloat(limitPrice)) return;
    }

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
    if (price && (orderType === "limit" || orderType === "pro") && !limitPrice) {
      setLimitPrice(price.toFixed(decimals));
    }
  }, [price, orderType, decimals, limitPrice]);

  const tabIdx = TAB_INDEX[orderTab] ?? 0;

  return (
    <>
      <div className="flex flex-col bg-s1 h-full">
        {/* Cross | Nx | Classic - exact real HL style */}
        <div className="flex gap-2 px-[10px] py-2">
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

        {/* Order type tabs: Market | Limit | Pro — equal grid with teal sliding indicator */}
        <div className="relative border-b border-[#303030]">
          <div className="grid grid-cols-3">
            <button
              onClick={() => setOrderTab("market")}
              className={cn(
                "h-[35px] text-[12px] font-normal text-center transition-colors",
                orderTab === "market" ? "text-[#f6fefd]" : "text-[#949e9c] hover:text-[#c0c8c6]"
              )}
            >
              Market
            </button>
            <button
              onClick={() => setOrderTab("limit")}
              className={cn(
                "h-[35px] text-[12px] font-normal text-center transition-colors",
                orderTab === "limit" ? "text-[#f6fefd]" : "text-[#949e9c] hover:text-[#c0c8c6]"
              )}
            >
              Limit
            </button>
            <button
              onClick={() => setOrderTab("pro")}
              className={cn(
                "h-[35px] text-[12px] font-normal text-center transition-colors",
                orderTab === "pro" ? "text-[#f6fefd]" : "text-[#949e9c] hover:text-[#c0c8c6]"
              )}
            >
              Pro
            </button>
          </div>
          {/* Sliding teal indicator */}
          <div
            className="absolute bottom-0 h-[1px] bg-acc transition-all duration-300 ease-in-out"
            style={{
              width: "33.333%",
              left: `${tabIdx * 33.333}%`,
            }}
          />
        </div>

        <div className="px-[10px] py-3 flex-1 flex flex-col">
          {/* Buy / Long | Sell / Short - INSIDE gray container like real HL */}
          <div className="flex bg-[#273035] rounded-[8px] p-1">
            <button
              onClick={() => setIsBuy(true)}
              className={cn(
                "flex-1 h-[29px] text-[12px] font-normal transition-all rounded-[5px]",
                isBuy
                  ? "bg-acc text-[#02231e]"
                  : "bg-transparent text-t1 hover:text-t1"
              )}
            >
              Buy / Long
            </button>
            <button
              onClick={() => setIsBuy(false)}
              className={cn(
                "flex-1 h-[29px] text-[12px] font-normal transition-all rounded-[5px]",
                !isBuy
                  ? "bg-red text-white"
                  : "bg-transparent text-t1 hover:text-t1"
              )}
            >
              Sell / Short
            </button>
          </div>

          {/* Available to Trade — above Size like real HL */}
          <div className="flex justify-between text-[12px] mt-3">
            <span className="text-t2">Available to Trade</span>
            <span className="text-t1 font-tabular">{formatNumber(availableBalance).replace(".", ",")} USDC</span>
          </div>

          {/* Current Position — above Size like real HL */}
          <div className="flex justify-between text-[12px] mt-[7px]">
            <span className="text-t2">Current Position</span>
            <span className={cn(
              "font-tabular",
              currentPositionSize > 0 ? "text-acc" : currentPositionSize < 0 ? "text-red" : "text-t1"
            )}>
              {currentPositionSize !== 0 ? `${currentPositionSize.toFixed(2).replace(".", ",")} ${coinDisplayName}` : `0,00 ${coinDisplayName}`}
            </span>
          </div>

          {/* Price field — visible in Limit and Pro mode */}
          {(orderTab === "limit" || orderTab === "pro") && (
            <div className="flex items-center bg-transparent border border-[#273035] rounded-[8px] h-[33px] px-3 mt-3">
              <span className="text-[12px] text-t3 mr-2 whitespace-nowrap">{orderTab === "pro" ? "Entry Price" : "Price (USDC)"}</span>
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-[12px] font-medium outline-none font-tabular text-t1 text-right"
              />
              <button
                onClick={() => price && setLimitPrice(price.toFixed(decimals))}
                className="ml-2 text-[12px] text-acc hover:brightness-110"
              >
                Mid
              </button>
            </div>
          )}

          {/* Size input */}
          <div className="flex items-center bg-transparent border border-[#273035] rounded-[8px] h-[33px] px-3 mt-3">
            <span className="text-[12px] text-t3 mr-2">Size</span>
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent text-[12px] font-medium outline-none font-tabular text-t1 text-right"
            />
            <div className="flex items-center gap-1 text-[12px] text-t1 ml-2">
              <span>{coinDisplayName}</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>

          {/* Slider - matching real HL: 8px track, #273035 bg, 14px radius */}
          <div className="py-1 mt-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative h-6 flex items-center">
                {/* Circular thumb — clamped within track like real HL (thumb never extends past edges) */}
                <div
                  className="absolute z-20 w-[18px] h-[18px] rounded-full border-2 border-acc bg-[#0d1214] cursor-pointer"
                  style={{ left: `calc(${sliderPct / 100} * (100% - 18px))` }}
                />
                {/* Track background */}
                <div className="absolute left-0 right-0 h-[8px] bg-[#273035] rounded-[14px]" />
                {/* Track fill */}
                <div
                  className="absolute left-0 h-[8px] bg-acc rounded-[14px]"
                  style={{ width: `${sliderPct}%` }}
                />
                {/* 5 dots at 0%, 25%, 50%, 75%, 100% */}
                <div className="absolute left-0 right-0 flex items-center justify-between">
                  {[0, 25, 50, 75, 100].map((step) => (
                    <button
                      key={step}
                      onClick={() => handleSlider(step)}
                      className={cn(
                        "w-[6px] h-[6px] rounded-full transition-all z-10",
                        sliderPct >= step ? "bg-acc" : "bg-[#575e62]"
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
              <div className="flex items-center bg-transparent border border-[#273035] rounded-[8px] h-[33px] px-3 min-w-[65px]">
                <input
                  type="number"
                  value={sliderPct}
                  onChange={(e) => handleSlider(parseInt(e.target.value) || 0)}
                  className="w-6 bg-transparent text-[12px] text-t1 font-tabular outline-none text-right"
                />
                <span className="text-[12px] text-t3 ml-1">%</span>
              </div>
            </div>
          </div>

          {/* Reduce Only checkbox - real HL style: 16x16, 3px radius, filled inner */}
          <button
            type="button"
            onClick={() => setReduceOnly(!reduceOnly)}
            className="flex items-center gap-2.5 cursor-pointer w-full mt-3"
          >
            <div
              className={cn(
                "w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors flex-shrink-0",
                reduceOnly ? "bg-acc border-acc" : "border-[#575e62] bg-transparent"
              )}
            >
              {reduceOnly && <div className="w-2 h-2 rounded-[1px] bg-[#02231e]" />}
            </div>
            <span className="text-[12px] text-t1">Reduce Only</span>
          </button>

          {/* Take Profit / Stop Loss checkbox */}
          <button
            type="button"
            onClick={() => setTpsl(!tpsl)}
            className="flex items-center gap-2.5 cursor-pointer w-full mt-[7px]"
          >
            <div
              className={cn(
                "w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors flex-shrink-0",
                tpsl ? "bg-acc border-acc" : "border-[#575e62] bg-transparent"
              )}
            >
              {tpsl && <div className="w-2 h-2 rounded-[1px] bg-[#02231e]" />}
            </div>
            <span className="text-[12px] text-t1">Take Profit / Stop Loss</span>
          </button>

          {/* TP/SL Fields - only visible when tpsl is checked */}
          {tpsl && (
            <div className="space-y-2 mt-3">
              {/* TP Price row */}
              <div className="flex items-center gap-[6px]">
                <div className="w-[calc(50%-3px)] flex items-center h-[33px] bg-transparent rounded-[8px] px-3 border border-[#273035]">
                  <span className="text-[12px] text-t3 mr-2 whitespace-nowrap">TP Price</span>
                  <input
                    type="number"
                    value={tpPrice}
                    onChange={(e) => setTpPrice(e.target.value)}
                    className="flex-1 bg-transparent text-[12px] outline-none font-tabular text-t1 text-right"
                  />
                </div>
                <div className="w-[calc(50%-3px)] flex items-center h-[33px] bg-transparent rounded-[8px] px-3 border border-[#273035] justify-between">
                  <span className="text-[12px] text-t3">Gain</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[12px] text-t3">%</span>
                    <ChevronDown className="w-3 h-3 text-t4" />
                  </div>
                </div>
              </div>

              {/* SL Price row */}
              <div className="flex items-center gap-[6px]">
                <div className="w-[calc(50%-3px)] flex items-center h-[33px] bg-transparent rounded-[8px] px-3 border border-[#273035]">
                  <span className="text-[12px] text-t3 mr-2 whitespace-nowrap">SL Price</span>
                  <input
                    type="number"
                    value={slPrice}
                    onChange={(e) => setSlPrice(e.target.value)}
                    className="flex-1 bg-transparent text-[12px] outline-none font-tabular text-t1 text-right"
                  />
                </div>
                <div className="w-[calc(50%-3px)] flex items-center h-[33px] bg-transparent rounded-[8px] px-3 border border-[#273035] justify-between">
                  <span className="text-[12px] text-t3">Loss</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[12px] text-t3">%</span>
                    <ChevronDown className="w-3 h-3 text-t4" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Spacer — pushes Place Order down like real HL (~174px gap when checkboxes unchecked) */}
          <div className="flex-1 min-h-[34px]" />

          {/* Place Order button */}
          <button
            onClick={handleSubmit}
            disabled={(orderType !== "pro" && !price) || sizeNum <= 0 || ((orderType === "limit" || orderType === "pro") && !parseFloat(limitPrice))}
            className={cn(
              "w-full h-[33px] rounded-[8px] font-normal text-[12px] transition-all disabled:opacity-30 disabled:cursor-not-allowed",
              isBuy ? "bg-acc text-[#02231e]" : "bg-red text-white"
            )}
          >
            Place Order
          </button>

          {/* Order info below button */}
          <div className="space-y-[5px] pt-1 mt-3">
            <div className="flex justify-between text-[12px] leading-tight">
              <span className="text-t2 underline decoration-dashed decoration-t4">Liquidation Price</span>
              <span className="text-t1 font-tabular">{liqPrice ? liqPrice.toFixed(decimals).replace(".", ",") : "N/A"}</span>
            </div>
            <div className="flex justify-between text-[12px] leading-tight">
              <span className="text-t2">Order Value</span>
              <span className="text-t1 font-tabular">{notional > 0 ? `${formatNumber(notional).replace(".", ",")} USDC` : "N/A"}</span>
            </div>
            <div className="flex justify-between text-[12px] leading-tight">
              <span className="text-t2">Margin Required</span>
              <span className="text-t1 font-tabular">{margin > 0 ? `${formatNumber(margin).replace(".", ",")} USDC` : "N/A"}</span>
            </div>
            <div className="flex justify-between text-[12px] leading-tight">
              <span className="text-t2 underline decoration-dashed decoration-t4">Slippage</span>
              <span className="text-acc font-tabular">Est: 0% / Max: 8,00%</span>
            </div>
            <div className="flex justify-between text-[12px] leading-tight">
              <span className="text-t2 underline decoration-dashed decoration-t4">Fees</span>
              <span className="text-t1 font-tabular">
                {orderType === "limit"
                  ? `${MAKER_FEE_PCT.toFixed(4).replace(".", ",")}% (Maker)`
                  : `${TAKER_FEE_PCT.toFixed(4).replace(".", ",")}% (Taker)`}
              </span>
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
        price={orderType === "market" ? "Market" : orderType === "pro" ? `${execPrice} (Forced)` : execPrice}
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
        maxLeverage={maxLeverage}
      />
    </>
  );
}
