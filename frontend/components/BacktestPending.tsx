export function BacktestPending({ status }: { status: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-96 gap-4 text-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-600 font-medium">
        {status === "pending" ? "Queued — starting shortly..." : "Running backtest..."}
      </p>
      <p className="text-sm text-gray-400">This page will update automatically. Typically 1–5 minutes.</p>
    </div>
  )
}
