"use client"

import { Suspense, useState, FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"

function LoginContent() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/dashboard"

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    try {
      await login(form.get("email") as string, form.get("password") as string)
      document.cookie = `access_token=${localStorage.getItem("access_token")}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      router.push(next)
    } catch (err: any) {
      setError(err.status === 401 ? "Incorrect email or password." : "Something went wrong.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input type="email" name="email" autoComplete="email" required className="input" placeholder="you@example.com" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-gray-600">Password</label>
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <input type="password" name="password" autoComplete="current-password" required className="input" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
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
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
