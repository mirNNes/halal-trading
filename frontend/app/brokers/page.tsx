"use client"

import { useEffect, useState } from "react"

import { api } from "@/lib/api"
import { ConnectBrokerForm } from "@/components/ConnectBrokerForm"
import { StatusBadge } from "@/components/StatusBadge"

export default function BrokersPage() {
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)

  async function load() {
    const data = await api.brokers.list().catch(() => [])
    setConnections(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function toggleAutoExecute(id: number, current: boolean) {
    try {
      setBusyId(id)
      await api.brokers.update(id, { auto_execute: !current })
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function disconnect(id: number) {
    const confirmed = confirm(
      "Disconnect this broker? Auto-execution will stop."
    )

    if (!confirmed) return

    try {
      setBusyId(id)
      await api.brokers.disconnect(id)
      await load()
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-400">Loading broker connections...</div>
  }

  const activeConnections = connections.filter(
    (connection) => connection.is_active
  ).length

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Broker Connections</h1>
          <p className="mt-1 text-sm text-gray-500">
            Connect a brokerage account and control how strategy signals are
            executed.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            Connect Broker
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card border-t-4 border-emerald-500">
          <p className="text-sm text-gray-500">Active Connections</p>
          <p className="mt-1 text-xl font-semibold">{activeConnections}</p>
        </div>

        <div className="card border-t-4 border-blue-500">
          <p className="text-sm text-gray-500">Connected Brokers</p>
          <p className="mt-1 text-xl font-semibold">{connections.length}</p>
        </div>

        <div className="card border-t-4 border-amber-500">
          <p className="text-sm text-gray-500">Recommended Mode</p>
          <p className="mt-1 text-xl font-semibold">Paper Trading</p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Important:</strong> Auto-execution allows the platform to place
        orders in your brokerage account from strategy signals. Test the full
        flow with paper trading before enabling live trading.
      </div>

      {showForm && (
        <div className="card">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Connect a broker</h2>
            <p className="mt-1 text-sm text-gray-500">
              Add your brokerage credentials and choose the execution settings.
            </p>
          </div>

          <ConnectBrokerForm
            onSuccess={() => {
              setShowForm(false)
              load()
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {!connections.length && !showForm ? (
        <div className="card py-10 text-center">
          <h2 className="text-lg font-semibold">No broker connected</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500">
            Connect an Alpaca paper account to view balances, positions and test
            automatic order execution without using real money.
          </p>

          <button
            onClick={() => setShowForm(true)}
            className="btn-primary mt-5"
          >
            Connect your first broker
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => {
            const brokerName =
              connection.broker?.charAt(0).toUpperCase() +
                connection.broker?.slice(1) || "Broker"

            const isBusy = busyId === connection.id

            return (
              <div key={connection.id} className="card">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{brokerName}</h2>

                      <StatusBadge
                        status={
                          connection.is_active ? "connected" : "disconnected"
                        }
                      />

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          connection.paper
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {connection.paper ? "Paper Trading" : "Live Trading"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-5 text-sm sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-gray-400">Allocation</p>
                        <p className="mt-1 font-medium">
                          {Number(
                            connection.allocation_usd || 0
                          ).toLocaleString("en-US", {
                            style: "currency",
                            currency: "USD",
                          })}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">Execution Mode</p>
                        <p className="mt-1 font-medium capitalize">
                          {connection.execution_mode || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">Auto-Execute</p>

                        <button
                          onClick={() =>
                            toggleAutoExecute(
                              connection.id,
                              connection.auto_execute
                            )
                          }
                          disabled={isBusy || !connection.is_active}
                          className={`mt-1 rounded-full px-2.5 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                            connection.auto_execute
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {isBusy
                            ? "Updating..."
                            : connection.auto_execute
                              ? "Enabled"
                              : "Paused"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {connection.is_active && (
                    <button
                      onClick={() => disconnect(connection.id)}
                      disabled={isBusy}
                      className="text-sm font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {isBusy ? "Please wait..." : "Disconnect"}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
