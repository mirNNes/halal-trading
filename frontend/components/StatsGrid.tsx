import { formatPercent } from "@/lib/format"

export function StatsGrid({ run }: { run: any }) {
  const stats = [
    { label: "Total Return",   value: run.total_return != null ? formatPercent(run.total_return) : "—",   green: run.total_return >= 0 },
    { label: "Annual Return",  value: run.annual_return != null ? formatPercent(run.annual_return) : "—",  green: run.annual_return >= 0 },
    { label: "Sharpe Ratio",   value: run.sharpe_ratio != null ? Number(run.sharpe_ratio).toFixed(2) : "—", green: run.sharpe_ratio >= 1 },
    { label: "Max Drawdown",   value: run.max_drawdown != null ? formatPercent(run.max_drawdown) : "—",   green: false },
    { label: "Win Rate",       value: run.win_rate != null ? formatPercent(run.win_rate) : "—",           green: run.win_rate >= 0.5 },
    { label: "Total Trades",   value: run.num_trades != null ? String(run.num_trades) : "—",              green: true },
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
          <p className={`text-2xl font-semibold mt-1 ${s.green ? "text-green-600" : "text-red-600"}`}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}
