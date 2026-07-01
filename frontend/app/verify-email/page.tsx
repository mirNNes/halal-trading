"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center space-y-4">
          <div className="text-4xl">✓</div>
          <h2 className="text-xl font-semibold">Email verified</h2>
          <p className="text-sm text-gray-500">Your account is active.</p>
          <Link href="/login" className="btn-primary inline-block">
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-red-600">Verification failed</h2>
        <p className="text-sm text-gray-500">This link is invalid or has expired.</p>
        <Link href="/register" className="text-blue-600 text-sm hover:underline">
          Register again
        </Link>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
