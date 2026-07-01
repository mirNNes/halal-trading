"use client"

import { useEffect, useState } from "react"

import { api } from "@/lib/api"
import { TradingSignal } from "@/types/signal"
import { Strategy } from "@/types/strategy"

export default function SignalsPage() {
  const [historicalSignals, setHistoricalSignals] = useState<TradingSignal[]>([])
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<number | undefined>()
  const [sub, setSub] = useState<any>(null)

  useEffect(() => {
    api.stripe.subscription().then(setSub).catch(console.error)
    api.strategies.list().then(setStrategies).catch(console.error)
  }, [])

  useEffect(() => {
    api.signals
      .list(selectedStrategy)
      .then(setHistoricalSignals)
      .catch((err) => {
        console.error("Failed to load signals:", err)
      })
  }, [selectedStrategy])

  const signals = historicalSignals

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Signals</h1>

        {sub && !sub.liveSignalsEnabled && (
          <a href="/pricing" className="text-xs text-blue-600 hover:underline">
            Upgrade for real-time signals →
          </a>
        )}
      </div>

      {sub && !sub.liveSignalsEnabled && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          You are viewing signals with a 24-hour delay.{" "}
          <a href="/pricing" className="font-medium underline">
            Upgrade
          </a>{" "}
          for real-time access.
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Strategy</label>

        <select
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

      {!signals.length ? (
        <p className="text-sm text-gray-400">No signals yet.</p>
      ) : (
        <div className="space-y-2">
          {signals.map((signal, i) => (
            <SignalRow key={signal.id ?? i} signal={signal} />
          ))}
        </div>
      )}
    </div>
  )
}

function SignalRow({ signal }: { signal: TradingSignal }) {
  const colors: Record<string, string> = {
    BUY: "text-green-600 bg-green-50",
    SELL: "text-red-600 bg-red-50",
    HOLD: "text-gray-600 bg-gray-100",
    WATCH: "text-blue-600 bg-blue-50",
  }

  return (
    <div className="card flex items-center gap-4">
      <span
        className={`rounded-md px-2.5 py-1 text-xs font-bold ${
          colors[signal.action] ?? "bg-gray-100 text-gray-600"
        }`}
      >
        {signal.action}
      </span>

      <div>
        <div className="font-semibold">{signal.ticker}</div>
        <div className="text-xs text-gray-400">
          {signal.strategy_name} · {signal.strategy_risk_profile}
        </div>
      </div>

      <span className="flex-1 text-sm text-gray-500">
        {signal.reason || "No reason provided"}
      </span>

      <span className="text-xs text-gray-400">
        {new Date(signal.emitted_at).toLocaleString()}
      </span>
    </div>
  )
}
