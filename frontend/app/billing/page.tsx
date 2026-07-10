"use client"

import Link from "next/link"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import { api } from "@/lib/api"

function BillingContent() {
  const searchParams = useSearchParams()
  const upgraded = searchParams.get("upgraded") === "true"

  const [sub, setSub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    api.stripe
      .subscription()
      .then(setSub)
      .catch((err) => {
        setError(err.message || "Could not load subscription details")
      })
      .finally(() => setLoading(false))
  }, [])

  async function openPortal() {
    setPortalLoading(true)
    setError("")

    try {
      const { portal_url } = await api.stripe.portal()
      window.location.href = portal_url
    } catch (err: any) {
      setError(err.message || "Could not open the billing portal")
      setPortalLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-400">Loading billing details...</div>
  }

  const tier = sub?.tier ?? "free"
  const status = sub?.status ?? "active"
  const isFree = tier.toLowerCase() === "free"

  const backtestQuota =
    sub?.backtestQuota === -1
      ? "Unlimited"
      : String(sub?.backtestQuota ?? 3)

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review your current plan, subscription status and included features.
        </p>
      </div>

      {upgraded && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Upgrade successful. Live signals are now enabled.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {status === "past_due" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Your last payment failed. Update your payment method to restore full
          access.
        </div>
      )}

      <div className="card">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Current plan
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-semibold capitalize">{tier}</h2>
              <StatusPill status={status} />
            </div>

            <p className="mt-2 text-sm text-gray-500">
              {isFree
                ? "Start with core platform access and upgrade when you need live signals."
                : "Your subscription includes enhanced trading and strategy features."}
            </p>
          </div>

          <div>
            {isFree ? (
              <Link href="/pricing" className="btn-primary inline-block text-center">
                Upgrade Plan
              </Link>
            ) : (
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {portalLoading ? "Opening..." : "Manage Subscription"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card border-t-4 border-blue-500">
          <p className="text-sm text-gray-500">Live Signals</p>
          <p className="mt-1 text-xl font-semibold">
            {sub?.liveSignalsEnabled ? "Enabled" : "Not included"}
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Access trading signals without the standard delay.
          </p>
        </div>

        <div className="card border-t-4 border-violet-500">
          <p className="text-sm text-gray-500">Backtests per month</p>
          <p className="mt-1 text-xl font-semibold">{backtestQuota}</p>
          <p className="mt-2 text-sm text-gray-400">
            Run historical tests across your trading strategies.
          </p>
        </div>

        <div className="card border-t-4 border-emerald-500">
          <p className="text-sm text-gray-500">
            {sub?.validUntil ? "Next renewal" : "Subscription status"}
          </p>

          <p className="mt-1 text-xl font-semibold">
            {sub?.validUntil
              ? new Date(sub.validUntil).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : status.replace("_", " ")}
          </p>

          <p className="mt-2 text-sm text-gray-400">
            Manage payment details through the secure billing portal.
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold">Plan features</h2>
        <p className="mt-1 text-sm text-gray-500">
          Features currently available on your account.
        </p>

        <div className="mt-5 divide-y">
          <FeatureRow
            label="Halal compliance checks"
            value="Included"
          />

          <FeatureRow
            label="Portfolio compliance scan"
            value="Included"
          />

          <FeatureRow
            label="Market data"
            value="Included"
          />

          <FeatureRow
            label="Live signals"
            value={sub?.liveSignalsEnabled ? "Included" : "Upgrade required"}
          />

          <FeatureRow
            label="Monthly backtests"
            value={backtestQuota}
          />
        </div>
      </div>
    </div>
  )
}

function FeatureRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    past_due: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
    canceled: "bg-gray-100 text-gray-500",
    trialing: "bg-blue-100 text-blue-700",
  }

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        styles[status] ?? "bg-gray-100 text-gray-500"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  )
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-gray-400">Loading billing details...</div>
      }
    >
      <BillingContent />
    </Suspense>
  )
}
