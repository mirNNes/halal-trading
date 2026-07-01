export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${(value * 100).toFixed(2)}%`
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
