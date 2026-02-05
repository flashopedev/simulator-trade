"use client";

import { useState, useCallback, useEffect } from "react";
import { cn, calculateLiquidationPrice, formatNumber, COIN_DECIMALS } from "@/lib/utils";
import { ChevronDown, X, Info } from "lucide-react";

type OrderTab = "market" | "limit" | "pro";
type TIF = "GTC" | "IOC" | "ALO";

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
  const [leverage, setLeverage] = useState(10);
  const [marginMode, setMarginMode] = useState<"cross" | "isolated">("cross");
  const [size, setSize] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [sliderPct, setSliderPct] = useState(0);
  const [tif, setTif] = useState<TIF>("GTC");
  const [showLeveragePopup, setShowLeveragePopup] = useState(false);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [tpsl, setTpsl] = useState(false);

  const decimals = COIN_DECIMALS[coin] || 2;
  const sizeNum = parseFloat(size) || 0;
  const orderType = orderTab === "market" ? "market" : "limit";
  const execPrice = orderType === "limit" ? parseFloat(limitPrice) || price || 0 : price || 0;
  const notional = sizeNum * execPrice;
  const fee = notional * 0.0005;
  const liqPrice = execPrice > 0 ? calculateLiquidationPrice(execPrice, isBuy, leverage) : null;
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
      {/* Order type tabs: Market | Limit | Pro */}
      <div className="flex border-b border-brd">
        {(["market", "limit", "pro"] as OrderTab[]).map((tab) => (
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
            {tab === "pro" ? "Pro" : tab}
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
              isBuy ? "bg-grn text-black" : "bg-s3 text-t3 hover:text-t2"
            )}
          >
            Long
          </button>
          <button
            onClick={() => setIsBuy(false)}
            className={cn(
              "flex-1 py-2.5 rounded text-[13px] font-bold transition-all",
              !isBuy ? "bg-red text-white" : "bg-s3 text-t3 hover:text-t2"
            )}
          >
            Short
          </button>
        </div>

        {/* Cross/Isolated + Leverage button */}
        <div className="flex items-center gap-2">
          <div className="flex border border-brd rounded overflow-hidden">
            {(["cross", "isolated"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setMarginMode(mode)}
                className={cn(
                  "px-3 py-1.5 text-[11px] font-medium capitalize transition-colors",
                  marginMode === mode
                    ? "bg-acc/10 text-acc"
                    : "text-t3 hover:text-t2"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Leverage popup button */}
          <div className="relative">
            <button
              onClick={() => setShowLeveragePopup(!showLeveragePopup)}
              className="flex items-center gap-1 px-3 py-1.5 bg-s2 border border-brd rounded text-[12px] font-bold text-acc hover:bg-s3 transition-colors"
            >
              {leverage}x
              <ChevronDown className={cn(
                "w-3 h-3 transition-transform",
                showLeveragePopup && "rotate-180"
              )} />
            </button>

            {/* Leverage popup */}
            {showLeveragePopup && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLeveragePopup(false)}
                />
                <div className="absolute top-full left-0 mt-1 bg-s2 border border-brd rounded-lg shadow-xl z-50 p-3 w-[200px]">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[12px] font-medium text-t1">Leverage</span>
                    <button
                      onClick={() => setShowLeveragePopup(false)}
                      className="text-t3 hover:text-t1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={leverage}
                    onChange={(e) => setLeverage(parseInt(e.target.value))}
                    className="w-full h-1 mb-2"
                  />
                  <div className="flex justify-between">
                    {[1, 5, 10, 25, 50].map((v) => (
                      <button
                        key={v}
                        onClick={() => setLeverage(v)}
                        className={cn(
                          "text-[10px] font-medium py-1 px-2 rounded transition-colors",
                          leverage === v
                            ? "text-acc bg-acc/10"
                            : "text-t4 hover:text-t2"
                        )}
                      >
                        {v}x
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Available to Trade */}
        <div className="flex justify-between text-[11px]">
          <span className="text-t3">Available</span>
          <span className="text-t1 font-tabular">{formatNumber(availableBalance)} USDC</span>
        </div>

        {/* Limit price (only for limit/pro) */}
        {orderTab !== "market" && (
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
            <span className="text-[10px] text-t3 font-tabular">{"\u2248"} ${formatNumber(notional)}</span>
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

        {/* TIF dropdown (for limit/pro) */}
        {orderTab !== "market" && (
          <div className="flex items-center gap-2">
            <select
              value={tif}
              onChange={(e) => setTif(e.target.value as TIF)}
              className="bg-s2 border border-brd rounded px-2 py-1.5 text-[11px] text-t2 outline-none focus:border-acc"
            >
              <option value="GTC">GTC</option>
              <option value="IOC">IOC</option>
              <option value="ALO">ALO</option>
            </select>
            <div className="flex items-center gap-1 text-[10px] text-t4">
              <Info className="w-3 h-3" />
              <span>Good-Til-Canceled</span>
            </div>
          </div>
        )}

        {/* Reduce Only + TP/SL */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={reduceOnly}
              onChange={(e) => setReduceOnly(e.target.checked)}
              className="w-3 h-3 rounded border-brd"
            />
            <span className="text-[11px] text-t3">Reduce Only</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={tpsl}
              onChange={(e) => setTpsl(e.target.checked)}
              className="w-3 h-3 rounded border-brd"
            />
            <span className="text-[11px] text-t3">TP/SL</span>
          </label>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!price || sizeNum <= 0 || (margin + fee > availableBalance)}
          className={cn(
            "w-full py-3.5 rounded font-bold text-[14px] transition-all disabled:opacity-30 disabled:cursor-not-allowed",
            isBuy ? "bg-grn text-black" : "bg-red text-white"
          )}
        >
          {isBuy ? "Long" : "Short"} {coin}
        </button>

        {/* Order details */}
        <div className="space-y-1.5 text-[11px] pt-2 border-t border-brd">
          <div className="flex justify-between">
            <span className="text-t3">Order Value</span>
            <span className="text-t2 font-tabular">{notional > 0 ? `$${formatNumber(notional)}` : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-t3">Margin Required</span>
            <span className="text-t2 font-tabular">{margin > 0 ? `$${formatNumber(margin)}` : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-t3">Est. Fee</span>
            <span className="text-t2 font-tabular">{fee > 0 ? `$${fee.toFixed(4)}` : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-t3">Est. Liq. Price</span>
            <span className="text-red font-semibold font-tabular">{liqPrice ? liqPrice.toFixed(decimals) : "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
