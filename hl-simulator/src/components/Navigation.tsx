"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, formatNumber } from "@/lib/utils";

interface NavigationProps {
  balance: number;
  isConnected: boolean;
  onSignOut?: () => void;
}

export function Navigation({ balance, isConnected, onSignOut }: NavigationProps) {
  const pathname = usePathname();

  const links = [
    { href: "/trade", label: "Trade" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/faucet", label: "Faucet" },
  ];

  return (
    <nav className="flex items-center h-[38px] px-2.5 border-b border-brd bg-bg sticky top-0 z-50">
      {/* Brand */}
      <div className="flex items-center gap-1.5 pr-3.5 border-r border-brd mr-1 h-full">
        <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]">
          <rect width="24" height="24" rx="5" fill="rgb(80,210,193)" />
          <path d="M7 8h3.5v8H7V8zm6.5 0H17v8h-3.5V8z" fill="#000" />
        </svg>
        <span className="font-bold text-[13px] tracking-tight">Hyperliquid</span>
        <span className="bg-acc/10 text-acc text-[8px] px-1.5 py-0.5 rounded font-bold tracking-wider border border-acc/15">
          SIMULATOR
        </span>
      </div>

      {/* Links */}
      <div className="hidden md:flex h-full items-stretch">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center px-2.5 text-[11px] font-medium cursor-pointer border-b-2 border-transparent transition-colors",
              pathname === link.href
                ? "text-t1 border-b-acc"
                : "text-t4 hover:text-t2"
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-1.5">
        <div
          className={cn(
            "w-[7px] h-[7px] rounded-full mr-1",
            isConnected
              ? "bg-grn shadow-[0_0_4px] shadow-grn animate-pulse-dot"
              : "bg-red"
          )}
        />
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-s2 border border-brd rounded text-[11px]">
          <span className="text-t3 font-medium hidden sm:inline">Equity:</span>
          <span className="font-bold text-acc font-tabular">
            {formatNumber(balance)}
          </span>
        </div>
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="px-2 py-1 text-[10px] text-t4 hover:text-t2 transition-colors"
          >
            Sign Out
          </button>
        )}
      </div>

      {/* Mobile nav */}
      <div className="flex md:hidden fixed bottom-0 left-0 right-0 bg-s1 border-t border-brd z-50">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex-1 py-3 text-center text-[11px] font-medium transition-colors",
              pathname === link.href ? "text-acc bg-acc/5" : "text-t4"
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
