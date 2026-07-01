export type SignalAction = "BUY" | "SELL" | "HOLD" | "WATCH"

export interface TradingSignal {
  id: number
  strategy_id: number
  strategy_name: string
  strategy_risk_profile: "low" | "medium" | "high"
  ticker: string
  action: SignalAction
  reason: string | null
  emitted_at: string
}
