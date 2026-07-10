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
    const symbol = ticker.trim().toUpperCase()

    if (!symbol) return

    setTicker(symbol)
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const data = await api.compliance.check(symbol)
      setResult(data)
    } catch (err: any) {
      setError(err.message || "Could not check compliance")
    } finally {
      setLoading(false)
    }
  }

  const score =
    result?.score !== null && result?.score !== undefined
      ? `${Math.round(Number(result.score) * 100)}%`
      : "-"

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Compliance Center</h1>
        <p className="mt-1 text-sm text-gray-500">
          Check individual tickers and scan portfolios against the current
          halal compliance rules.
        </p>
      </div>

      <div className="card space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Ticker compliance check</h2>
          <p className="mt-1 text-sm text-gray-500">
            Enter a stock ticker to review its current compliance status.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                checkTicker()
              }
            }}
            placeholder="Enter ticker, for example AAPL"
            className="w-full rounded border px-3 py-2 text-sm md:max-w-md"
          />

          <button
            onClick={checkTicker}
            disabled={loading || !ticker.trim()}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Checking..." : "Check compliance"}
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="rounded-lg border bg-gray-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm text-gray-500">Compliance result</p>
                <p className="mt-1 text-3xl font-semibold">{result.ticker}</p>
              </div>

              <StatusBadge status={result.status} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-500">Score</p>
                <p className="mt-1 text-lg font-semibold">{score}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Source</p>
                <p className="mt-1 text-lg font-semibold">
                  {result.source || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="mt-1 text-lg font-semibold capitalize">
                  {result.status || "-"}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <p className="text-sm text-gray-500">Reason</p>
              <p className="mt-1 text-sm text-gray-700">
                {result.reason || "No additional explanation provided."}
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Portfolio compliance scan</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review multiple holdings together and identify positions that may
            require attention.
          </p>
        </div>

        <PortfolioScanner />
      </div>
    </div>
  )
}
