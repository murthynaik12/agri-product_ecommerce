"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { loginUser } from "@/app/actions/loginUser"

type Role = "admin" | "farmer" | "customer" | "delivery" | null

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedRole, setSelectedRole] = useState<Role>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const registered = searchParams.get("registered")
    const emailParam = searchParams.get("email")
    if (registered && emailParam) {
      setSuccess(true)
      setEmail(decodeURIComponent(emailParam))
    }
  }, [searchParams])

  const handleRoleSelect = (role: "admin" | "farmer" | "customer" | "delivery") => {
    setSelectedRole(role)
    setError("")
    setEmail("")
    setPassword("")
  }

  const handleBackToRoleSelection = () => {
    setSelectedRole(null)
    setError("")
    setEmail("")
    setPassword("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email || !password) {
      setError("Please enter both email and password")
      setIsLoading(false)
      return
    }

    if (!selectedRole) {
      setError("Please select a role first")
      setIsLoading(false)
      return
    }

    try {
      const result = await loginUser(email, password, selectedRole)

      if (result.success && result.role && result.user && result.token) {
        // Verify role matches
        if (result.role !== selectedRole) {
          setError(`This account is registered as ${result.role}, not ${selectedRole}. Please select the correct role.`)
          setIsLoading(false)
          return
        }

        const userObj = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          phone: result.user.phone,
          createdAt: new Date().toISOString(),
        }

        localStorage.setItem("currentUser", JSON.stringify(userObj))
        localStorage.setItem("authToken", result.token)
        console.log("User stored in localStorage:", userObj)

        // Trigger storage event for other tabs/windows
        window.dispatchEvent(new Event("storage"))

        // Redirect based on role
        const dashboardPath =
          result.role === "admin"
            ? "/admin/dashboard"
            : result.role === "farmer"
              ? "/farmer/dashboard"
              : result.role === "delivery"
                ? "/delivery/dashboard"
                : "/customer/dashboard"

        window.location.href = dashboardPath
      } else {
        setError(result.message || "Login failed")
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Login page error:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  // Role Selection Screen
  if (!selectedRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-100">
        <Card className="w-full max-w-2xl p-8 bg-white shadow-lg rounded-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to AgriTrade</h1>
            <p className="text-gray-600">Choose Your Role to Continue</p>
          </div>

          {success && (
            <div className="mb-6 text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-3 font-medium text-center">
              Account created successfully! Please log in with your credentials.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleRoleSelect("admin")}
              className="p-6 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 rounded-xl transition-all hover:shadow-lg text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-900">Admin Login</h3>
                <svg
                  className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">Access admin dashboard and manage the platform</p>
            </button>

            <button
              onClick={() => handleRoleSelect("farmer")}
              className="p-6 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl transition-all hover:shadow-lg text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-900">Farmer Login</h3>
                <svg
                  className="w-6 h-6 text-green-400 group-hover:text-green-600 transition"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">Manage your products and track orders</p>
            </button>

            <button
              onClick={() => handleRoleSelect("customer")}
              className="p-6 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl transition-all hover:shadow-lg text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-900">Customer Login</h3>
                <svg
                  className="w-6 h-6 text-blue-400 group-hover:text-blue-600 transition"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">Browse products and place orders</p>
            </button>

            <button
              onClick={() => handleRoleSelect("delivery")}
              className="p-6 bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 rounded-xl transition-all hover:shadow-lg text-left group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-900">Delivery Agent Login</h3>
                <svg
                  className="w-6 h-6 text-orange-400 group-hover:text-orange-600 transition"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">Manage deliveries and track orders</p>
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <a href="/register" className="text-green-600 hover:text-green-700 font-semibold hover:underline">
              Register here
            </a>
          </p>
        </Card>
      </div>
    )
  }

  // Login Form Screen
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-100">
      <Card className="w-full max-w-md p-8 bg-white shadow-lg rounded-2xl">
        <div className="text-center mb-8">
          <button
            onClick={handleBackToRoleSelection}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Role Selection
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedRole === "admin"
              ? "Admin Login"
              : selectedRole === "farmer"
                ? "Farmer Login"
                : selectedRole === "customer"
                  ? "Customer Login"
                  : "Delivery Agent Login"}
          </h2>
          <p className="text-gray-600">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
              required
              placeholder="Enter your registered email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={isLoading}
              required
              placeholder="Enter your password"
            />
          </div>

          {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <a href="/register" className="text-green-600 hover:text-green-700 font-semibold hover:underline">
            Register here
          </a>
        </p>
      </Card>
    </div>
  )
}
