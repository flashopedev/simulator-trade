"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdjustLeverageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (leverage: number) => void;
  currentLeverage: number;
  coin: string;
  maxLeverage?: number;
}

export function AdjustLeverageModal({
  isOpen,
  onClose,
  onConfirm,
  currentLeverage,
  coin,
  maxLeverage = 40,
}: AdjustLeverageModalProps) {
  const [leverage, setLeverage] = useState(currentLeverage);

  // Reset to current leverage when modal opens
  useEffect(() => {
    if (isOpen) {
      setLeverage(currentLeverage);
    }
  }, [isOpen, currentLeverage]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(leverage);
    onClose();
  };

  const sliderPercent = ((leverage - 1) / (maxLeverage - 1)) * 100;

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
            Adjust Leverage
          </h2>

          <p className="text-[14px] text-t3 text-center mb-1">
            Control the leverage used for {coin} positions. The maximum leverage is {maxLeverage}x.
          </p>
          <p className="text-[13px] text-t3 text-center mb-6">
            Max position size decreases the higher your leverage.
          </p>

          {/* Slider with input */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              {/* Slider */}
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="1"
                  max={maxLeverage}
                  value={leverage}
                  onChange={(e) => setLeverage(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-s3 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #50D2C1 ${sliderPercent}%, #1a2328 ${sliderPercent}%)`
                  }}
                />
              </div>

              {/* Input */}
              <div className="flex items-center bg-s2 border border-brd rounded-lg px-3 py-2 min-w-[80px]">
                <input
                  type="number"
                  min="1"
                  max={maxLeverage}
                  value={leverage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setLeverage(Math.min(maxLeverage, Math.max(1, val)));
                  }}
                  className="w-10 bg-transparent text-[15px] font-medium text-white outline-none text-right"
                />
                <span className="text-[15px] text-t3 ml-1">x</span>
              </div>
            </div>
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 rounded-lg font-bold text-[15px] transition-all bg-acc text-black hover:brightness-110 mb-4"
          >
            Confirm
          </button>

          {/* Warning */}
          <div className="bg-red/10 border border-red/30 rounded-lg px-4 py-3">
            <p className="text-[13px] text-red text-center">
              Note that setting a higher leverage increases the risk of liquidation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
