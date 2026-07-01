import { Strategy } from "@/types/strategy"
import { TradingSignal } from "@/types/signal"
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("access_token")
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error(err.detail || res.statusText), { status: res.status, data: err })
  }
  return res.json()
}

export const api = {
  auth: {
    register: (email: string, password: string) =>
      apiFetch<{ message: string }>("/api/users/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    login: (email: string, password: string) =>
      apiFetch<{ access_token: string }>("/api/users/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: () => apiFetch<{ id: number; email: string; emailVerified: boolean }>("/api/users/me"),
    verifyEmail: (token: string) =>
      apiFetch<{ message: string }>(`/api/users/verify-email?token=${token}`),
    forgotPassword: (email: string) =>
      apiFetch<{ message: string }>("/api/users/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    resetPassword: (token: string, password: string) =>
      apiFetch<{ message: string }>("/api/users/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      }),
  },
  backtests: {
    list: () => apiFetch<any[]>("/api/backtests"),
    get: (id: number) => apiFetch<any>(`/api/backtests/${id}`),
    create: (body: { strategyId: number; startDate: string; endDate: string; startingCash: number }) =>
      apiFetch<{ backtest_id: number; status: string }>("/api/backtests", {
        method: "POST",
        body: JSON.stringify({
          strategy_id: body.strategyId,
          start_date: body.startDate,
          end_date: body.endDate,
          starting_cash: body.startingCash,
        }),
      }),
    quota: () => apiFetch<any>("/api/backtests/quota"),
  },
  strategies: {
    list: () => apiFetch<Strategy[]>("/api/strategies"),

    get: (id: number) =>
      apiFetch<Strategy>(`/api/strategies/${id}`),

    create: (body: {
      name: string
      description?: string
      risk_profile: string
      qc_project_id?: string
    }) =>
      apiFetch<Strategy>("/api/strategies", {
        method: "POST",
        body: JSON.stringify(body),
      }),

    update: (id: number, body: any) =>
      apiFetch<Strategy>(`/api/strategies/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),

    toggleActive: (id: number) =>
      apiFetch<Strategy>(`/api/strategies/${id}/toggle-active`, {
        method: "PATCH",
      }),

    delete: (id: number) =>
      apiFetch<any>(`/api/strategies/${id}`, {
        method: "DELETE",
      }),
  },
  signals: {
    list: (strategyId?: number) =>
      apiFetch<TradingSignal[]>(`/api/signals${strategyId ? `?strategy_id=${strategyId}` : ""}`),
  },

    executions: {
    list: () => apiFetch<any[]>("/api/executions"),
  },
  stripe: {
    checkout: (tier: string) =>
      apiFetch<{ checkout_url: string }>("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ tier }),
      }),
    portal: () =>
      apiFetch<{ portal_url: string }>("/api/stripe/portal", { method: "POST" }),
    subscription: () =>
      apiFetch<{
        tier: string
        status: string
        liveSignalsEnabled: boolean
        backtestQuota: number
        validUntil: string | null
      }>("/api/stripe/subscription"),
  },
  brokers: {
    list: () => apiFetch<any[]>("/api/brokers"),
    account: () => apiFetch<any>("/api/brokers/account"),
    positions: () => apiFetch<any>("/api/brokers/positions"),
    connect: (body: {
      broker: string
      api_key: string
      api_secret: string
      paper: boolean
      allocation_usd: number
      execution_mode: string
    }) =>
      apiFetch<any>("/api/brokers", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    
    testConnection: (body: {
      broker: string
      api_key: string
      api_secret: string
      paper: boolean
    }) =>
      apiFetch<any>("/api/brokers/test-connection", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: number, body: { auto_execute?: boolean; allocation_usd?: number; execution_mode?: string }) =>
      apiFetch<any>(`/api/brokers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    disconnect: (id: number) =>
      apiFetch<any>(`/api/brokers/${id}`, { method: "DELETE" }),
  },
}
