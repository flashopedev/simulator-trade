"use client";

import { cn } from "@/lib/utils";

interface FooterProps {
  isConnected?: boolean;
}

export function Footer({ isConnected = false }: FooterProps) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-[28px] flex items-center justify-between px-4 bg-bg border-t border-brd text-[11px] text-t3 z-40">
      {/* FIX 4: Left side - Online badge */}
      <div className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-0.5 border",
        isConnected ? "border-grn/30" : "border-red/30"
      )}>
        <div className={cn("w-1.5 h-1.5 rounded-full", isConnected ? "bg-grn" : "bg-red")} />
        <span className={cn("text-[12px]", isConnected ? "text-grn" : "text-red")}>
          {isConnected ? "Online" : "Offline"}
        </span>
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
