"use client"

import Link from "next/link"
import { FormEvent, Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { api } from "@/lib/api"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(event.currentTarget)
    const password = String(form.get("password") || "")
    const confirmPassword = String(form.get("confirm") || "")

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      setLoading(false)
      return
    }

    try {
      await api.auth.resetPassword(token, password)
      router.push("/login?reset=true")
    } catch (err: any) {
      setError(
        err.data?.detail ||
          err.message ||
          "The reset link is invalid or has expired."
      )
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="card w-full max-w-sm space-y-4 text-center">
          <p className="text-sm font-medium text-red-700">
            Invalid reset link
          </p>

          <h1 className="text-2xl font-semibold">
            Request a new password reset
          </h1>

          <p className="text-sm text-gray-500">
            This reset link is missing the required token.
          </p>

          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:underline"
          >
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Set a new password</h1>

          <p className="mt-1 text-sm text-gray-500">
            Choose a new password for your Halal Trading account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label
              htmlFor="new-password"
              className="mb-1 block text-sm text-gray-600"
            >
              New password
            </label>

            <input
              id="new-password"
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={loading}
              className="input disabled:cursor-not-allowed disabled:opacity-60"
            />

            <p className="mt-1 text-xs text-gray-400">
              Use at least 8 characters.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirm-new-password"
              className="mb-1 block text-sm text-gray-600"
            >
              Confirm password
            </label>

            <input
              id="confirm-new-password"
              type="password"
              name="confirm"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={loading}
              className="input disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving..." : "Set new password"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400">
          Loading password reset...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
