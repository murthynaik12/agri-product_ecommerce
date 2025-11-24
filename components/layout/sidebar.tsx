"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useContext } from "react"
import { AuthContext } from "@/context/auth-context"
import type { UserRole } from "@/lib/types"

interface SidebarProps {
  role: UserRole
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const auth = useContext(AuthContext)

  const adminMenu = [
    { name: "Dashboard", href: "/admin/dashboard", icon: "📊" },
    { name: "Users", href: "/admin/users", icon: "👥" },
    { name: "Products", href: "/admin/products", icon: "📦" },
    { name: "Orders", href: "/admin/orders", icon: "🛒" },
    { name: "Deliveries", href: "/admin/deliveries", icon: "🚚" },
    { name: "Reports", href: "/admin/reports", icon: "📈" },
  ]

  const farmerMenu = [
    { name: "Dashboard", href: "/farmer/dashboard", icon: "🌾" },
    { name: "My Products", href: "/farmer/products", icon: "📦" },
    { name: "My Orders", href: "/farmer/orders", icon: "📋" },
    { name: "Earnings", href: "/farmer/earnings", icon: "💰" },
  ]

  const customerMenu = [
    { name: "Home", href: "/customer/dashboard", icon: "🏠" },
    { name: "Browse Products", href: "/customer/products", icon: "🛍️" },
    { name: "My Orders", href: "/customer/orders", icon: "📦" },
    { name: "Cart", href: "/customer/cart", icon: "🛒" },
  ]

  const deliveryMenu = [
    { name: "Dashboard", href: "/delivery/dashboard", icon: "📍" },
    { name: "Active Deliveries", href: "/delivery/active", icon: "🚚" },
    { name: "History", href: "/delivery/history", icon: "📜" },
    { name: "Earnings", href: "/delivery/earnings", icon: "💰" },
  ]

  const menuItems =
    role === "admin" ? adminMenu : role === "farmer" ? farmerMenu : role === "customer" ? customerMenu : deliveryMenu

  const handleLogout = () => {
    auth?.logout()
    localStorage.removeItem("currentUser")
    localStorage.removeItem("userRole")
    router.push("/")
  }

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <p className="text-xs text-gray-400 mt-1">{role.charAt(0).toUpperCase() + role.slice(1)}</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-lg transition ${
                isActive ? "bg-green-600 text-white" : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{auth?.user?.name}</p>
            <p className="text-xs text-gray-400">{auth?.user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
