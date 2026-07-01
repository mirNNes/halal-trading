export function createSignalSocket(token: string, onSignal: (signal: any) => void): () => void {
  const wsBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/^http/, "ws")
  const ws = new WebSocket(`${wsBase}/ws/signals?token=${token}`)

  ws.onmessage = (e) => {
    try {
      onSignal(JSON.parse(e.data))
    } catch {}
  }

  ws.onerror = () => ws.close()

  return () => ws.close()
}
