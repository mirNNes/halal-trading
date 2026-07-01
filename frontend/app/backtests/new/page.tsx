"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { QuotaIndicator } from "@/components/QuotaIndicator"
import { StrategySelect } from "@/components/StrategySelect"

export default function NewBacktestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)

    try {
      const { backtest_id } = await api.backtests.create({
        strategyId: Number(form.get("strategyId")),
        startDate: form.get("startDate") as string,
        endDate: form.get("endDate") as string,
        startingCash: Number(form.get("startingCash")),
      })

      router.push(`/backtests/${backtest_id}`)
    } catch (err: any) {
      if (err.status === 402) {
        setError("Monthly backtest limit reached. Upgrade to run more.")
      } else {
        setError(err.message || "Something went wrong")
      }

      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Run a Backtest</h1>

      <form onSubmit={submit} className="space-y-4">
        <StrategySelect name="strategyId" />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              className="input"
              min="2020-01-01"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              className="input"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Starting Capital ($)
          </label>
          <input
            type="number"
            name="startingCash"
            defaultValue={100000}
            min={10000}
            step={1000}
            className="input"
            required
          />
        </div>

        <QuotaIndicator />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Submitting..." : "Run Backtest"}
        </button>
      </form>
    </div>
  )
}
