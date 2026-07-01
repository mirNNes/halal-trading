"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { api } from "@/lib/api"

type Strategy = {
  id: number
  name: string
  description: string | null
  risk_profile: string
  qc_project_id: string | null
  is_active: boolean
  is_live: boolean
}

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function loadStrategies() {
    try {
      setLoading(true)
      setError("")
      const data = await api.strategies.list()
      setStrategies(data)
    } catch (err: any) {
      setError(err.message || "Could not load strategies")
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(id: number) {
    try {
      await api.strategies.toggleActive(id)
      await loadStrategies()
    } catch (err: any) {
      setError(err.message || "Could not update strategy")
    }
  }

  async function deleteStrategy(id: number) {
    const confirmed = window.confirm("Delete this strategy?")
    if (!confirmed) return

    try {
      await api.strategies.delete(id)
      await loadStrategies()
    } catch (err: any) {
      setError(err.message || "Could not delete strategy")
    }
  }

  useEffect(() => {
    loadStrategies()
  }, [])

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Strategies</h1>
          <p className="text-sm text-gray-500">
            Manage trading strategies used for backtests and signals.
          </p>
        </div>

        <Link
          href="/strategies/new"
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          New strategy
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading strategies...</p>
      ) : strategies.length === 0 ? (
        <div className="rounded border p-6 text-sm text-gray-600">
          No strategies found.
        </div>
      ) : (
        <div className="overflow-hidden rounded border">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Risk</th>
                <th className="p-3">QuantConnect</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((strategy) => (
                <tr key={strategy.id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{strategy.name}</div>
                    <div className="text-xs text-gray-500">
                      {strategy.description || "No description"}
                    </div>
                  </td>

                  <td className="p-3 capitalize">{strategy.risk_profile}</td>

                  <td className="p-3">
                    {strategy.qc_project_id ? strategy.qc_project_id : "Local fallback"}
                  </td>

                  <td className="p-3">
                    {strategy.is_active ? (
                      <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                        Inactive
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/strategies/${strategy.id}/edit`}
                        className="rounded border px-3 py-1"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() => toggleActive(strategy.id)}
                        className="rounded border px-3 py-1"
                      >
                        {strategy.is_active ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        onClick={() => deleteStrategy(strategy.id)}
                        className="rounded border px-3 py-1 text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
