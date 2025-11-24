"use client"

import { createContext, useContext, type ReactNode, useState, useEffect } from "react"
import type { User } from "@/lib/types"

export interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    const storedToken = localStorage.getItem("authToken")
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
        setToken(storedToken)
      } catch {
        localStorage.removeItem("currentUser")
        localStorage.removeItem("authToken")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        setIsLoading(false)
        return { success: false, message: error.error || "Login failed" }
      }

      const data = await response.json()

      const userObj: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        phone: data.user.phone,
        createdAt: new Date().toISOString(),
      }

      setUser(userObj)
      setToken(data.token)
      localStorage.setItem("currentUser", JSON.stringify(userObj))
      localStorage.setItem("authToken", data.token)
      setIsLoading(false)
      return { success: true, message: "Login successful" }
    } catch (error) {
      console.error("Login error:", error)
      setIsLoading(false)
      return { success: false, message: "Login failed. Please try again." }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("currentUser")
    localStorage.removeItem("authToken")
  }

  return <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
