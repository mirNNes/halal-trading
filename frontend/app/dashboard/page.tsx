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
  const [signals, setSignals] = useState<any[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    const [
      brokerData,
      orderData,
      accountData,
      positionData,
      strategyData,
      signalData,
    ] = await Promise.all([
      api.brokers.list().catch(() => []),
      api.executions.list().catch(() => []),
      api.brokers.account().catch(() => null),
      api.brokers.positions().catch(() => null),
      api.strategies.list().catch(() => []),
      api.signals.list().catch(() => []),
    ])

    setBrokers(brokerData)
    setOrders(orderData)
    setAccount(accountData)
    setPositions(positionData)
    setStrategies(strategyData)
    setSignals(signalData)
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
  const latestSignal = signals[0]
  const accountInfo = account?.account

  const positionItems = positions?.positions
    ? Object.entries(positions.positions)
    : []

  const activeStrategies = strategies.filter((s) => s.is_active).length
  const openPositionsCount = positionItems.length

  const brokerName = activeBroker?.broker || "Alpaca"
  const brokerMode = activeBroker?.paper ? "Paper Trading" : "Live Trading"

  if (loading) {
    return <div className="p-6 text-gray-400">Loading...</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Welcome back</p>
          <h1 className="text-2xl font-semibold">Halal Trading Dashboard</h1>
        </div>

        {lastUpdated && (
          <p className="text-sm text-gray-500">
            Last updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="card bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold">Halal Trading Platform</h2>

            <p className="mt-2 text-emerald-100">
              Broker connected and compliance engine active.
            </p>

            <div className="flex gap-6 mt-4 text-sm flex-wrap">
              <div>
                <p className="text-emerald-100">Broker</p>
                <p className="font-semibold">
                  {activeBroker
                    ? `${brokerName} ${brokerMode}`
                    : "Not connected"}
                </p>
              </div>

              <div>
                <p className="text-emerald-100">Compliance</p>
                <p className="font-semibold">Active</p>
              </div>

              <div>
                <p className="text-emerald-100">Strategies</p>
                <p className="font-semibold">{activeStrategies} Active</p>
              </div>

              <div>
                <p className="text-emerald-100">Positions</p>
                <p className="font-semibold">{openPositionsCount} Open</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link
              href="/market-data"
              className="bg-white text-emerald-700 px-4 py-2 rounded font-medium hover:bg-gray-100"
            >
              Market Data
            </Link>

            <Link
              href="/signals"
              className="border border-white px-4 py-2 rounded hover:bg-white/10"
            >
              Signals
            </Link>

            <Link
              href="/compliance"
              className="border border-white px-4 py-2 rounded hover:bg-white/10"
            >
              Compliance
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card border-t-4 border-emerald-500">
          <p className="text-sm text-gray-500">Portfolio Value</p>
          <p className="text-xl font-semibold mt-1">
            {accountInfo
              ? `$${Number(accountInfo.portfolio_value).toLocaleString()}`
              : "Waiting for broker data"}
          </p>
        </div>

        <div className="card border-t-4 border-blue-500">
          <p className="text-sm text-gray-500">Cash</p>
          <p className="text-xl font-semibold mt-1">
            {accountInfo
              ? `$${Number(accountInfo.cash).toLocaleString()}`
              : "Waiting for broker data"}
          </p>
        </div>

        <div className="card border-t-4 border-violet-500">
          <p className="text-sm text-gray-500">Open Positions</p>
          <p className="text-xl font-semibold mt-1">{openPositionsCount}</p>
        </div>

        <div className="card border-t-4 border-amber-500">
          <p className="text-sm text-gray-500">Active Strategies</p>
          <p className="text-xl font-semibold mt-1">{activeStrategies}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold text-lg">Broker</h2>

          <div className="mt-3 space-y-2">
            <p className="text-sm text-gray-500">
              {activeBroker
                ? `${brokerName} ${brokerMode}`
                : "No broker connected"}
            </p>

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

        <div className="card">
          <h2 className="font-semibold text-lg">Latest Signal</h2>

          {latestSignal ? (
            <div className="mt-3">
              <p className="font-medium">
                {latestSignal.action} {latestSignal.ticker}
              </p>
              <p className="text-sm text-gray-500">
                {latestSignal.strategy_name}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mt-3">No signals yet.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-lg mb-4">Open Positions</h2>

        {!positionItems.length ? (
          <p className="text-sm text-gray-400">No open positions.</p>
        ) : (
          <div className="space-y-3">
            {positionItems.map(([ticker, marketValue]) => (
              <div
                key={ticker}
                className="flex items-center justify-between border-b last:border-b-0 pb-3 last:pb-0"
              >
                <div>
                  <p className="font-medium">{ticker}</p>
                  <p className="text-xs text-gray-500">Market value</p>
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
          <h2 className="font-semibold text-lg">Recent Orders</h2>

          <Link
            href="/executions"
            className="text-sm text-blue-600 hover:underline"
          >
            View all
          </Link>
        </div>

        {!recentOrders.length ? (
          <p className="text-sm text-gray-400">No orders yet.</p>
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
