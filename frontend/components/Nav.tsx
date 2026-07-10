"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

export function Nav() {
  const { user, logout, loading } = useAuth()
  const pathname = usePathname()

  const navClass = (href: string) =>
    pathname === href
      ? "text-blue-600 font-medium"
      : "text-gray-600 hover:text-gray-900"

  return (
    <nav className="border-b bg-white px-6 py-3 flex items-center justify-between">
      <Link href="/" className="font-semibold text-gray-900">
        Halal Trading
      </Link>

      <div className="flex items-center gap-6 text-sm">
        {!loading && (
          <>
            {user ? (
              <>
                <Link href="/dashboard" className={navClass("/dashboard")}>
                  Dashboard
                </Link>

                <Link href="/backtests" className={navClass("/backtests")}>
                  Backtests
                </Link>

                <Link href="/signals" className={navClass("/signals")}>
                  Signals
                </Link>

                <Link href="/market-data" className={navClass("/market-data")}>
                  Market Data
                </Link>

                <Link href="/compliance" className={navClass("/compliance")}>
                  Compliance
                </Link>

                <Link href="/brokers" className={navClass("/brokers")}>
                  Broker
                </Link>

                <Link href="/billing" className={navClass("/billing")}>
                  Billing
                </Link>

                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-gray-600"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/pricing" className={navClass("/pricing")}>
                  Pricing
                </Link>

                <Link href="/login" className={navClass("/login")}>
                  Sign in
                </Link>

                <Link href="/register" className="btn-primary">
                  Get started
                </Link>
              </>
            )}
          </>
        )}
      </div>
    </nav>
  )
}
