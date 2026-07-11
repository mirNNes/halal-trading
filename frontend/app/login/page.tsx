"use client"

import Link from "next/link"
import { FormEvent, Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { useAuth } from "@/context/AuthContext"

function LoginContent() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const next = searchParams.get("next") || "/dashboard"

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") || "")
    const password = String(form.get("password") || "")

    try {
      await login(email, password)

      const accessToken = localStorage.getItem("access_token")

      if (accessToken) {
        document.cookie = [
          `access_token=${accessToken}`,
          "path=/",
          `max-age=${60 * 60 * 24 * 7}`,
          "SameSite=Lax",
        ].join("; ")
      }

      router.push(next)
    } catch (err: any) {
      setError(
        err.status === 401
          ? "Incorrect email or password."
          : "Could not sign in. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to continue to Halal Trading.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm text-gray-600"
            >
              Email
            </label>

            <input
              id="email"
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
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="password" className="text-sm text-gray-600">
                Password
              </label>

              <Link
                href="/forgot-password"
                className="text-xs text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
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
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          No account?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400">
          Loading sign in...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
