export interface BacktestRun {
  id: number
  strategyId: number
  strategyName: string
  status: "pending" | "running" | "completed" | "failed"
  startDate: string
  endDate: string
  startingCash: number
  totalReturn: number | null
  sharpeRatio: number | null
  maxDrawdown: number | null
  annualReturn: number | null
  winRate: number | null
  numTrades: number | null
  createdAt: string
  completedAt: string | null
  resultJson?: BacktestResultJson
}

export interface BacktestResultJson {
  statistics: Record<string, string>
  charts: {
    "Strategy Equity"?: {
      series: {
        Equity?: { values: Record<string, number> }
        Benchmark?: { values: Record<string, number> }
      }
    }
    Drawdown?: {
      series: {
        "Equity Drawdown"?: { values: Record<string, number> }
      }
    }
  }
  orders?: Order[]
}

export interface Order {
  symbol: string
  direction: "Buy" | "Sell"
  quantity: number
  price: number
  time: string
  tag: string
}

export interface Signal {
  id: number
  strategyId: number
  ticker: string
  action: "BUY" | "SELL" | "HOLD" | "WATCH"
  reason: string
  emittedAt: string
}

export interface Strategy {
  id: number
  name: string
  description: string
  riskProfile: string
  isLive: boolean
}

export interface QuotaInfo {
  used: number
  limit: number
  isUnlimited: boolean
  resetsAt: string
}
