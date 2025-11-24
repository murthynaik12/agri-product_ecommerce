"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { fetchOrders, fetchProducts } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"

export default function FarmerEarnings() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user?.id) return
    try {
      setIsLoading(true)
      const [ordersData, productsData] = await Promise.all([
        fetchOrders(undefined, user.id),
        fetchProducts(user.id),
      ])
      setOrders(ordersData || [])
      setProducts(productsData || [])
    } catch (error) {
      console.error("Failed to load earnings data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Generate monthly earnings breakdown for last 6 months
  const generateEarningsBreakdown = () => {
    const months = ["January", "February", "March", "April", "May", "June"]
    const now = new Date()
    const breakdown = []
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = months[monthDate.getMonth()]
      
      const monthOrders = orders.filter((o) => {
        if (o.paymentStatus !== "paid" && o.status !== "delivered") return false
        const orderDate = new Date(o.createdAt || o.orderDate || o._id?.getTimestamp?.() || Date.now())
        return orderDate.getMonth() === monthDate.getMonth() && 
               orderDate.getFullYear() === monthDate.getFullYear()
      })
      
      // Calculate earnings from orders (only items from this farmer)
      const monthEarnings = monthOrders.reduce((sum, o) => {
        const farmerItems = o.items?.filter((item: any) => {
          const itemFarmerId = item.farmerId?.toString() || item.farmerId
          const farmerId = user?.id?.toString() || user?.id
          return itemFarmerId === farmerId
        }) || []
        const itemTotal = farmerItems.reduce((s: number, item: any) => s + (item.price || 0) * (item.quantity || 0), 0)
        return sum + itemTotal
      }, 0)
      
      breakdown.push({
        month: monthName,
        earnings: monthEarnings,
        orders: monthOrders.length,
        products: products.length,
      })
    }
    
    return breakdown
  }

  const earningsBreakdown = generateEarningsBreakdown()
  const totalEarnings = earningsBreakdown.reduce((sum, m) => sum + m.earnings, 0)
  const totalOrders = earningsBreakdown.reduce((sum, m) => sum + m.orders, 0)
  const avgOrderValue = totalOrders > 0 ? Math.round(totalEarnings / totalOrders) : 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
        <div className="text-center py-8">Loading earnings data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-white border border-gray-200">
          <div className="text-gray-600 text-sm font-medium">Total Earnings</div>
          <div className="text-3xl font-bold text-green-600 mt-2">₹{totalEarnings.toLocaleString()}</div>
          <div className="text-gray-500 text-xs mt-2">Last 6 months</div>
        </Card>
        <Card className="p-6 bg-white border border-gray-200">
          <div className="text-gray-600 text-sm font-medium">Total Orders</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{totalOrders}</div>
          <div className="text-gray-500 text-xs mt-2">Last 6 months</div>
        </Card>
        <Card className="p-6 bg-white border border-gray-200">
          <div className="text-gray-600 text-sm font-medium">Avg Order Value</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">₹{avgOrderValue.toLocaleString()}</div>
          <div className="text-gray-500 text-xs mt-2">Per order</div>
        </Card>
      </div>

      <Card className="p-6 bg-white border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Earnings Breakdown</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={earningsBreakdown}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="earnings" fill="#16a34a" name="Earnings (₹)" />
            <Bar dataKey="orders" fill="#3b82f6" name="Orders" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6 bg-white border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
        <div className="space-y-3">
          {earningsBreakdown.filter((m) => m.earnings > 0).length > 0 ? (
            earningsBreakdown
              .filter((m) => m.earnings > 0)
              .reverse()
              .slice(0, 6)
              .map((month, idx) => {
                const monthDate = new Date()
                monthDate.setMonth(monthDate.getMonth() - (5 - idx))
                const dateStr = monthDate.toISOString().split("T")[0]
                return (
            <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
              <div>
                      <p className="font-medium text-gray-900">{dateStr}</p>
                      <p className="text-sm text-gray-500">Bank Transfer</p>
              </div>
              <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{month.earnings.toLocaleString()}</p>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">paid</span>
              </div>
            </div>
                )
              })
          ) : (
            <div className="text-center py-4 text-gray-500">No payment history yet</div>
          )}
        </div>
      </Card>
    </div>
  )
}
