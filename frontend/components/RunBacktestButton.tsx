import Link from "next/link"

export function RunBacktestButton() {
  return <Link href="/backtests/new" className="btn-primary">Run Backtest</Link>
}
