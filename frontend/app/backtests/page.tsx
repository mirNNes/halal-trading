import Link from "next/link"
import { BacktestTable } from "@/components/BacktestTable"

export default function BacktestsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Backtests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Run historical simulations and review strategy performance.
          </p>
        </div>

        <Link href="/backtests/new" className="btn-primary">
          Run Backtest
        </Link>
      </div>

      <BacktestTable />
    </div>
  )
}
