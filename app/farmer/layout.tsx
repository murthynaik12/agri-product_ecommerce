"use client"

import type React from "react"

import { useContext, useEffect } from "react"
import { AuthContext } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default function FarmerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = useContext(AuthContext)
  const router = useRouter()

  useEffect(() => {
    if (!auth?.isLoading && (!auth?.user || auth.user.role !== "farmer")) {
      router.push("/login")
    }
  }, [auth?.user, auth?.isLoading, router])

  if (auth?.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!auth?.user || auth.user.role !== "farmer") {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar role="farmer" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={auth.user} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
