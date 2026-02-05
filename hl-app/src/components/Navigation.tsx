'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavigationProps {
  balance: number
  wsConnected: boolean
  onAuthClick: () => void
  isLoggedIn: boolean
  onSignOut: () => void
}

export function Navigation({ balance, wsConnected, onAuthClick, isLoggedIn, onSignOut }: NavigationProps) {
  const pathname = usePathname()

  const links = [
    { href: '/trade', label: 'Trade' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/faucet', label: 'Faucet' },
  ]

  return (
    <div className="flex items-center h-[38px] px-2.5 border-b border-brd">
      {/* Brand */}
      <div className="flex items-center gap-1.5 pr-3.5 border-r border-brd mr-1 h-full">
        <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]">
          <rect width="24" height="24" rx="5" fill="rgb(80,210,193)" />
          <path d="M7 8h3.5v8H7V8zm6.5 0H17v8h-3.5V8z" fill="#000" />
        </svg>
        <span className="font-bold text-[13px] tracking-[-0.3px]">Hyperliquid</span>
        <span className="bg-acc2 text-acc text-[8px] py-0.5 px-[5px] rounded-[3px] font-bold tracking-[0.5px] border border-[rgba(80,210,193,0.15)]">
          SIMULATOR
        </span>
      </div>

      {/* Links */}
      <div className="hidden md:flex h-full items-stretch">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center px-2.5 text-[11px] font-medium cursor-pointer border-b-2 transition-all duration-[120ms] ${
              pathname === l.href
                ? 'text-t1 border-acc'
                : 'text-t4 border-transparent hover:text-t2'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center gap-1.5">
        <div
          className={`w-[7px] h-[7px] rounded-full mr-1 ${
            wsConnected
              ? 'bg-grn shadow-[0_0_4px_var(--color-grn)] animate-[pdot_2s_infinite]'
              : 'bg-red'
          }`}
        />
        <div className="flex items-center gap-[5px] py-1 px-2.5 bg-s2 border border-brd rounded text-[11px]">
          <span className="text-t3 font-medium hidden md:inline">Equity:</span>
          <span className="font-bold text-acc tabular-nums">{balance.toFixed(2)}</span>
        </div>
        {isLoggedIn ? (
          <button
            onClick={onSignOut}
            className="py-1 px-2 bg-s2 border border-brd rounded text-[10px] text-t3 hover:text-t1 transition-colors cursor-pointer"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={onAuthClick}
            className="py-1 px-2 bg-acc2 border border-[rgba(80,210,193,0.15)] rounded text-[10px] text-acc font-semibold hover:bg-acc3 transition-colors cursor-pointer"
          >
            Login
          </button>
        )}
      </div>
    </div>
  )
}
