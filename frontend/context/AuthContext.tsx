"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { api } from "@/lib/api"

interface AuthUser {
  id: number
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      setLoading(false)
      return
    }
    api.auth.me()
      .then(setUser)
      .catch(() => localStorage.removeItem("access_token"))
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const { access_token } = await api.auth.login(email, password)
    localStorage.setItem("access_token", access_token)
    const me = await api.auth.me()
    setUser(me)
  }

  function logout() {
    localStorage.removeItem("access_token")
    setUser(null)
    window.location.href = "/login"
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
