import Link from "next/link"

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">Halal Trading</h1>
      <p className="max-w-md text-center text-gray-500">
        Algorithmic trading strategies built on a Sharia-compliant universe. Backtest, subscribe, and receive live signals.
      </p>
      <div className="flex gap-4">
        <Link href="/dashboard" className="btn-primary">Get Started</Link>
      </div>
    </main>
  )
}
