"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn, formatNumber, coinDisplayName } from "@/lib/utils";
import type { Position } from "@/lib/supabase/types";

interface MarketCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (size: number) => void;
  position: Position | null;
  currentPrice: number;
}

export function MarketCloseModal({
  isOpen,
  onClose,
  onConfirm,
  position,
  currentPrice,
}: MarketCloseModalProps) {
  const [closePercent, setClosePercent] = useState(100);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Reset percent when modal opens
  useEffect(() => {
    if (isOpen) {
      setClosePercent(100);
    }
  }, [isOpen]);

  if (!isOpen || !position) return null;

  const positionValue = Math.abs(position.size) * currentPrice;
  const closeSize = Math.abs(position.size) * (closePercent / 100);
  const closeValue = closeSize * currentPrice;

  const handleConfirm = () => {
    if (dontShowAgain) {
      localStorage.setItem("skipCloseConfirm", "true");
    }
    onConfirm(closeSize);
  };

  const sliderSteps = [0, 25, 50, 75, 100];

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
          <h2 className="text-[24px] font-medium text-white text-center mb-2">
            Market Close
          </h2>
          <p className="text-[14px] text-t3 text-center mb-6">
            This will attempt to immediately close the position.
          </p>

          {/* Order details */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-[14px]">
              <span className="text-t3">Size</span>
              <span className="text-acc font-medium">
                {closeSize.toFixed(5)} {coinDisplayName(position.coin)}
              </span>
            </div>

            <div className="flex justify-between text-[14px]">
              <span className="text-t3">Price</span>
              <span className="text-white font-medium">Market</span>
            </div>
          </div>

          {/* Size selector */}
          <div className="mb-6">
            <div className="flex items-center justify-between bg-s2 border border-brd rounded-lg px-4 py-2.5 mb-3">
              <span className="text-[13px] text-t3">Size</span>
              <div className="flex items-center gap-2">
                <span className="text-[14px] text-white font-medium">
                  {formatNumber(closeValue)}
                </span>
                <span className="text-[13px] text-t3">USDC</span>
              </div>
            </div>

            {/* Slider */}
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={closePercent}
                onChange={(e) => setClosePercent(parseInt(e.target.value))}
                className="w-full h-1.5 bg-s3 rounded-full appearance-none cursor-pointer accent-acc"
                style={{
                  background: `linear-gradient(to right, #50D2C1 ${closePercent}%, #1a2328 ${closePercent}%)`
                }}
              />
              {/* Slider dots */}
              <div className="absolute top-0 left-0 right-0 h-1.5 flex items-center justify-between pointer-events-none">
                {sliderSteps.map((step) => (
                  <div
                    key={step}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full border-2 transition-colors",
                      closePercent >= step
                        ? "bg-acc border-acc"
                        : "bg-s3 border-s3"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Percent indicator */}
            <div className="flex justify-end mt-2">
              <div className="bg-s2 border border-brd rounded px-3 py-1">
                <span className="text-[13px] text-white font-medium">
                  {closePercent} %
                </span>
              </div>
            </div>
          </div>

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
            disabled={closePercent === 0}
            className="w-full py-3.5 rounded-lg font-bold text-[15px] transition-all bg-acc text-black hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Market Close
          </button>
        </div>
      </div>
    </div>
  );
}
