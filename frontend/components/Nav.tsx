"use client"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"

export function Nav() {
  const { user, logout, loading } = useAuth()

  return (
    <nav className="border-b bg-white px-6 py-3 flex items-center justify-between">
      <Link href="/" className="font-semibold text-gray-900">Halal Trading</Link>

      <div className="flex items-center gap-6 text-sm">
        {!loading && (
          <>
            {user ? (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
                <Link href="/backtests" className="text-gray-600 hover:text-gray-900">Backtests</Link>
                <Link href="/signals" className="text-gray-600 hover:text-gray-900">Signals</Link>
                <Link href="/billing" className="text-gray-600 hover:text-gray-900">Billing</Link>
                <button onClick={logout} className="text-gray-400 hover:text-gray-600">Sign out</button>
              </>
            ) : (
              <>
                <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
                <Link href="/login" className="text-gray-600 hover:text-gray-900">Sign in</Link>
                <Link href="/register" className="btn-primary">Get started</Link>
              </>
            )}
          </>
        )}
      </div>
    </nav>
  )
}
