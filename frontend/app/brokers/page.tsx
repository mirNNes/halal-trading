"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { ConnectBrokerForm } from "@/components/ConnectBrokerForm"

export default function BrokersPage() {
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    const data = await api.brokers.list().catch(() => [])
    setConnections(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleAutoExecute(id: number, current: boolean) {
    await api.brokers.update(id, { auto_execute: !current })
    load()
  }

  async function disconnect(id: number) {
    if (!confirm("Disconnect this broker? Auto-execution will stop.")) return
    await api.brokers.disconnect(id)
    load()
  }

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Broker Connections</h1>
          <p className="text-sm text-gray-500 mt-1">
            Connect your brokerage to auto-execute strategy signals.
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            Connect Broker
          </button>
        )}
      </div>

      <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
        <strong>Important:</strong> By enabling auto-execute, you authorise this platform
        to place orders in your brokerage account on your behalf based on strategy signals.
        You remain solely responsible for all trades. Use paper trading to test first.
      </div>

      {showForm && (
        <ConnectBrokerForm
          onSuccess={() => { setShowForm(false); load() }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {!connections.length && !showForm ? (
        <p className="text-gray-400 text-sm">No brokers connected yet.</p>
      ) : (
        <div className="space-y-3">
          {connections.map((conn) => (
            <div key={conn.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold capitalize">{conn.broker}</span>
                    {conn.paper && (
                      <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">Paper</span>
                    )}
                    {!conn.is_active && (
                      <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">Disconnected</span>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Allocation</p>
                      <p className="font-medium">${conn.allocation_usd.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Mode</p>
                      <p className="font-medium capitalize">{conn.execution_mode}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Auto-Execute</p>
                      <button
                        onClick={() => toggleAutoExecute(conn.id, conn.auto_execute)}
                        className={`mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                          conn.auto_execute
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {conn.auto_execute ? "Enabled" : "Paused"}
                      </button>
                    </div>
                  </div>
                </div>
                {conn.is_active && (
                  <button
                    onClick={() => disconnect(conn.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
