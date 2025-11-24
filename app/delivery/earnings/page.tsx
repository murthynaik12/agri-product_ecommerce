"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { fetchDeliveries } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"

export default function DeliveryEarnings() {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadDeliveries()
    }
  }, [user])

  const loadDeliveries = async () => {
    if (!user?.id) return
    try {
      setIsLoading(true)
      const deliveriesData = await fetchDeliveries(user.id)
      setDeliveries(deliveriesData || [])
    } catch (error) {
      console.error("Failed to load deliveries:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate earnings from delivered orders (₹200 per delivery)
  const earningsPerDelivery = 200

  const generateEarningsData = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const weeks = []
    
    for (let week = 1; week <= 4; week++) {
      const weekStart = new Date(currentYear, currentMonth, (week - 1) * 7 + 1)
      const weekEnd = new Date(currentYear, currentMonth, week * 7)
      
      const weekDeliveries = deliveries.filter((d) => {
        if (d.status !== "delivered") return false
        const deliveryDate = d.deliveryDate ? new Date(d.deliveryDate) : new Date(d.createdAt || Date.now())
        return deliveryDate >= weekStart && deliveryDate <= weekEnd
      })
      
      weeks.push({
        week: `Week ${week}`,
        earnings: weekDeliveries.length * earningsPerDelivery,
        deliveries: weekDeliveries.length,
      })
    }
    
    return weeks
  }

  const earningsData = generateEarningsData()
  const totalEarnings = earningsData.reduce((sum, item) => sum + item.earnings, 0)
  const totalDeliveries = earningsData.reduce((sum, item) => sum + item.deliveries, 0)
  const averageEarning = totalDeliveries > 0 ? Math.round(totalEarnings / totalDeliveries) : 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Earnings Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your monthly earnings and performance</p>
        </div>
        <div className="text-center py-8">Loading earnings data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Earnings Dashboard</h1>
        <p className="text-gray-600 mt-2">Track your monthly earnings and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="text-sm text-gray-600">Total Earnings</div>
          <div className="text-3xl font-bold text-green-600 mt-2">₹{totalEarnings.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-2">This month</p>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600">Total Deliveries</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{totalDeliveries}</div>
          <p className="text-xs text-gray-500 mt-2">This month</p>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600">Avg per Delivery</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">₹{averageEarning}</div>
          <p className="text-xs text-gray-500 mt-2">Average earnings</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Earnings Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Deliveries per Week</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="deliveries" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Summary</h2>
        <div className="space-y-3">
          {earningsData.map((item) => (
            <div key={item.week} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{item.week}</p>
                <p className="text-sm text-gray-600">{item.deliveries} deliveries</p>
              </div>
              <p className="text-lg font-semibold text-green-600">₹{item.earnings.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
