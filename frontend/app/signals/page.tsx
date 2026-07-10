"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { api } from "@/lib/api"
import { TradingSignal } from "@/types/signal"
import { Strategy } from "@/types/strategy"

export default function SignalsPage() {
  const [historicalSignals, setHistoricalSignals] = useState<TradingSignal[]>([])
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<number | undefined>()
  const [sub, setSub] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.stripe.subscription().catch(() => null),
      api.strategies.list().catch(() => []),
    ]).then(([subscriptionData, strategyData]) => {
      setSub(subscriptionData)
      setStrategies(strategyData)
    })
  }, [])

  useEffect(() => {
    setLoading(true)

    api.signals
      .list(selectedStrategy)
      .then(setHistoricalSignals)
      .catch((err) => {
        console.error("Failed to load signals:", err)
        setHistoricalSignals([])
      })
      .finally(() => setLoading(false))
  }, [selectedStrategy])

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Trading Signals</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review BUY, SELL, HOLD and WATCH signals from your strategies.
          </p>
        </div>

        {sub && !sub.liveSignalsEnabled && (
          <Link
            href="/pricing"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Upgrade for real-time signals →
          </Link>
        )}
      </div>

      {sub && !sub.liveSignalsEnabled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You are viewing signals with a 24-hour delay.{" "}
          <Link href="/pricing" className="font-medium underline">
            Upgrade
          </Link>{" "}
          for real-time access.
        </div>
      )}

      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium">Signal feed</p>
          <p className="text-sm text-gray-500">
            {historicalSignals.length} signal
            {historicalSignals.length === 1 ? "" : "s"} found
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="strategy-filter" className="text-sm font-medium">
            Strategy
          </label>

          <select
            id="strategy-filter"
            className="rounded border px-3 py-2 text-sm"
            value={selectedStrategy ?? ""}
            onChange={(e) =>
              setSelectedStrategy(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
          >
            <option value="">All strategies</option>

            {strategies.map((strategy) => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card text-sm text-gray-400">Loading signals...</div>
      ) : !historicalSignals.length ? (
        <div className="card">
          <h2 className="font-semibold">No signals yet</h2>
          <p className="mt-1 text-sm text-gray-500">
            Signals will appear here when an active strategy emits a trading
            decision.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {historicalSignals.map((signal, index) => (
            <SignalRow key={signal.id ?? index} signal={signal} />
          ))}
        </div>
      )}
    </div>
  )
}

function SignalRow({ signal }: { signal: TradingSignal }) {
  const colors: Record<string, string> = {
    BUY: "border-green-200 bg-green-50 text-green-700",
    SELL: "border-red-200 bg-red-50 text-red-700",
    HOLD: "border-gray-200 bg-gray-100 text-gray-700",
    WATCH: "border-blue-200 bg-blue-50 text-blue-700",
  }

  const actionClass =
    colors[signal.action] ?? "border-gray-200 bg-gray-100 text-gray-700"

  return (
    <div className="card">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex min-w-[170px] items-center gap-3">
          <span
            className={`rounded-md border px-2.5 py-1 text-xs font-bold ${actionClass}`}
          >
            {signal.action}
          </span>

          <div>
            <p className="text-lg font-semibold">{signal.ticker}</p>
            <p className="text-xs text-gray-500">
              {signal.strategy_name || "Unknown strategy"}
            </p>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-sm text-gray-700">
            {signal.reason || "No reason provided"}
          </p>

          {signal.strategy_risk_profile && (
            <p className="mt-1 text-xs text-gray-400">
              Risk profile: {signal.strategy_risk_profile}
            </p>
          )}
        </div>

        <div className="text-left md:text-right">
          <p className="text-xs text-gray-400">Emitted</p>
          <p className="text-sm text-gray-600">
            {new Date(signal.emitted_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
