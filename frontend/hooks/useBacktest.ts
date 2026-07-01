"use client"
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

export function useBacktest(id: number) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>

    async function fetch() {
      const run = await api.backtests.get(id)
      setData(run)
      setLoading(false)

      if (run.status === "completed" || run.status === "failed") {
        clearInterval(interval)
      }
    }

    fetch()
    interval = setInterval(fetch, 5000)
    return () => clearInterval(interval)
  }, [id])

  return { data, loading }
}
