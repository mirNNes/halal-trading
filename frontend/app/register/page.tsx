"use client"
import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

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
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      setLoading(false)
      return
    }

    try {
      await api.auth.register(form.get("email") as string, password)
      setDone(true)
    } catch (err: any) {
      setError(err.data?.detail || "Something went wrong.")
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">📬</div>
          <h2 className="text-xl font-semibold">Check your email</h2>
          <p className="text-sm text-gray-500">
            We sent a verification link. Click it to activate your account, then sign in.
          </p>
          <Link href="/login" className="btn-primary inline-block">Go to login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-sm text-gray-500 mt-1">Start with 3 free backtests/month</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input type="email" name="email" autoComplete="email" required className="input" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <input type="password" name="password" autoComplete="new-password" required minLength={8} className="input" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Confirm Password</label>
            <input type="password" name="confirm" autoComplete="new-password" required className="input" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
