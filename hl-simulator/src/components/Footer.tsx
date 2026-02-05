"use client";

import { cn } from "@/lib/utils";

interface FooterProps {
  isConnected?: boolean;
}

export function Footer({ isConnected = true }: FooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-[28px] flex items-center justify-between px-4 bg-bg border-t border-brd text-[11px] text-t3 z-40">
      {/* Left side - connection status */}
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            "w-[6px] h-[6px] rounded-full",
            isConnected
              ? "bg-grn shadow-[0_0_4px_rgba(0,192,118,0.5)]"
              : "bg-red"
          )}
        />
        <span>{isConnected ? "Online" : "Offline"}</span>
      </div>

      {/* Right side - links */}
      <div className="flex items-center gap-4">
        <a
          href="https://hyperliquid.gitbook.io/hyperliquid-docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-t2 transition-colors"
        >
          Docs
        </a>
        <a
          href="#"
          className="hover:text-t2 transition-colors"
        >
          Support
        </a>
        <a
          href="#"
          className="hover:text-t2 transition-colors"
        >
          Terms
        </a>
        <a
          href="#"
          className="hover:text-t2 transition-colors"
        >
          Privacy Policy
        </a>
      </div>
    </footer>
  );
}
