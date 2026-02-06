"use client";

import { useState, useCallback, useEffect } from "react";
import { cn, calculateLiquidationPrice, formatNumber, COIN_DECIMALS } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { ConfirmOrderModal } from "./ConfirmOrderModal";
import { AdjustLeverageModal } from "./AdjustLeverageModal";

type OrderTab = "market" | "limit";
type TIF = "GTC" | "IOC" | "FOK";

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
  const [tif, setTif] = useState<TIF>("GTC");

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

  // Calculate TP/SL gain/loss percentages
  const tpPriceNum = parseFloat(tpPrice) || 0;
  const slPriceNum = parseFloat(slPrice) || 0;

  const tpGainPercent = tpPriceNum && execPrice
    ? isBuy
      ? ((tpPriceNum - execPrice) / execPrice) * 100 * leverage
      : ((execPrice - tpPriceNum) / execPrice) * 100 * leverage
    : 0;

  const slLossPercent = slPriceNum && execPrice
    ? isBuy
      ? ((execPrice - slPriceNum) / execPrice) * 100 * leverage
      : ((slPriceNum - execPrice) / execPrice) * 100 * leverage
    : 0;

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

    // Check if we should skip confirmation
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
      tpPrice: tpsl && tpPriceNum ? tpPriceNum : undefined,
      slPrice: tpsl && slPriceNum ? slPriceNum : undefined,
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

  // Slider steps for visual dots
  const sliderSteps = [0, 25, 50, 75, 100];

  return (
    <>
      <div className="flex flex-col bg-s1">
        {/* Cross | Nx | Classic - compact HL style */}
        <div className="flex border-b border-brd">
          <button
            onClick={() => setMarginMode("cross")}
            className={cn(
              "flex-1 py-2 text-[13px] font-medium text-center border-r border-brd transition-colors",
              marginMode === "cross" ? "text-t1" : "text-t3 hover:text-t2"
            )}
          >
            Cross
          </button>
          <button
            onClick={() => setShowLeverageModal(true)}
            className="flex-1 py-2 text-[13px] font-medium text-center border-r border-brd text-acc hover:brightness-110 transition-all cursor-pointer"
          >
            {leverage}x
          </button>
          <button
            onClick={() => setMarginMode("isolated")}
            className={cn(
              "flex-1 py-2 text-[13px] font-medium text-center transition-colors",
              marginMode === "isolated" ? "text-t1" : "text-t3 hover:text-t2"
            )}
          >
            Classic
          </button>
        </div>

        {/* Order type tabs: Market | Limit | Pro */}
        <div className="flex border-b border-brd">
          <button
            onClick={() => setOrderTab("market")}
            className={cn(
              "flex-1 py-2.5 text-[13px] font-medium border-b-2 transition-colors",
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
              "flex-1 py-2.5 text-[13px] font-medium border-b-2 transition-colors",
              orderTab === "limit"
                ? "text-t1 border-t1"
                : "text-t3 border-transparent hover:text-t2"
            )}
          >
            Limit
          </button>
          <button
            disabled
            className="flex-1 py-2.5 text-[13px] font-medium text-t3 border-b-2 border-transparent cursor-not-allowed flex items-center justify-center gap-1"
          >
            Pro <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <div className="p-3 space-y-2.5">
          {/* Buy / Long | Sell / Short */}
          <div className="flex">
            <button
              onClick={() => setIsBuy(true)}
              className={cn(
                "flex-1 py-2 text-[13px] font-bold transition-all rounded-l",
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
                "flex-1 py-2 text-[13px] font-bold transition-all rounded-r",
                !isBuy
                  ? "bg-red text-white"
                  : "bg-transparent text-t3 border border-brd border-l-0 hover:text-t2"
              )}
            >
              Sell / Short
            </button>
          </div>

          {/* Available to Trade */}
          <div className="flex justify-between text-[11px]">
            <span className="text-t3">Available to Trade</span>
            <span className="text-t1 font-tabular">{formatNumber(availableBalance)} USDC</span>
          </div>

          {/* Current Position */}
          <div className="flex justify-between text-[11px]">
            <span className="text-t3">Current Position</span>
            <span className={cn(
              "font-tabular",
              currentPositionSize > 0 ? "text-acc" : currentPositionSize < 0 ? "text-red" : "text-t1"
            )}>
              {currentPositionSize !== 0 ? `${currentPositionSize.toFixed(5)} ${coin}` : `0.00000 ${coin}`}
            </span>
          </div>

          {/* Limit price (only for limit) */}
          {orderTab === "limit" && (
            <div>
              <div className="flex items-center bg-transparent border border-brd rounded px-3 focus-within:border-acc transition-colors">
                <span className="text-[11px] text-t3 mr-2">Price (USDC)</span>
                <input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent py-1.5 text-[13px] font-medium outline-none font-tabular text-t1 text-right"
                />
                <button
                  onClick={() => price && setLimitPrice(price.toFixed(decimals))}
                  className="text-[11px] text-acc font-medium hover:underline ml-2"
                >
                  Mid
                </button>
              </div>
            </div>
          )}

          {/* Size input */}
          <div>
            <div className="flex items-center bg-transparent border border-brd rounded px-3 focus-within:border-acc transition-colors">
              <span className="text-[11px] text-t3 mr-2">Size</span>
              <input
                type="number"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent py-1.5 text-[13px] font-medium outline-none font-tabular text-t1 text-right"
              />
              <div className="flex items-center gap-1 text-[11px] text-t3 ml-2">
                <span>USDC</span>
                <ChevronDown className="w-3 h-3" />
              </div>
            </div>
            <div className="flex justify-end mt-0.5">
              <span className="text-[10px] text-t4 font-tabular">≈ ${formatNumber(notional)}</span>
            </div>
          </div>

          {/* Slider with dots like real HL */}
          <div className="py-1">
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPct}
                onChange={(e) => handleSlider(parseInt(e.target.value))}
                className="w-full h-1 bg-s3 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #50D2C1 ${sliderPct}%, #1a2328 ${sliderPct}%)`
                }}
              />
              {/* Slider dots */}
              <div className="absolute top-0 left-0 right-0 h-1 flex items-center justify-between pointer-events-none px-0">
                {sliderSteps.map((step) => (
                  <button
                    key={step}
                    onClick={() => handleSlider(step)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors pointer-events-auto",
                      sliderPct >= step
                        ? "bg-acc"
                        : "bg-s3 border border-t4"
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end mt-1.5">
              <div className="flex items-center gap-1 bg-s2 border border-brd rounded px-2 py-0.5">
                <span className="text-[11px] text-t1 font-tabular">{sliderPct}</span>
                <span className="text-[11px] text-t3">%</span>
              </div>
            </div>
          </div>

          {/* Reduce Only + TIF (for Limit) + Take Profit / Stop Loss */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-[11px] text-t2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reduceOnly}
                  onChange={(e) => setReduceOnly(e.target.checked)}
                  className="w-3 h-3 rounded border-brd accent-acc"
                />
                Reduce Only
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-t2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tpsl}
                  onChange={(e) => setTpsl(e.target.checked)}
                  className="w-3 h-3 rounded border-brd accent-acc"
                />
                Take Profit / Stop Loss
              </label>
            </div>
            {orderTab === "limit" && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-t4">TIF</span>
                <select
                  value={tif}
                  onChange={(e) => setTif(e.target.value as TIF)}
                  className="bg-s2 border border-brd rounded px-1.5 py-0.5 text-[10px] text-acc outline-none cursor-pointer"
                >
                  <option value="GTC">GTC</option>
                  <option value="IOC">IOC</option>
                  <option value="FOK">FOK</option>
                </select>
              </div>
            )}
          </div>

          {/* TP/SL Fields */}
          {tpsl && (
            <div className="space-y-2 pt-1">
              {/* TP Price */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-transparent border border-brd rounded px-2 focus-within:border-acc transition-colors">
                  <span className="text-[10px] text-t4 mr-1.5 whitespace-nowrap">TP Price</span>
                  <input
                    type="number"
                    value={tpPrice}
                    onChange={(e) => setTpPrice(e.target.value)}
                    placeholder=""
                    className="flex-1 bg-transparent py-1 text-[12px] font-medium outline-none font-tabular text-t1 text-right min-w-0"
                  />
                </div>
                <div className="flex items-center bg-s2 border border-brd rounded px-2 py-1 min-w-[70px]">
                  <span className="text-[10px] text-t3 mr-1">Gain</span>
                  <span className={cn(
                    "text-[11px] font-tabular",
                    tpGainPercent > 0 ? "text-acc" : "text-t3"
                  )}>
                    {tpGainPercent > 0 ? `${tpGainPercent.toFixed(2)}` : ""} %
                  </span>
                </div>
              </div>

              {/* SL Price */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-transparent border border-brd rounded px-2 focus-within:border-acc transition-colors">
                  <span className="text-[10px] text-t4 mr-1.5 whitespace-nowrap">SL Price</span>
                  <input
                    type="number"
                    value={slPrice}
                    onChange={(e) => setSlPrice(e.target.value)}
                    placeholder=""
                    className="flex-1 bg-transparent py-1 text-[12px] font-medium outline-none font-tabular text-t1 text-right min-w-0"
                  />
                </div>
                <div className="flex items-center bg-s2 border border-brd rounded px-2 py-1 min-w-[70px]">
                  <span className="text-[10px] text-t3 mr-1">Loss</span>
                  <span className={cn(
                    "text-[11px] font-tabular",
                    slLossPercent > 0 ? "text-red" : "text-t3"
                  )}>
                    {slLossPercent > 0 ? `${slLossPercent.toFixed(2)}` : ""} %
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!price || sizeNum <= 0 || margin > availableBalance}
            className={cn(
              "w-full py-3 rounded font-bold text-[14px] transition-all disabled:opacity-30 disabled:cursor-not-allowed",
              isBuy ? "bg-acc text-black" : "bg-red text-white"
            )}
          >
            Place Order
          </button>

          {/* Order details */}
          <div className="space-y-1.5 text-[11px] pt-2 border-t border-brd">
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
                {notional > 0 ? `${formatNumber(notional)} USDC` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-t3 border-b border-dotted border-t4 cursor-help">
                Margin Required
              </span>
              <span className="text-t2 font-tabular">
                {margin > 0 ? `${formatNumber(margin)} USDC` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-t3 border-b border-dotted border-t4 cursor-help">
                Slippage
              </span>
              <span className="text-acc font-tabular">Est: 0% / Max: 8.00%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-t3 border-b border-dotted border-t4 cursor-help">
                Fees
              </span>
              <span className="text-t2 font-tabular">0.0450% / 0.0150%</span>
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
