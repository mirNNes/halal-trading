"use client"

import { useState } from "react"
import { api } from "@/lib/api"
import { StatusBadge } from "@/components/StatusBadge"

export default function PortfolioScanner() {
  const [portfolio, setPortfolio] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function analyzePortfolio() {
    const tickers = portfolio
      .split(/[\s,]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean)

    if (!tickers.length) return

    setLoading(true)

    try {
      const response = await api.compliance.checkBatch(tickers)
      setResults(response)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border bg-white p-6 mt-8">
      <h2 className="text-lg font-semibold mb-4">
        Portfolio Compliance Scan
      </h2>

      <textarea
        rows={6}
        className="w-full rounded border p-3"
        placeholder={`AAPL
MSFT
NVDA
NFLX
KO`}
        value={portfolio}
        onChange={(e) => setPortfolio(e.target.value)}
      />

      <button
        className="btn-primary mt-4"
        onClick={analyzePortfolio}
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Analyze Portfolio"}
      </button>

      {results.length > 0 && (
        <table className="w-full mt-6 border">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Ticker</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Score</th>
            </tr>
          </thead>

          <tbody>
            {results.map((r) => (
              <tr key={r.ticker} className="border-b">
                <td className="p-2">{r.ticker}</td>
                <td className="p-2">
                  <StatusBadge status={r.status} />
                </td>
                <td className="p-2">
                  {Math.round(r.score * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
