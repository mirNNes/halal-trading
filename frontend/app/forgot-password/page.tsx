"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"

import { api } from "@/lib/api"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") || "")

    try {
      await api.auth.forgotPassword(email)
    } finally {
      // Always show the same response to prevent email enumeration.
      setDone(true)
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="card w-full max-w-sm space-y-4 text-center">
          <p className="text-sm font-medium text-green-700">
            Request received
          </p>

          <h1 className="text-2xl font-semibold">Check your email</h1>

          <p className="text-sm text-gray-500">
            If the address is registered, you will receive a password reset
            link shortly.
          </p>

          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reset password</h1>

          <p className="mt-1 text-sm text-gray-500">
            Enter your email and we will send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label
              htmlFor="reset-email"
              className="mb-1 block text-sm text-gray-600"
            >
              Email
            </label>

            <input
              id="reset-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              disabled={loading}
              className="input disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="text-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
