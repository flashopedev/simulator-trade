"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, formatNumber } from "@/lib/utils";
import { Globe, Settings } from "lucide-react";

interface NavigationProps {
  balance?: number;
  isConnected?: boolean;
  connectionMode?: "ws" | "polling" | "simulation";
  onSignOut?: () => void;
  isLoggedIn?: boolean;
}

const NAV_ITEMS = [
  { label: "Trade", href: "/trade", enabled: true },
  { label: "Portfolio", href: "/portfolio", enabled: true },
  { label: "Earn", href: "/earn", enabled: true },
  { label: "Vaults", href: "#", enabled: false },
  { label: "Staking", href: "#", enabled: false },
  { label: "Referrals", href: "#", enabled: false },
  { label: "Leaderboard", href: "#", enabled: false },
  { label: "More", href: "#", enabled: false, hasDropdown: true },
];

export function Navigation({
  balance = 0,
  isConnected,
  connectionMode,
  onSignOut,
  isLoggedIn = true,
}: NavigationProps) {
  const pathname = usePathname();

  const statusLabel =
    connectionMode === "ws" ? "Live" : connectionMode === "polling" ? "REST" : "Sim";

  return (
    <>
      <nav className="flex items-center h-[56px] px-4 border-b border-brd bg-s1 sticky top-0 z-50">
        {/* Logo */}
        <div className="flex items-center gap-1.5 pr-4 border-r border-brd mr-3 h-full">
          {/* Two circles logo like Hyperliquid */}
          <svg width="20" height="20" viewBox="0 0 20 20" className="flex-shrink-0">
            <circle cx="6.5" cy="10" r="3.5" fill="#00d8c4" />
            <circle cx="13.5" cy="10" r="3.5" fill="#00d8c4" />
          </svg>
          <span className="font-extralight text-[15px] tracking-tight text-t1 italic leading-none">Hyperliquid</span>
          <span className="bg-acc/10 text-acc text-[8px] px-1.5 py-0.5 rounded font-bold tracking-wider border border-acc/15">
            SIM
          </span>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex h-full items-stretch">
          {NAV_ITEMS.map((item) => (
            item.enabled ? (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center px-3 text-[12px] font-normal border-b-2 transition-colors",
                  pathname === item.href || (item.href === "/earn" && pathname === "/faucet")
                    ? "text-[#97FCE4] border-[#97FCE4]"
                    : "text-t1 border-transparent hover:text-[#97FCE4]"
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className="flex items-center px-3 text-[12px] font-normal text-t1 cursor-default border-b-2 border-transparent"
              >
                {item.label}
                {item.hasDropdown && (
                  <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </span>
            )
          ))}
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {isLoggedIn ? (
            <>
              {/* Connection indicator */}
              {isConnected !== undefined && (
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
              )}

              {/* D6: Equity badge - white text, not cyan */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-s2 border border-brd rounded text-[13px]">
                <span className="text-t3 mr-1">Equity</span>
                <span className="text-t1 font-medium font-tabular">${formatNumber(balance)}</span>
              </div>

              {/* Sign Out */}
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="px-2.5 py-1.5 text-[11px] text-t3 hover:text-t2 border border-brd rounded transition-colors"
                >
                  Sign Out
                </button>
              )}
            </>
          ) : (
            /* Connect button when not logged in */
            <button className="bg-acc text-black px-4 py-1.5 rounded-full text-[13px] font-medium hover:brightness-110 transition-all">
              Connect
            </button>
          )}

          {/* Globe icon */}
          <Globe className="w-5 h-5 text-t3 hidden lg:block" />

          {/* Settings icon */}
          <Settings className="w-5 h-5 text-t3 hidden lg:block" />
        </div>
      </nav>

      {/* Mobile bottom nav - only enabled items */}
      <div className="flex md:hidden fixed bottom-0 left-0 right-0 bg-s1 border-t border-brd z-50">
        {NAV_ITEMS.filter(item => item.enabled).map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex-1 py-3 text-center text-[11px] font-medium transition-colors",
              pathname === item.href || (item.href === "/earn" && pathname === "/faucet")
                ? "text-acc bg-acc/5"
                : "text-t3"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </>
  );
}
