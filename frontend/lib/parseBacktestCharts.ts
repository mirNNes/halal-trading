import type { BacktestResultJson } from "@/types"

export interface EquityPoint {
  date: string
  strategy: number
  benchmark: number | null
}

export interface DrawdownPoint {
  date: string
  drawdown: number
}

export function parseEquityCurve(result: BacktestResultJson | null | undefined): EquityPoint[] {
  if (!result) return []

  if ((result as any).source === "local_mock") {
    const starting = Number((result as any).starting_cash ?? 100000)
    const final = Number((result as any).final_equity ?? starting)
    return [
      { date: "Start", strategy: starting, benchmark: starting },
      { date: "End", strategy: final, benchmark: Math.round(starting * 1.05) },
    ]
  }

  const equityValues = (result as any).charts?.["Strategy Equity"]?.series?.Equity?.values ?? {}
  const benchmarkValues = (result as any).charts?.["Strategy Equity"]?.series?.Benchmark?.values ?? {}

  return Object.entries(equityValues).map(([ts, value]) => ({
    date: new Date(Number(ts) * 1000).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    strategy: Number(value),
    benchmark: benchmarkValues[ts] != null ? Number(benchmarkValues[ts]) : null,
  }))
}

export function parseDrawdown(result: BacktestResultJson | null | undefined): DrawdownPoint[] {
  if (!result) return []

  if ((result as any).source === "local_mock") {
    return [
      { date: "Start", drawdown: 0 },
      { date: "Mid", drawdown: -8 },
      { date: "End", drawdown: -3 },
    ]
  }

  const values = (result as any).charts?.["Drawdown"]?.series?.["Equity Drawdown"]?.values ?? {}

  return Object.entries(values).map(([ts, value]) => ({
    date: new Date(Number(ts) * 1000).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    drawdown: Number(value) * 100,
  }))
}
