"use client"

import Link from "next/link"
import { useState } from "react"

export type StrategyFormValues = {
  name: string
  description: string
  risk_profile: string
  qc_project_id: string
}

type Props = {
  initialValues?: StrategyFormValues
  submitLabel: string
  onSubmit: (values: StrategyFormValues) => Promise<void>
}

export default function StrategyForm({
  initialValues,
  submitLabel,
  onSubmit,
}: Props) {
  const [name, setName] = useState(initialValues?.name ?? "")
  const [description, setDescription] = useState(initialValues?.description ?? "")
  const [riskProfile, setRiskProfile] = useState(initialValues?.risk_profile ?? "medium")
  const [qcProjectId, setQcProjectId] = useState(initialValues?.qc_project_id ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      setSaving(true)
      setError("")

      await onSubmit({
        name,
        description,
        risk_profile: riskProfile,
        qc_project_id: qcProjectId,
      })
    } catch (err: any) {
      setError(err.message || "Could not save strategy")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded border p-6">
      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <input
          className="w-full rounded border px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Halal Momentum Strategy"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          className="w-full rounded border px-3 py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Short description of what this strategy does"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Risk profile</label>
        <select
          className="w-full rounded border px-3 py-2"
          value={riskProfile}
          onChange={(e) => setRiskProfile(e.target.value)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          QuantConnect project ID
        </label>
        <input
          className="w-full rounded border px-3 py-2"
          value={qcProjectId}
          onChange={(e) => setQcProjectId(e.target.value)}
          placeholder="Optional. Leave empty for local fallback."
        />
        <p className="mt-1 text-xs text-gray-500">
          Leave empty while developing locally without QuantConnect API access.
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <Link href="/strategies" className="rounded border px-4 py-2 text-sm">
          Cancel
        </Link>

        <button
          type="submit"
          disabled={saving}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  )
}
