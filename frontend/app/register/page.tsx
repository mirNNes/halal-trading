"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

import { api } from "@/lib/api"

export default function RegisterPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") || "")
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
      await api.auth.register(email, password)
      setDone(true)
    } catch (err: any) {
      setError(
        err.data?.detail ||
          err.message ||
          "Could not create the account. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="card w-full max-w-sm space-y-4 text-center">
          <p className="text-sm font-medium text-green-700">
            Registration successful
          </p>

          <h1 className="text-2xl font-semibold">Check your email</h1>

          <p className="text-sm text-gray-500">
            We sent you a verification link. Open it to activate your account,
            then return to sign in.
          </p>

          <Link href="/login" className="btn-primary inline-block">
            Go to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Start with three free backtests per month.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label
              htmlFor="register-email"
              className="mb-1 block text-sm text-gray-600"
            >
              Email
            </label>

            <input
              id="register-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              disabled={loading}
              className="input disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="mb-1 block text-sm text-gray-600"
            >
              Password
            </label>

            <input
              id="register-password"
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
              htmlFor="register-confirm"
              className="mb-1 block text-sm text-gray-600"
            >
              Confirm password
            </label>

            <input
              id="register-confirm"
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
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
