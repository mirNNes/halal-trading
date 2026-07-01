"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { StatusBadge } from "@/components/StatusBadge"

type ExecutionOrder = {
  id: number
  signal_id: number | null
  rebalance_strategy_id: number | null
  broker: string
  ticker: string
  action: string
  notional_usd: number | null
  broker_order_id: string | null
  status: string
  filled_qty: number | null
  filled_price: number | null
  error_message: string | null
  submitted_at: string
  filled_at: string | null
}

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleString()
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined) return "-"

  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatQty(value: number | null) {
  if (value === null || value === undefined) return "-"
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 4,
  })
}

export default function ExecutionsPage() {
  const [orders, setOrders] = useState<ExecutionOrder[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const data = await api.executions.list().catch(() => [])
    setOrders(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) {
    return <div className="p-6 text-gray-400">Loading...</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Execution History</h1>
        <p className="text-sm text-gray-500 mt-1">
          View all orders created by your connected broker account.
        </p>
      </div>

      {!orders.length ? (
        <p className="text-gray-400 text-sm">No execution orders yet.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-gray-500">
                <th className="py-3 pr-4">Time</th>
                <th className="py-3 pr-4">Ticker</th>
                <th className="py-3 pr-4">Action</th>
                <th className="py-3 pr-4">Amount</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Filled Qty</th>
                <th className="py-3 pr-4">Filled Price</th>
                <th className="py-3 pr-4">Broker Order ID</th>
                <th className="py-3 pr-4">Error</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b last:border-b-0">
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {formatDate(order.submitted_at)}
                  </td>
                  <td className="py-3 pr-4 font-medium">
                    {order.ticker}
                  </td>
                  <td className="py-3 pr-4">
                    {order.action}
                  </td>
                  <td className="py-3 pr-4">
                    {formatMoney(order.notional_usd)}
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-3 pr-4">
                    {formatQty(order.filled_qty)}
                  </td>
                  <td className="py-3 pr-4">
                    {formatMoney(order.filled_price)}
                  </td>
                  <td className="py-3 pr-4 max-w-[220px] truncate text-gray-500">
                    {order.broker_order_id || "-"}
                  </td>
                  <td className="py-3 pr-4 max-w-[260px] truncate text-red-500">
                    {order.error_message || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
