import Link from "next/link"
import { BacktestTable } from "@/components/BacktestTable"

async function getBacktests() {
  // In production this would use cookies/session for SSR auth
  // For now returns empty — client-side fetch via BacktestTable
  return []
}

export default function BacktestsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Backtests</h1>
        <Link href="/backtests/new" className="btn-primary">Run Backtest</Link>
      </div>
      <BacktestTable />
    </div>
  )
}
