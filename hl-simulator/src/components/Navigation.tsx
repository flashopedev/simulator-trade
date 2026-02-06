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
        <Link href="/trade" className="flex items-center gap-1.5 mr-6">
          {/* Two circles logo like Hyperliquid */}
          <svg width="20" height="20" viewBox="0 0 20 20" className="flex-shrink-0">
            <circle cx="6.5" cy="10" r="3.5" fill="#00d8c4" />
            <circle cx="13.5" cy="10" r="3.5" fill="#00d8c4" />
          </svg>
          <span className="font-extralight text-[15px] tracking-tight text-t1 italic leading-none">Hyperliquid</span>
        </Link>

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
        <div className="ml-auto flex items-center gap-3">
          {/* Connect button - always shown like real HL */}
          <button className="bg-[#50D2C1] text-[#04060c] px-4 h-[33px] rounded-[8px] text-[12px] font-medium hover:brightness-110 transition-all">
            Connect
          </button>

          {/* Globe icon with border */}
          <div className="w-8 h-8 flex items-center justify-center border border-[#273035] rounded">
            <Globe className="w-5 h-5 text-t3" />
          </div>

          {/* Settings icon with border */}
          <div className="w-8 h-8 flex items-center justify-center border border-[#273035] rounded">
            <Settings className="w-5 h-5 text-t3" />
          </div>
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
