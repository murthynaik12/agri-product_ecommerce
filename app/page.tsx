"use client"

import { useContext, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthContext } from "@/context/auth-context"

export default function Home() {
  const auth = useContext(AuthContext)
  const router = useRouter()

  useEffect(() => {
    if (auth?.isLoading === false) {
      if (auth?.user) {
        router.push(`/${auth.user.role}/dashboard`)
      } else {
        router.push("/login")
      }
    }
  }, [auth?.user, auth?.isLoading, router])

  if (auth?.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
