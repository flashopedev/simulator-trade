"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Chart bottom bar — pixel-perfect replica of real Hyperliquid/TradingView.
 * Height: ~39px, bg: #0f1a1f.
 * Layout: [5y 1y 6m 3m 1m 5d 1d] [calendar icon]  ...  [time(UTC-8)] [%] [log] [auto]
 */

// Calendar icon
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28" fill="currentColor">
    <path d="M8 4h1v3H8zM19 4h1v3h-1z"></path>
    <path d="M5 7.5A1.5 1.5 0 0 1 6.5 6h15A1.5 1.5 0 0 1 23 7.5v14a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 5 21.5v-14zM6.5 7a.5.5 0 0 0-.5.5V10h16V7.5a.5.5 0 0 0-.5-.5h-15zM22 11H6v10.5a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5V11z"></path>
  </svg>
);

// Range buttons — matches real HL
const RANGE_BUTTONS = ["5y", "1y", "6m", "3m", "1m", "5d", "1d"];

export function ChartBottomBar() {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Get UTC-8 time
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const utc8 = new Date(utcMs - 8 * 3600000);
      const h = utc8.getHours().toString().padStart(2, "0");
      const m = utc8.getMinutes().toString().padStart(2, "0");
      const s = utc8.getSeconds().toString().padStart(2, "0");
      setCurrentTime(`${h}:${m}:${s} (UTC-8)`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center h-[38px] bg-[#0f1a1f] flex-shrink-0 border-t border-[#2a3740] select-none">
      {/* Left: Range buttons */}
      <div className="flex items-center pl-[4px]">
        {RANGE_BUTTONS.map((range) => (
          <button
            key={range}
            className="h-[28px] px-[6px] text-[12px] text-[#868993] hover:text-[#d1d4dc] transition-colors"
          >
            {range}
          </button>
        ))}
        {/* Calendar icon */}
        <button className="h-[28px] w-[28px] flex items-center justify-center text-[#868993] hover:text-[#d1d4dc] ml-1">
          <CalendarIcon />
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: Time + controls */}
      <div className="flex items-center gap-1 pr-[4px]">
        <span className="text-[12px] text-[#868993] font-tabular">{currentTime}</span>

        {/* Separator */}
        <div className="w-px h-[18px] bg-[#2a3740] mx-[4px]" />

        <button className="h-[28px] px-[6px] text-[12px] text-[#868993] hover:text-[#d1d4dc]">
          %
        </button>
        <button className={cn(
          "h-[28px] px-[6px] text-[12px] hover:text-[#d1d4dc]",
          "text-[#50D2C1]" // log is active by default in HL
        )}>
          log
        </button>
        <button className={cn(
          "h-[28px] px-[6px] text-[12px] hover:text-[#d1d4dc]",
          "text-[#50D2C1]" // auto is active by default
        )}>
          auto
        </button>
      </div>
    </div>
  );
}
