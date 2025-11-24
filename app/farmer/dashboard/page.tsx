"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchProducts, fetchOrders } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export default function FarmerDashboard() {
  const router = useRouter()
  const { user } = useAuth()

  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const [productsData, ordersData] = await Promise.all([
        fetchProducts(user.id),
        fetchOrders(),
      ])

      setProducts(productsData)
      setOrders(ordersData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // -------------------------------
  // 🎯 Generate Weekly Earnings
  // -------------------------------
  const generateEarningsData = (ordersList: any[]) => {
    if (!ordersList || !user) return []

    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()

    const weeks = []

    for (let week = 1; week <= 4; week++) {
      const weekStart = new Date(year, month, (week - 1) * 7 + 1)
      const weekEnd = new Date(year, month, week * 7)

      const weeklyOrders = ordersList.filter((o) => {
        if (o.paymentStatus !== "paid" || o.status !== "delivered") return false

        const orderDate = new Date(
          o.createdAt || o.orderDate || Date.now()
        )

        return orderDate >= weekStart && orderDate <= weekEnd
      })

      // calculate total farmer earnings for the week
      const total = weeklyOrders.reduce((sum, o) => {
        const farmerItems =
          o.items?.filter((item: any) => {
            const itemFarmer = item.farmerId?.toString()
            const currentFarmer = user?.id?.toString()
            return itemFarmer === currentFarmer
          }) || []

        const itemTotal = farmerItems.reduce(
          (s: number, item: any) =>
            s + (item.price || 0) * (item.quantity || 0),
          0
        )

        return sum + itemTotal
      }, 0)

      weeks.push({
        name: `Week ${week}`,
        earnings: total,
      })
    }

    return weeks
  }

  const earningsData = generateEarningsData(orders)

  // -------------------------------
  // 📊 Stats
  // -------------------------------
  const totalSales = products.reduce(
    (sum, p) => sum + p.price * (20 - (p.stock || 0)),
    0
  )

  const averageRating =
    products.length > 0
      ? (
          products.reduce((sum, p) => sum + (p.rating || 0), 0) /
          products.length
        ).toFixed(1)
      : 0

  if (isLoading) {
    return <div className="text-center py-8">Loading dashboard...</div>
  }

  // -------------------------------
  // 📦 UI
  // -------------------------------
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-white border">
          <div className="text-gray-600">Active Products</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {products.length}
          </div>
        </Card>

        <Card className="p-6 bg-white border">
          <div className="text-gray-600">Total Sales</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            ₹{totalSales.toLocaleString()}
          </div>
        </Card>

        <Card className="p-6 bg-white border">
          <div className="text-gray-600">Pending Orders</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">
            {orders.length}
          </div>
        </Card>

        <Card className="p-6 bg-white border">
          <div className="text-gray-600">Avg Rating</div>
          <div className="text-3xl font-bold text-orange-600 mt-2">
            {averageRating}
          </div>
        </Card>
      </div>

      {/* Earnings Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 bg-white border">
          <h2 className="text-lg font-semibold">Monthly Earnings</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="earnings"
                stroke="#16a34a"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6 bg-white border">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <div className="space-y-2 mt-3">
            <Button
              onClick={() => router.push("/farmer/products")}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Add New Product
            </Button>

            <Button
              onClick={() => router.push("/farmer/orders")}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              View Orders
            </Button>

            <Button
              onClick={() => router.push("/farmer/products")}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Manage Stock
            </Button>

            <Button
              onClick={() => alert("Reviews coming soon!")}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              View Reviews
            </Button>
          </div>
        </Card>
      </div>

      {/* Product + Orders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling */}
        <Card className="p-6 bg-white border">
          <h2 className="text-lg font-semibold mb-3">
            Top Selling Products
          </h2>

          {products.slice(0, 3).map((p) => (
            <div
              key={p._id}
              className="flex justify-between py-2 border-b"
            >
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-gray-500">
                  {p.stock} kg in stock
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">₹{p.price}</p>
                <p className="text-yellow-500">★ {p.rating || 0}</p>
              </div>
            </div>
          ))}
        </Card>

        {/* Recent Orders */}
        <Card className="p-6 bg-white border">
          <h2 className="text-lg font-semibold mb-3">Recent Orders</h2>

          {orders.slice(0, 3).map((o) => (
            <div
              key={o._id}
              className="flex justify-between py-2 border-b"
            >
              <div>
                <p className="font-medium">
                  {o._id.substring(0, 8)}
                </p>
                <p className="text-sm text-gray-500">
                  {o.customerName}
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold">₹{o.totalAmount}</p>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    o.status === "delivered"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {o.status}
                </span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
