"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { fetchDeliveries } from "@/lib/api-client"
import { useAuth } from "@/context/auth-context"

interface Delivery {
  _id?: string
  id?: string
  orderId: string
  agentId?: string
  deliveryAgentId?: string
  agentName?: string
  customerName?: string
  status: string
  location?: string
  deliveryLocation?: string
  pickupLocation?: string
  createdAt?: string
  deliveredAt?: string
  eta?: string
}

export default function DeliveryHistory() {
  const { user } = useAuth()
  const [completedDeliveries, setCompletedDeliveries] = useState<Delivery[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDeliveryHistory()
  }, [user])

  const loadDeliveryHistory = async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      console.log("Loading delivery history for user:", user.id)
      
      const allDeliveries = await fetchDeliveries()
      console.log("All deliveries fetched:", allDeliveries)

      // Filter for deliveries assigned to this user that are completed
      const completed = allDeliveries.filter((d: Delivery) => {
        const isAssignedToUser = 
          String(d.agentId) === String(user.id) || 
          String(d.deliveryAgentId) === String(user.id) ||
          d.agentId === user.id ||
          d.deliveryAgentId === user.id
        const isCompleted = d.status === "delivered"
        return isAssignedToUser && isCompleted
      })

      console.log("Completed deliveries:", completed)
      setCompletedDeliveries(completed)
    } catch (error) {
      console.error("Failed to load delivery history:", error)
      alert("Failed to load delivery history")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery History</h1>
          <p className="text-gray-600 mt-2">View all your past deliveries</p>
        </div>
        <Card className="p-6">
          <div className="text-center py-8 text-gray-600">Loading delivery history...</div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Delivery History</h1>
        <p className="text-gray-600 mt-2">View all your past deliveries</p>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Delivery ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Order ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Location</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Delivered Date</th>
              </tr>
            </thead>
            <tbody>
              {completedDeliveries.length > 0 ? (
                completedDeliveries.map((delivery) => (
                  <tr key={delivery._id || delivery.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {(delivery._id || delivery.id)?.substring(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {delivery.orderId?.substring(0, 8) || delivery.orderId}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {delivery.customerName || "Unknown Customer"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {delivery.location || delivery.deliveryLocation || delivery.pickupLocation || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {delivery.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {delivery.deliveredAt
                        ? new Date(delivery.deliveredAt).toLocaleDateString()
                        : delivery.createdAt
                          ? new Date(delivery.createdAt).toLocaleDateString()
                          : "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-600">
                    No delivery history available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
