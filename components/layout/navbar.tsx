"use client"

import { useContext } from "react"
import { AuthContext } from "@/context/auth-context"
import { Notifications } from "@/components/notifications"

export function Navbar() {
  const auth = useContext(AuthContext)

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
      </div>
      <div className="flex items-center gap-4">
        <Notifications />
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{auth?.user?.name}</p>
            <p className="text-xs text-gray-500">{auth?.user?.role}</p>
          </div>
        </div>
      </div>
    </nav>
  )
}
