"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

export function StrategySelect({ name }: { name: string }) {
  const [strategies, setStrategies] = useState<any[]>([])

  useEffect(() => {
    api.strategies.list()
      .then(setStrategies)
      .catch(console.error)
  }, [])

  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">Strategy</label>
      <select name={name} className="input" required>
        {strategies.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
        {!strategies.length && <option value="1">Loading strategies...</option>}
      </select>
    </div>
  )
}
