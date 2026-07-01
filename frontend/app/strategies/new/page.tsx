"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { api } from "@/lib/api"
import StrategyForm, {
  StrategyFormValues,
} from "../components/StrategyForm"

export default function NewStrategyPage() {
  const router = useRouter()

  async function createStrategy(values: StrategyFormValues) {
    await api.strategies.create({
      name: values.name,
      description: values.description || undefined,
      risk_profile: values.risk_profile,
      qc_project_id: values.qc_project_id || undefined,
    })

    router.push("/strategies")
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Link href="/strategies" className="text-sm text-gray-500">
          ← Back to strategies
        </Link>

        <h1 className="mt-4 text-2xl font-bold">
          New strategy
        </h1>

        <p className="text-sm text-gray-500">
          Create a strategy for local backtests or QuantConnect.
        </p>
      </div>

      <StrategyForm
        submitLabel="Create strategy"
        onSubmit={createStrategy}
      />
    </main>
  )
}
