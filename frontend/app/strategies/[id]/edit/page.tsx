"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

import { api } from "@/lib/api"
import StrategyForm, {
  StrategyFormValues,
} from "../../components/StrategyForm"

export default function EditStrategyPage() {
  const params = useParams()
  const router = useRouter()

  const id = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [initialValues, setInitialValues] =
    useState<StrategyFormValues | null>(null)

  useEffect(() => {
    async function load() {
      const strategy = await api.strategies.get(id)

      setInitialValues({
        name: strategy.name,
        description: strategy.description ?? "",
        risk_profile: strategy.risk_profile,
        qc_project_id: strategy.qc_project_id ?? "",
      })

      setLoading(false)
    }

    load()
  }, [id])

  async function updateStrategy(values: StrategyFormValues) {
    await api.strategies.update(id, {
      name: values.name,
      description: values.description,
      risk_profile: values.risk_profile,
      qc_project_id: values.qc_project_id || null,
    })

    router.push("/strategies")
  }

  if (loading || !initialValues) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        Loading...
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Link href="/strategies" className="text-sm text-gray-500">
          ← Back to strategies
        </Link>

        <h1 className="mt-4 text-2xl font-bold">
          Edit strategy
        </h1>
      </div>

      <StrategyForm
        initialValues={initialValues}
        submitLabel="Save changes"
        onSubmit={updateStrategy}
      />
    </main>
  )
}
