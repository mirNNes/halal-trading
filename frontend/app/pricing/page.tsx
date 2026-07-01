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
    features: [
      "3 backtests / month",
      "All strategies (backtest view)",
      "Signals delayed 24 hours",
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
    features: [
      "20 backtests / month",
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
      } else {
        setError("Something went wrong. Please try again.")
      }
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold">Simple, transparent pricing</h1>
          <p className="text-gray-500 mt-2">Start free. Upgrade when you need live signals.</p>
        </div>

        {error && (
          <p className="text-center text-sm text-red-600 mb-6">{error}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-2xl border bg-white p-8 flex flex-col gap-6 ${
                tier.highlighted ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-200"
              }`}
            >
              <div>
                {tier.highlighted && (
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <h2 className="text-xl font-bold mt-1">{tier.name}</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="text-gray-400 text-sm">{tier.period}</span>
                </div>
              </div>

              <ul className="space-y-2 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(tier.id)}
                disabled={loading === tier.id}
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${
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
      </div>
    </div>
  )
}
