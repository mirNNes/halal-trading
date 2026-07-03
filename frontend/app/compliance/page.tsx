"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import { StatusBadge } from "@/components/StatusBadge"
import PortfolioScanner from "@/components/compliance/PortfolioScanner"

export default function CompliancePage() {
  const [ticker, setTicker] = useState("")
  const [result, setResult] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function checkTicker() {
    if (!ticker.trim()) return

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const data = await api.compliance.check(ticker.trim().toUpperCase())
      setResult(data)
    } catch (err: any) {
      setError(err.message || "Could not check compliance")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Compliance Center</h1>
        <p className="text-sm text-gray-500 mt-1">
          Check whether a ticker passes the current halal compliance rules.
        </p>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ticker</label>
          <div className="flex gap-2">
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="AAPL"
              className="w-full rounded border px-3 py-2 text-sm"
            />
            <button
              onClick={checkTicker}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Checking..." : "Check"}
            </button>
          </div>
        </div>

        {result && (
          <div className="rounded border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ticker</p>
                <p className="text-xl font-semibold">{result.ticker}</p>
              </div>
              <StatusBadge status={result.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Score</p>
                <p className="font-medium">
                  {result.score !== null
                    ? `${Math.round(result.score * 100)}%`
                    : "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Source</p>
                <p className="font-medium">{result.source}</p>
              </div>

              <div className="col-span-2">
                <p className="text-gray-500">Reason</p>
                <p className="font-medium">{result.reason || "-"}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <PortfolioScanner />
    </div>
  )
}
