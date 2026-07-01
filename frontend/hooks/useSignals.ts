"use client"
import { useState, useEffect } from "react"
import type { Signal } from "@/types"
import { createSignalSocket } from "@/lib/websocket"

export function useSignals(): Signal[] {
  const [signals, setSignals] = useState<Signal[]>([])

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) return
    return createSignalSocket(token, (signal) => {
      setSignals((prev) => [signal, ...prev].slice(0, 100))
    })
  }, [])

  return signals
}
