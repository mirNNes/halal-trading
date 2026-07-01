"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { StatusBadge } from "@/components/StatusBadge"

export default function DashboardPage() {
  const [brokers, setBrokers] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [account, setAccount] = useState<any | null>(null)
  const [positions, setPositions] = useState<any | null>(null)
  const [strategies, setStrategies] = useState<any[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    const [brokerData, orderData, accountData, positionData, strategyData] =
      await Promise.all([
        api.brokers.list().catch(() => []),
        api.executions.list().catch(() => []),
        api.brokers.account().catch(() => null),
        api.brokers.positions().catch(() => null),
        api.strategies.list().catch(() => []),
      ])

    setBrokers(brokerData)
    setOrders(orderData)
    setAccount(accountData)
    setPositions(positionData)
    setStrategies(strategyData)
    setLastUpdated(new Date())
    setLoading(false)
  }

  useEffect(() => {
    load()

    const interval = setInterval(() => {
      load()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const activeBroker = brokers.find((b) => b.is_active)
  const recentOrders = orders.slice(0, 5)
  const accountInfo = account?.account

  const positionItems = positions?.positions
    ? Object.entries(positions.positions)
    : []

  const activeStrategies = strategies.filter((s) => s.is_active).length

  const today = new Date().toDateString()

  const ordersToday = orders.filter((order) => {
    return new Date(order.submitted_at).toDateString() === today
  }).length

  const openPositionsCount = positionItems.length

  if (loading) {
    return <div className="p-6 text-gray-400">Loading...</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        {lastUpdated && (
          <p className="text-sm text-gray-500">
            Last updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Portfolio Value</p>
          <p className="text-xl font-semibold mt-1">
            {accountInfo
              ? `$${Number(accountInfo.portfolio_value).toLocaleString()}`
              : "-"}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-500">Cash</p>
          <p className="text-xl font-semibold mt-1">
            {accountInfo
              ? `$${Number(accountInfo.cash).toLocaleString()}`
              : "-"}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-500">Buying Power</p>
          <p className="text-xl font-semibold mt-1">
            {accountInfo
              ? `$${Number(accountInfo.buying_power).toLocaleString()}`
              : "-"}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-500">Broker Status</p>

          <div className="mt-2">
            <StatusBadge
              status={
                accountInfo
                  ? accountInfo.status.toLowerCase()
                  : activeBroker
                  ? "connected"
                  : "disconnected"
              }
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Active Strategies</p>
          <p className="text-xl font-semibold mt-1">{activeStrategies}</p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-500">Orders Today</p>
          <p className="text-xl font-semibold mt-1">{ordersToday}</p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-500">Open Positions</p>
          <p className="text-xl font-semibold mt-1">
            {openPositionsCount}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/backtests"
          className="card hover:border-blue-300 transition-colors"
        >
          <h2 className="font-semibold text-lg">Backtests</h2>
          <p className="text-sm text-gray-500 mt-1">
            Run and review historical strategy performance
          </p>
        </Link>

        <Link
          href="/signals"
          className="card hover:border-blue-300 transition-colors"
        >
          <h2 className="font-semibold text-lg">Live Signals</h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time trade signals from active strategies
          </p>
        </Link>

        <Link
          href="/brokers"
          className="card hover:border-blue-300 transition-colors"
        >
          <h2 className="font-semibold text-lg">
            Broker Connections
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage Alpaca connection and auto-execution
          </p>
        </Link>

        <Link
          href="/executions"
          className="card hover:border-blue-300 transition-colors"
        >
          <h2 className="font-semibold text-lg">
            Execution History
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Review orders sent to your broker
          </p>
        </Link>
      </div>

      <div className="card">
        <h2 className="font-semibold text-lg mb-4">
          Open Positions
        </h2>

        {!positionItems.length ? (
          <p className="text-sm text-gray-400">
            No open positions.
          </p>
        ) : (
          <div className="space-y-3">
            {positionItems.map(([ticker, marketValue]) => (
              <div
                key={ticker}
                className="flex items-center justify-between border-b last:border-b-0 pb-3 last:pb-0"
              >
                <div>
                  <p className="font-medium">{ticker}</p>
                  <p className="text-xs text-gray-500">
                    Market value
                  </p>
                </div>

                <p className="font-medium">
                  ${Number(marketValue).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">
            Recent Orders
          </h2>

          <Link
            href="/executions"
            className="text-sm text-blue-600 hover:underline"
          >
            View all
          </Link>
        </div>

        {!recentOrders.length ? (
          <p className="text-sm text-gray-400">
            No orders yet.
          </p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between border-b last:border-b-0 pb-3 last:pb-0"
              >
                <div>
                  <p className="font-medium">
                    {order.action} {order.ticker}
                  </p>

                  <p className="text-xs text-gray-500">
                    {new Date(order.submitted_at).toLocaleString()}
                  </p>
                </div>

                <div className="text-right">
                <p className="font-medium">
                  {order.notional_usd
                    ? Number(order.notional_usd).toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "-"}
                </p>

                <StatusBadge status={order.status} />
              </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
