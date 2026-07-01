"use client"
import useSWR from "swr"
import { api } from "@/lib/api"

export function QuotaIndicator() {
  const { data } = useSWR("quota", () => api.backtests.quota())
  if (!data) return null

  const { used, limit, isUnlimited } = data

  if (isUnlimited) {
    return <p className="text-xs text-gray-400">Unlimited backtests (Pro)</p>
  }

  const pct = Math.min(100, (used / limit) * 100)
  const atLimit = used >= limit

  return (
    <div className="text-xs text-gray-500 space-y-1">
      <div className="flex justify-between">
        <span>{used} of {limit} backtests used this month</span>
        {atLimit && <a href="/pricing" className="text-blue-600 hover:underline">Upgrade</a>}
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full">
        <div
          className={`h-1.5 rounded-full transition-all ${atLimit ? "bg-red-500" : "bg-blue-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
