const styles: Record<string, string> = {
  // Backtests
  pending: "bg-yellow-100 text-yellow-700",
  running: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",

  // Orders
  new: "bg-blue-100 text-blue-700",
  accepted: "bg-indigo-100 text-indigo-700",
  filled: "bg-green-100 text-green-700",
  partially_filled: "bg-yellow-100 text-yellow-700",
  canceled: "bg-gray-100 text-gray-700",
  cancelled: "bg-gray-100 text-gray-700",
  rejected: "bg-red-100 text-red-700",
  error: "bg-red-100 text-red-700",

  active: "bg-green-100 text-green-700",
  connected: "bg-green-100 text-green-700",
  disconnected: "bg-red-100 text-red-700",

  halal: "bg-green-100 text-green-700",
  haram: "bg-red-100 text-red-700",
  doubtful: "bg-yellow-100 text-yellow-700",
  blocked: "bg-orange-100 text-orange-700",
}

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ")

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
        styles[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {label}
    </span>
  )
}
