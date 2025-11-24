"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { fetchDeliveries } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"

export default function DeliveryDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [currentLocation, setCurrentLocation] = useState("Main Street, Downtown")
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

  const activeDeliveries = deliveries.filter((d) => 
    d.status === "in-transit" || d.status === "on-the-way" || d.status === "picked" || d.status === "accepted"
  )

  const totalDeliveries = deliveries.length
  const deliveredCount = deliveries.filter((d) => d.status === "delivered").length

  // Calculate monthly earnings from delivered orders
  const calculateMonthlyEarnings = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const monthlyDeliveries = deliveries.filter((d) => {
      if (d.status !== "delivered" || !d.deliveryDate) return false
      const deliveryDate = new Date(d.deliveryDate)
      return deliveryDate.getMonth() === currentMonth && deliveryDate.getFullYear() === currentYear
    })
    
    // Assuming each delivery earns a fixed amount (you can adjust this based on your business logic)
    const earningsPerDelivery = 200 // ₹200 per delivery
    return monthlyDeliveries.length * earningsPerDelivery
  }

  const monthlyEarnings = calculateMonthlyEarnings()

  // Generate weekly earnings data for current month
  const generateEarningsData = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const weeks = []
    
    for (let week = 1; week <= 4; week++) {
      const weekStart = new Date(currentYear, currentMonth, (week - 1) * 7 + 1)
      const weekEnd = new Date(currentYear, currentMonth, week * 7)
      
      const weekDeliveries = deliveries.filter((d) => {
        if (d.status !== "delivered" || !d.deliveryDate) return false
        const deliveryDate = new Date(d.deliveryDate)
        return deliveryDate >= weekStart && deliveryDate <= weekEnd
      })
      
      weeks.push({
        week: `Week ${week}`,
        earnings: weekDeliveries.length * 200, // ₹200 per delivery
      })
    }
    
    return weeks
  }

  const earningsData = generateEarningsData()

  const handleViewActiveDeliveries = () => {
    router.push("/delivery/active")
  }

  const handleUpdateLocation = () => {
    setShowLocationModal(true)
  }

  const handleViewEarnings = () => {
    router.push("/delivery/earnings")
  }

  const handleSaveLocation = () => {
    alert(`Location updated to: ${currentLocation}`)
    setShowLocationModal(false)
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name || "Delivery Agent"}</h1>
        <p className="text-gray-600 mt-2">Manage your deliveries and track earnings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-sm text-gray-600">Total Deliveries</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{totalDeliveries}</div>
          <p className="text-xs text-gray-500 mt-2">All time</p>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600">Active Today</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{activeDeliveries.length}</div>
          <p className="text-xs text-gray-500 mt-2">In transit</p>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">{deliveredCount}</div>
          <p className="text-xs text-gray-500 mt-2">Delivered</p>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-gray-600">Monthly Earnings</div>
          <div className="text-3xl font-bold text-purple-600 mt-2">₹{monthlyEarnings.toLocaleString()}</div>
          <p className="text-xs text-gray-500 mt-2">This month</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Earnings</h2>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={handleViewActiveDeliveries}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
            >
              View Active Deliveries
            </button>
            <button
              onClick={handleUpdateLocation}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              Update Location
            </button>
            <button
              onClick={handleViewEarnings}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
            >
              View Earnings
            </button>
          </div>
        </Card>
      </div>

      {activeDeliveries.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Deliveries</h2>
          <div className="space-y-4">
            {activeDeliveries.map((delivery) => (
              <div
                key={delivery._id || delivery.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">Order {(delivery.orderId || delivery._id || "").toString().substring(0, 8)}</p>
                  <p className="text-sm text-gray-600">📍 {delivery.currentLocation || delivery.location || "Location not set"}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {delivery.status}
                  </span>
                  <p className="text-sm text-gray-600 mt-2">
                    {delivery.estimatedArrival ? `Est: ${delivery.estimatedArrival}` : "No ETA"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Your Location</h2>
            <input
              type="text"
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your current location"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowLocationModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLocation}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                Save Location
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
