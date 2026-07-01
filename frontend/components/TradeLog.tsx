import type { Order } from "@/types"
import { formatCurrency } from "@/lib/format"

export function TradeLog({ orders }: { orders: Order[] }) {
  if (!orders.length) return null

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Trade Log</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b">
              <th className="pb-2">Time</th>
              <th className="pb-2">Symbol</th>
              <th className="pb-2">Direction</th>
              <th className="pb-2">Qty</th>
              <th className="pb-2">Price</th>
              <th className="pb-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2 text-gray-500">{new Date(order.time).toLocaleDateString()}</td>
                <td className="font-medium">{order.symbol}</td>
                <td className={order.direction === "Buy" ? "text-green-600" : "text-red-600"}>
                  {order.direction}
                </td>
                <td>{order.quantity}</td>
                <td>{formatCurrency(order.price)}</td>
                <td className="text-gray-500 max-w-xs truncate">{order.tag}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
