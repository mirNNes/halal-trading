"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { api } from "@/lib/api"

const TIERS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Core access for testing the platform.",
    features: [
      "3 backtests per month",
      "All strategies in backtest view",
      "Signals delayed by 24 hours",
      "7-day signal history",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: "$15",
    period: "/ month",
    description: "For users who need live signals and more backtests.",
    features: [
      "20 backtests per month",
      "All strategies",
      "Real-time live signals",
      "90-day signal history",
    ],
    cta: "Upgrade to Starter",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$49",
    period: "/ month",
    description: "For active users who need unrestricted testing.",
    features: [
      "Unlimited backtests",
      "All strategies",
      "Real-time live signals",
      "Full signal history",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
]

export default function PricingPage() {
  const router = useRouter()

  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade(tierId: string) {
    if (tierId === "free") {
      router.push("/dashboard")
      return
    }

    setLoading(tierId)
    setError(null)

    try {
      const { checkout_url } = await api.stripe.checkout(tierId)
      window.location.href = checkout_url
    } catch (err: any) {
      if (err.status === 401) {
        router.push("/login?next=/pricing")
        return
      }

      setError("Could not start checkout. Please try again.")
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Simple, transparent pricing</h1>
          <p className="mt-2 text-gray-500">
            Start free and upgrade when you need live signals or more backtests.
          </p>
        </div>

        {error && (
          <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`flex flex-col rounded-2xl border bg-white p-8 ${
                tier.highlighted
                  ? "border-blue-500 ring-2 ring-blue-500"
                  : "border-gray-200"
              }`}
            >
              <div>
                {tier.highlighted && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                    Recommended
                  </span>
                )}

                <h2 className="mt-1 text-xl font-bold">{tier.name}</h2>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="text-sm text-gray-400">{tier.period}</span>
                </div>

                <p className="mt-3 min-h-[48px] text-sm text-gray-500">
                  {tier.description}
                </p>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-gray-600"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-0.5 font-medium text-green-600"
                    >
                      ✓
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(tier.id)}
                disabled={loading !== null}
                className={`mt-8 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  tier.highlighted
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {loading === tier.id ? "Redirecting..." : tier.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400">
          Subscription management and payments are handled securely through
          Stripe.
        </p>
      </div>
    </div>
  )
}
