"use client"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { fetchOrders, fetchDeliveries, fetchUsers } from "@/lib/api-client"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const COLORS = ["#16a34a", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([])
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [ordersData, deliveriesData, usersData] = await Promise.all([
        fetchOrders(),
        fetchDeliveries(),
        fetchUsers("farmer"),
      ])
      setOrders(ordersData || [])
      setDeliveries(deliveriesData || [])
      setUsers(usersData || [])
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate metrics
  const totalOrders = orders.length
  const paidOrders = orders.filter((o) => o.paymentStatus === "paid" || o.status === "delivered")
  const totalRevenue = paidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
  const totalFarmers = users.length
  const activeDeliveries = deliveries.filter((d) => 
    d.status === "in-transit" || d.status === "on-the-way" || d.status === "picked" || d.status === "accepted"
  ).length

  // Generate chart data from last 6 months
  const generateChartData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    const now = new Date()
    return months.map((month, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      const monthOrders = orders.filter((o) => {
        const orderDate = new Date(o.createdAt || o.orderDate || o._id?.getTimestamp?.() || Date.now())
        return orderDate.getMonth() === monthDate.getMonth() && 
               orderDate.getFullYear() === monthDate.getFullYear()
      })
      const monthRevenue = monthOrders
        .filter((o) => o.paymentStatus === "paid" || o.status === "delivered")
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
      const monthDeliveries = deliveries.filter((d) => {
        const deliveryDate = new Date(d.createdAt || d._id?.getTimestamp?.() || Date.now())
        return deliveryDate.getMonth() === monthDate.getMonth() && 
               deliveryDate.getFullYear() === monthDate.getFullYear()
      }).length
      return {
        name: month,
        orders: monthOrders.length,
        revenue: monthRevenue,
        deliveries: monthDeliveries,
      }
    })
  }

  const chartData = generateChartData()

  // Calculate category distribution from products in orders
  const calculateCategoryData = () => {
    const categoryMap = new Map<string, number>()
    orders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const category = item.category || item.productCategory || "Others"
          categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
        })
      }
    })
    const total = Array.from(categoryMap.values()).reduce((sum, val) => sum + val, 0)
    if (total === 0) {
      return [{ name: "No Data", value: 100 }]
    }
    return Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
    }))
  }

  const categoryData = calculateCategoryData()

  if (isLoading) {
    return <div className="text-center py-8">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-white border border-gray-200">
          <div className="text-gray-600 text-sm font-medium">Total Orders</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{totalOrders}</div>
          <div className="text-gray-500 text-xs mt-2">+12% from last month</div>
        </Card>
        <Card className="p-6 bg-white border border-gray-200">
          <div className="text-gray-600 text-sm font-medium">Total Revenue</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">₹{totalRevenue.toLocaleString()}</div>
          <div className="text-gray-500 text-xs mt-2">+8% from last month</div>
        </Card>
        <Card className="p-6 bg-white border border-gray-200">
          <div className="text-gray-600 text-sm font-medium">Active Farmers</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">{totalFarmers}</div>
          <div className="text-gray-500 text-xs mt-2">+2 this month</div>
        </Card>
        <Card className="p-6 bg-white border border-gray-200">
          <div className="text-gray-600 text-sm font-medium">Active Deliveries</div>
          <div className="text-3xl font-bold text-orange-600 mt-2">{activeDeliveries}</div>
          <div className="text-gray-500 text-xs mt-2">+5 today</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 bg-white border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders & Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="orders" stroke="#16a34a" strokeWidth={2} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-white border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Categories</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {orders.slice(0, 5).length > 0 ? (
              orders.slice(0, 5).map((order) => (
              <div
                  key={order._id || order.id}
                className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
              >
                <div>
                    <p className="font-medium text-gray-900">{(order._id || order.id)?.toString().substring(0, 8)}</p>
                    <p className="text-sm text-gray-500">{order.customerName || "Unknown Customer"}</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{order.totalAmount?.toLocaleString() || 0}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      order.status === "delivered"
                        ? "bg-green-100 text-green-700"
                          : order.status === "in-transit" || order.status === "on-the-way"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                      {order.status || "pending"}
                  </span>
                </div>
              </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">No orders yet</div>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Farmers</h2>
          <div className="space-y-3">
            {users.length > 0 ? (
              users.slice(0, 3).map((farmer) => {
                const farmerOrders = orders.filter((o) => {
                  const orderFarmerId = o.farmerId?.toString() || o.farmerId
                  const farmerId = farmer._id?.toString() || farmer.id
                  if (orderFarmerId === farmerId) return true
                  if (o.items && Array.isArray(o.items)) {
                    return o.items.some((item: any) => {
                      const itemFarmerId = item.farmerId?.toString() || item.farmerId
                      return itemFarmerId === farmerId
                    })
                  }
                  return false
                })
                const sales = farmerOrders.filter((o) => o.paymentStatus === "paid" || o.status === "delivered").length
                return (
              <div
                    key={farmer._id || farmer.id}
                className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
              >
                <div>
                      <p className="font-medium text-gray-900">{farmer.name || "Unknown Farmer"}</p>
                      <p className="text-sm text-gray-500">{sales} sales</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                      <span className="font-semibold">{farmer.rating || "N/A"}</span>
                </div>
              </div>
                )
              })
            ) : (
              <div className="text-center py-4 text-gray-500">No farmers yet</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
