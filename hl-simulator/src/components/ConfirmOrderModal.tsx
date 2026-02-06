"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface ConfirmOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: "Long" | "Short";
  size: number;
  coin: string;
  price: number | "Market";
  liquidationPrice: number | null;
  orderType: "market" | "limit";
}

export function ConfirmOrderModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  size,
  coin,
  price,
  liquidationPrice,
  orderType,
}: ConfirmOrderModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (dontShowAgain) {
      localStorage.setItem("skipOrderConfirm", "true");
    }
    onConfirm();
  };

  const isLong = action === "Long";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#0d1117] border border-brd rounded-lg w-[420px] max-w-[90vw] shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-t3 hover:text-t1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-[24px] font-medium text-white text-center mb-6">
            Confirm Order
          </h2>

          {/* Order details */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-[14px]">
              <span className="text-t3">Action</span>
              <span className={cn(
                "font-medium",
                isLong ? "text-acc" : "text-red"
              )}>
                {action}
              </span>
            </div>

            <div className="flex justify-between text-[14px]">
              <span className="text-t3">Size</span>
              <span className="text-acc font-medium">
                {size.toFixed(5)} {coin}
              </span>
            </div>

            <div className="flex justify-between text-[14px]">
              <span className="text-t3">Price</span>
              <span className="text-white font-medium">
                {price === "Market" ? "Market" : formatNumber(price)}
              </span>
            </div>

            <div className="flex justify-between text-[14px]">
              <span className="text-t3 border-b border-dotted border-t4">
                Est. Liquidation Price
              </span>
              <span className="text-white font-medium">
                {liquidationPrice ? formatNumber(liquidationPrice) : "N/A"}
              </span>
            </div>
          </div>

          {/* Info text */}
          <p className="text-[13px] text-t3 mb-4">
            You pay no gas. The order will be confirmed within a few seconds.
          </p>

          {/* Don't show again */}
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-brd bg-transparent accent-acc"
            />
            <span className="text-[13px] text-t2">Don't show this again</span>
          </label>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            className={cn(
              "w-full py-3.5 rounded-lg font-bold text-[15px] transition-all",
              isLong
                ? "bg-acc text-black hover:brightness-110"
                : "bg-red text-white hover:brightness-110"
            )}
          >
            {isLong ? "Buy / Long" : "Sell / Short"}
          </button>
        </div>
      </div>
    </div>
  );
}
