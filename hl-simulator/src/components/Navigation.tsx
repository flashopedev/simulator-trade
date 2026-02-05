"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, formatNumber } from "@/lib/utils";

interface NavigationProps {
  balance: number;
  isConnected: boolean;
  connectionMode?: "ws" | "polling" | "simulation";
  onSignOut?: () => void;
}

export function Navigation({ balance, isConnected, connectionMode, onSignOut }: NavigationProps) {
  const pathname = usePathname();

  const links = [
    { href: "/trade", label: "Trade" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/faucet", label: "Faucet" },
  ];

  const statusLabel =
    connectionMode === "ws" ? "Live" : connectionMode === "polling" ? "REST" : "Sim";

  return (
    <>
      <nav className="flex items-center h-[48px] px-4 border-b border-brd bg-s1 sticky top-0 z-50">
        {/* Brand */}
        <div className="flex items-center gap-2 pr-4 border-r border-brd mr-2 h-full">
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <rect width="24" height="24" rx="5" fill="#00d8c4" />
            <path d="M7 8h3.5v8H7V8zm6.5 0H17v8h-3.5V8z" fill="#0a0f14" />
          </svg>
          <span className="font-bold text-[15px] tracking-tight text-t1">Hyperliquid</span>
          <span className="bg-acc/10 text-acc text-[8px] px-1.5 py-0.5 rounded font-bold tracking-wider border border-acc/15">
            SIM
          </span>
        </div>

        {/* Links */}
        <div className="hidden md:flex h-full items-stretch">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center px-3 text-[13px] font-medium border-b-2 border-transparent transition-colors",
                pathname === link.href
                  ? "text-t1 border-b-acc"
                  : "text-t3 hover:text-t2"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {/* Connection indicator */}
          <div className="flex items-center gap-1.5 mr-1">
            <div
              className={cn(
                "w-[7px] h-[7px] rounded-full",
                isConnected
                  ? "bg-grn shadow-[0_0_4px_rgba(0,192,118,0.5)] animate-pulse-dot"
                  : connectionMode === "polling"
                  ? "bg-yellow-500 animate-pulse-dot"
                  : "bg-red"
              )}
            />
            <span className="text-[10px] text-t3 hidden sm:inline">{statusLabel}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-s2 border border-brd rounded text-[12px]">
            <span className="text-t3 font-medium">Equity</span>
            <span className="font-bold text-acc font-tabular">{formatNumber(balance)}</span>
          </div>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="px-2.5 py-1.5 text-[11px] text-t3 hover:text-t2 border border-brd rounded transition-colors"
            >
              Sign Out
            </button>
          )}
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="flex md:hidden fixed bottom-0 left-0 right-0 bg-s1 border-t border-brd z-50">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex-1 py-3 text-center text-[11px] font-medium transition-colors",
              pathname === link.href ? "text-acc bg-acc/5" : "text-t3"
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </>
  );
}
