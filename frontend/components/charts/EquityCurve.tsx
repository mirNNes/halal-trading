"use client"
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { EquityPoint } from "@/lib/parseBacktestCharts"

export function EquityCurve({ data }: { data: EquityPoint[] }) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Portfolio vs Benchmark</h2>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
          <YAxis
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
          <Legend />
          <Line type="monotone" dataKey="strategy" stroke="#2563eb" dot={false} strokeWidth={2} name="Halal Strategy" />
          <Line type="monotone" dataKey="benchmark" stroke="#9ca3af" dot={false} strokeWidth={1.5} strokeDasharray="4 4" name="SPY" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
