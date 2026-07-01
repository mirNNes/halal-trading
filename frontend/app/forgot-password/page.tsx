"use client"
import { useState, FormEvent } from "react"
import Link from "next/link"
import { api } from "@/lib/api"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)
    try {
      await api.auth.forgotPassword(form.get("email") as string)
      setDone(true)
    } catch {
      // Always show success to avoid email enumeration
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="text-4xl">📧</div>
          <h2 className="text-xl font-semibold">Check your email</h2>
          <p className="text-sm text-gray-500">
            If that address is registered, you will receive a reset link shortly.
          </p>
          <Link href="/login" className="text-blue-600 text-sm hover:underline">Back to login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reset password</h1>
          <p className="text-sm text-gray-500 mt-1">We will send a reset link to your email.</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input type="email" name="email" required className="input" placeholder="you@example.com" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="text-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  )
}
