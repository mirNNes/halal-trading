"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type PriceBar = {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

type MarketDataResponse = {
  ticker: string
  latest: PriceBar | null
  history: PriceBar[]
}

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) return "-"

  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "-"

  return Number(value).toLocaleString("en-US")
}

function saveRecent(symbol: string) {
  const current = JSON.parse(
    localStorage.getItem("recentTickers") || "[]"
  ) as string[]

  const updated = [symbol, ...current.filter((t) => t !== symbol)].slice(0, 5)

  localStorage.setItem("recentTickers", JSON.stringify(updated))

  return updated
}

function loadRecent() {
  return JSON.parse(localStorage.getItem("recentTickers") || "[]") as string[]
}

export default function MarketDataPage() {
  const [ticker, setTicker] = useState("")
  const [recent, setRecent] = useState<string[]>([])
  const [data, setData] = useState<MarketDataResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load(symbol?: string) {
    const selectedTicker = (symbol || ticker).trim().toUpperCase()

    if (!selectedTicker) return

    setLoading(true)
    setError(null)

    try {
      const result = await api.marketData.get(selectedTicker)
      setData(result)

      const updated = saveRecent(result.ticker)
      setRecent(updated)
      setTicker(result.ticker)
    } catch (err: any) {
      setError(err.message || "Failed to load market data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setRecent(loadRecent())
  }, [])

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Market Data</h1>
        <p className="text-sm text-gray-500 mt-1">
          Search for market data by ticker symbol.
        </p>
      </div>

      <div className="card space-y-4">
        <div className="flex gap-3">
          <input
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                load()
              }
            }}
            className="border rounded px-3 py-2 text-sm w-40"
            placeholder="Search ticker..."
          />

          <button
            onClick={() => load()}
            disabled={loading || !ticker.trim()}
            className="px-4 py-2 rounded bg-black text-white text-sm disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {recent.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Recent Searches</p>

            <div className="flex gap-2 flex-wrap">
              {recent.map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => load(symbol)}
                  className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && <p className="text-sm text-gray-500">Loading...</p>}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {data?.latest && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Ticker</p>
              <p className="font-medium">{data.ticker}</p>
            </div>

            <div>
              <p className="text-3xl font-bold">
                {formatMoney(data.latest.close)}
              </p>
              <p className="text-gray-500 text-sm">Last close</p>
            </div>

            <div>
              <p className="text-gray-500">High</p>
              <p className="font-medium">{formatMoney(data.latest.high)}</p>
            </div>

            <div>
              <p className="text-gray-500">Low</p>
              <p className="font-medium">{formatMoney(data.latest.low)}</p>
            </div>

            <div>
              <p className="text-gray-500">Volume</p>
              <p className="font-medium">{formatNumber(data.latest.volume)}</p>
            </div>
          </div>
        )}
      </div>

      {data && data.history.length > 0 && (
        <div className="card space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Price Chart</h2>
            <p className="text-sm text-gray-500">
              Closing price for the last {data.history.length} trading days.
            </p>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.history}>
                <XAxis dataKey="time" />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip formatter={(value) => formatMoney(Number(value))} />
                <Line type="monotone" dataKey="close" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-gray-500">
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Open</th>
                <th className="py-3 pr-4">High</th>
                <th className="py-3 pr-4">Low</th>
                <th className="py-3 pr-4">Close</th>
                <th className="py-3 pr-4">Volume</th>
              </tr>
            </thead>

            <tbody>
              {data.history.map((bar) => (
                <tr key={bar.time} className="border-b last:border-b-0">
                  <td className="py-3 pr-4 whitespace-nowrap">{bar.time}</td>
                  <td className="py-3 pr-4">{formatMoney(bar.open)}</td>
                  <td className="py-3 pr-4">{formatMoney(bar.high)}</td>
                  <td className="py-3 pr-4">{formatMoney(bar.low)}</td>
                  <td className="py-3 pr-4 font-medium">
                    {formatMoney(bar.close)}
                  </td>
                  <td className="py-3 pr-4">{formatNumber(bar.volume)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
