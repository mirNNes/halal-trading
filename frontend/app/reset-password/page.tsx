"use client"

import { Suspense, useState, FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const password = form.get("password") as string
    const confirm = form.get("confirm") as string

    if (password !== confirm) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    try {
      await api.auth.resetPassword(token, password)
      router.push("/login?reset=true")
    } catch (err: any) {
      setError(err.data?.detail || "Reset link is invalid or expired.")
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center space-y-2">
          <p className="text-gray-500">Invalid reset link.</p>
          <Link href="/forgot-password" className="text-blue-600 hover:underline text-sm">
            Request a new one
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Set new password</h1>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">New Password</label>
            <input type="password" name="password" required minLength={8} className="input" autoComplete="new-password" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Confirm Password</label>
            <input type="password" name="confirm" required className="input" autoComplete="new-password" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Saving..." : "Set new password"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
