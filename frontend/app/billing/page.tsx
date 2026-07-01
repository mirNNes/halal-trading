"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { api } from "@/lib/api"

function BillingContent() {
  const searchParams = useSearchParams()
  const upgraded = searchParams.get("upgraded") === "true"
  const [sub, setSub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    api.stripe.subscription().then(setSub).finally(() => setLoading(false))
  }, [])

  async function openPortal() {
    setPortalLoading(true)
    try {
      const { portal_url } = await api.stripe.portal()
      window.location.href = portal_url
    } catch {
      setPortalLoading(false)
    }
  }

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Billing</h1>

      {upgraded && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Upgrade successful — live signals are now enabled.
        </div>
      )}

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Current Plan</p>
            <p className="text-xl font-semibold capitalize mt-0.5">{sub?.tier ?? "Free"}</p>
          </div>
          <StatusPill status={sub?.status ?? "active"} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Live Signals</p>
            <p className="font-medium mt-0.5">{sub?.liveSignalsEnabled ? "Enabled" : "Not included"}</p>
          </div>

          <div>
            <p className="text-gray-400">Backtests / month</p>
            <p className="font-medium mt-0.5">
              {sub?.backtestQuota === -1 ? "Unlimited" : sub?.backtestQuota ?? 3}
            </p>
          </div>

          {sub?.validUntil && (
            <div>
              <p className="text-gray-400">Renews</p>
              <p className="font-medium mt-0.5">
                {new Date(sub.validUntil).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        {sub?.tier !== "free" ? (
          <button onClick={openPortal} disabled={portalLoading} className="btn-primary">
            {portalLoading ? "Opening..." : "Manage Subscription"}
          </button>
        ) : (
          <a href="/pricing" className="btn-primary inline-block text-center">
            Upgrade Plan
          </a>
        )}
      </div>

      {sub?.status === "past_due" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Your last payment failed. Please update your payment method to restore access.
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    past_due: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
  }

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status.replace("_", " ")}
    </span>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Loading...</div>}>
      <BillingContent />
    </Suspense>
  )
}
