"use client"
import { useState, FormEvent } from "react"
import { api } from "@/lib/api"

export function ConnectBrokerForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accountInfo, setAccountInfo] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [mode, setMode] = useState<"rebalance" | "signals">("rebalance")
  const [paper, setPaper] = useState(true)

  async function testConnection() {
  const apiKey = (
    document.querySelector('input[name="api_key"]') as HTMLInputElement
  )?.value

  const apiSecret = (
    document.querySelector('input[name="api_secret"]') as HTMLInputElement
  )?.value

  if (!apiKey || !apiSecret) {
    setError("Enter API key and secret first.")
    return
  }

  setTesting(true)
  setError(null)
  setAccountInfo(null)

  try {
    const result = await api.brokers.testConnection({
      broker: "alpaca",
      api_key: apiKey,
      api_secret: apiSecret,
      paper,
    })

    setAccountInfo(result.account)
  } catch (err: any) {
    setError(err.data?.detail || "Connection failed.")
  } finally {
    setTesting(false)
  }
}

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    try {
      await api.brokers.connect({
        broker: "alpaca",
        api_key: form.get("api_key") as string,
        api_secret: form.get("api_secret") as string,
        paper,
        allocation_usd: Number(form.get("allocation_usd")),
        execution_mode: mode,
      })
      onSuccess()
    } catch (err: any) {
      setError(err.data?.detail || "Could not connect. Check your API keys.")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <h2 className="font-semibold text-lg">Connect Alpaca</h2>

      <button
          type="button"
          onClick={testConnection}
          disabled={testing}
          className="w-full rounded-lg border border-blue-200 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
        >
          {testing ? "Testing connection..." : "Test Connection"}
        </button>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setPaper(true)}
          className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
            paper ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500"
          }`}
        >
          Paper Trading
        </button>
        <button
          type="button"
          onClick={() => setPaper(false)}
          className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
            !paper ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500"
          }`}
        >
          Live Trading
        </button>
      </div>

      {!paper && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          Live trading will place real orders with real money. Test with paper trading first.
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-600 mb-1">Alpaca API Key</label>
        <input type="text" name="api_key" required className="input font-mono text-sm" placeholder="PK..." />
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Alpaca Secret Key</label>
        <input type="password" name="api_secret" required className="input font-mono text-sm" />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Strategy Allocation (USD)</label>
        <input type="number" name="allocation_usd" min={100} step={100} defaultValue={10000} required className="input" />
        <p className="text-xs text-gray-400 mt-1">Amount of your portfolio dedicated to this strategy.</p>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-2">Execution Mode</label>
        <div className="space-y-2">
          {[
            {
              id: "rebalance",
              title: "Full Rebalance Mirror",
              desc: "Your allocation is rebalanced monthly to exactly match the strategy's target weights.",
            },
            {
              id: "signals",
              title: "Signal-by-Signal",
              desc: "Each BUY/SELL signal places a 10% of allocation order. Simpler but less precise.",
            },
          ].map((opt) => (
            <label
              key={opt.id}
              className={`flex gap-3 rounded-lg border p-3 cursor-pointer ${
                mode === opt.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="mode"
                value={opt.id}
                checked={mode === opt.id as any}
                onChange={() => setMode(opt.id as any)}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium">{opt.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      
      {accountInfo && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2 text-sm">
          <h3 className="font-semibold text-green-800">
            Connection successful
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-500">Portfolio Value</p>
              <p className="font-medium">
                ${accountInfo.portfolio_value.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Buying Power</p>
              <p className="font-medium">
                ${accountInfo.buying_power.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Cash</p>
              <p className="font-medium">
                ${accountInfo.cash.toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-medium">
                {accountInfo.status}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? "Connecting..." : "Connect & Verify"}
        </button>
        <button type="button" onClick={onCancel} className="flex-1 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 py-2">
          Cancel
        </button>
      </div>
    </form>
  )
}
