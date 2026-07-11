"use client"

import Link from "next/link"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import { api } from "@/lib/api"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [status, setStatus] = useState<
    "loading" | "success" | "error"
  >("loading")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      return
    }

    api.auth
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"))
  }, [token])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="card w-full max-w-sm space-y-4 text-center">
          <p className="text-sm font-medium text-green-700">
            Verification successful
          </p>

          <h1 className="text-2xl font-semibold">Email verified</h1>

          <p className="text-sm text-gray-500">
            Your account is active. You can now sign in.
          </p>

          <Link href="/login" className="btn-primary inline-block">
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="card w-full max-w-sm space-y-4 text-center">
        <p className="text-sm font-medium text-red-700">
          Verification failed
        </p>

        <h1 className="text-2xl font-semibold">
          The verification link is invalid
        </h1>

        <p className="text-sm text-gray-500">
          The link may have already been used or may no longer be valid.
        </p>

        <Link href="/register" className="text-sm text-blue-600 hover:underline">
          Create a new account
        </Link>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400">
          Verifying email...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
