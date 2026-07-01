"use client"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import type { DrawdownPoint } from "@/lib/parseBacktestCharts"

export function DrawdownChart({ data }: { data: DrawdownPoint[] }) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Drawdown</h2>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
          <YAxis
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
          <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="#fee2e2" strokeWidth={1.5} name="Drawdown" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
