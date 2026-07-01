"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { formatPercent, formatDate } from "@/lib/format"
import { StatusBadge } from "./StatusBadge"

export function BacktestTable() {
  const [runs, setRuns] = useState<any[]>([])

  useEffect(() => {
    api.backtests.list().then(setRuns).catch(console.error)
  }, [])

  if (!runs.length) {
    return <p className="text-gray-400 text-sm">No backtests yet. <Link href="/backtests/new" className="text-blue-600">Run your first one.</Link></p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 border-b text-xs uppercase tracking-wide">
            <th className="pb-3">Strategy</th>
            <th className="pb-3">Period</th>
            <th className="pb-3">Return</th>
            <th className="pb-3">Sharpe</th>
            <th className="pb-3">Drawdown</th>
            <th className="pb-3">Status</th>
            <th className="pb-3"></th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} className="border-b hover:bg-gray-50">
              <td className="py-3 font-medium">{run.strategy_name ?? `Strategy ${run.strategy_id}`}</td>
              <td className="text-gray-500">{run.start_date} → {run.end_date}</td>
              <td className={run.total_return >= 0 ? "text-green-600" : "text-red-600"}>
                {run.total_return != null ? formatPercent(run.total_return) : "—"}
              </td>
              <td>{run.sharpe_ratio != null ? Number(run.sharpe_ratio).toFixed(2) : "—"}</td>
              <td className="text-red-600">{run.max_drawdown != null ? formatPercent(run.max_drawdown) : "—"}</td>
              <td><StatusBadge status={run.status} /></td>
              <td>
                {run.status === "completed" && (
                  <Link href={`/backtests/${run.id}`} className="text-blue-600 hover:underline text-xs">View →</Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
