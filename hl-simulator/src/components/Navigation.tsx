"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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

  return (
    <>
      <nav className="flex items-center h-[56px] px-4 border-b border-brd bg-s1 sticky top-0 z-50">
        {/* Logo - white circles + Hyperliquid italic like real HL */}
        <Link href="/trade" className="flex items-center gap-2 mr-8 flex-shrink-0">
          <svg width="22" height="22" viewBox="0 0 20 20" className="flex-shrink-0">
            <circle cx="6" cy="10" r="4" fill="#ffffff" />
            <circle cx="14" cy="10" r="4" fill="#ffffff" />
          </svg>
          <span className="font-light text-[15px] tracking-tight text-white italic leading-none">
            Hyperliquid
          </span>
        </Link>

        {/* Navigation Links - 12px font-weight 400 like real HL */}
        <div className="hidden md:flex h-full items-stretch gap-0">
          {NAV_ITEMS.map((item) =>
            item.enabled ? (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center px-3 text-[12px] font-normal border-b-2 transition-colors",
                  pathname === item.href ||
                    (item.href === "/earn" && pathname === "/faucet")
                    ? "text-[#97FCE4] border-[#97FCE4]"
                    : "text-t1 border-transparent hover:text-[#97FCE4]"
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className="flex items-center px-3 text-[12px] font-normal text-t1 cursor-default border-b-2 border-transparent select-none"
              >
                {item.label}
                {item.hasDropdown && (
                  <svg
                    className="w-3 h-3 ml-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </span>
            )
          )}
        </div>

        {/* Right side - matching real HL exactly */}
        <div className="ml-auto flex items-center gap-2">
          {/* Deposit button - exact HL: bg #50D2C1, text #04060c, h 33px, rounded 8px */}
          <button className="bg-[#50D2C1] text-[#04060c] px-4 h-[33px] rounded-[8px] text-[12px] font-medium hover:brightness-110 transition-all">
            Deposit
          </button>

          {/* Wallet address dropdown */}
          <button className="flex items-center gap-1.5 bg-s2 border border-brd px-3 h-[33px] rounded-[8px] text-[12px] text-t1 hover:bg-s3 transition-colors">
            <span>0x2389...9b54</span>
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Desktop/Mobile icon */}
          <div className="w-8 h-8 flex items-center justify-center border border-[#273035] rounded cursor-pointer hover:border-t3 transition-colors">
            <svg
              className="w-[18px] h-[18px] text-t3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>

          {/* Globe icon */}
          <div className="w-8 h-8 flex items-center justify-center border border-[#273035] rounded cursor-pointer hover:border-t3 transition-colors">
            <svg
              className="w-[18px] h-[18px] text-t3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
          </div>

          {/* Settings icon */}
          <div className="w-8 h-8 flex items-center justify-center border border-[#273035] rounded cursor-pointer hover:border-t3 transition-colors">
            <svg
              className="w-[18px] h-[18px] text-t3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <div className="flex md:hidden fixed bottom-0 left-0 right-0 bg-s1 border-t border-brd z-50">
        {NAV_ITEMS.filter((item) => item.enabled).map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex-1 py-3 text-center text-[11px] font-medium transition-colors",
              pathname === item.href ||
                (item.href === "/earn" && pathname === "/faucet")
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
