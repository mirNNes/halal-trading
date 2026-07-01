"use client"
import { useBacktest } from "@/hooks/useBacktest"
import { StatsGrid } from "@/components/StatsGrid"
import { BacktestPending } from "@/components/BacktestPending"
import { TradeLog } from "@/components/TradeLog"
import { EquityCurve } from "@/components/charts/EquityCurve"
import { DrawdownChart } from "@/components/charts/DrawdownChart"
import { parseEquityCurve, parseDrawdown } from "@/lib/parseBacktestCharts"
import { formatDate } from "@/lib/format"

export default function BacktestDetailPage({ params }: { params: { id: string } }) {
  const { data: run, loading } = useBacktest(Number(params.id))

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>
  if (!run) return <div className="p-6 text-red-500">Backtest not found</div>

  if (run.status !== "completed") {
    return <BacktestPending status={run.status} />
  }

  const equityData = parseEquityCurve(run.result_json)
  const drawdownData = parseDrawdown(run.result_json)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{run.strategy_name ?? "Backtest"}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {formatDate(run.start_date)} → {formatDate(run.end_date)} · ${run.starting_cash.toLocaleString()} starting capital
        </p>
      </div>
      <StatsGrid run={run} />
      <EquityCurve data={equityData} />
      <DrawdownChart data={drawdownData} />
      <TradeLog orders={run.result_json?.orders ?? []} />
    </div>
  )
}
