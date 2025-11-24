"use client"

import { Card } from "@/components/ui/card"
import { useState, useEffect } from "react"
import { fetchDeliveries, updateDelivery } from "@/lib/api-client"
import { useAuth } from "@/context/auth-context"

interface Delivery {
  _id: string
  orderId: string
  agentId: string
  agentName: string
  customerName?: string
  status: string
  location: string
  eta?: string
  createdAt?: string
  deliveryAgentId?: string // Added deliveryAgentId field
}

export default function ActiveDeliveries() {
  const { user } = useAuth()
  const [pendingDeliveries, setPendingDeliveries] = useState<Delivery[]>([])
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)

  useEffect(() => {
    loadDeliveries()
  }, [user])

  const loadDeliveries = async () => {
    if (!user || !user.id) {
      console.error("User not found")
      return
    }

    try {
      setIsLoading(true)
      console.log("Delivery Agent: Loading deliveries for user:", user.id, "Type:", typeof user.id)
      // Pass the current agent's ID to filter deliveries
      let allDeliveries = await fetchDeliveries(user.id)
      console.log("Delivery Agent: Filtered deliveries from API:", allDeliveries.length)
      
      // If no deliveries found, try fetching all and filtering manually (fallback)
      if (allDeliveries.length === 0) {
        console.log("No deliveries found with agentId filter, trying to fetch all and filter manually...")
        const allDeliveriesResponse = await fetch("/api/deliveries")
        const allDeliveriesData = await allDeliveriesResponse.json()
        console.log("All deliveries (unfiltered):", allDeliveriesData.length)
        
        // Filter manually by comparing agentId/deliveryAgentId with user.id
        allDeliveries = allDeliveriesData.filter((d: any) => {
          const agentIdMatch = String(d.agentId) === String(user.id) || d.agentId === user.id
          const deliveryAgentIdMatch = String(d.deliveryAgentId) === String(user.id) || d.deliveryAgentId === user.id
          return agentIdMatch || deliveryAgentIdMatch
        })
        console.log("Manually filtered deliveries:", allDeliveries.length)
      }
      
      console.log("Delivery Agent: Final deliveries count:", allDeliveries.length)
      console.log("Delivery Agent: All deliveries:", allDeliveries)

      // Filter pending deliveries - show assigned deliveries that need acceptance
      // These are deliveries with status "assigned" that are assigned to this user
      const pending = allDeliveries.filter((d: any) => {
        const isAssigned = d.status === "assigned" || d.status === "pending"
        const isAssignedToUser = 
          String(d.agentId) === String(user.id) || 
          String(d.deliveryAgentId) === String(user.id) ||
          d.agentId === user.id ||
          d.deliveryAgentId === user.id
        console.log("Checking pending delivery:", {
          deliveryId: d._id,
          status: d.status,
          agentId: d.agentId,
          deliveryAgentId: d.deliveryAgentId,
          userId: user.id,
          isAssigned,
          isAssignedToUser,
          match: isAssigned && isAssignedToUser
        })
        return isAssigned && isAssignedToUser && d.status !== "delivered" && d.status !== "rejected"
      })

      // Filter active deliveries - show deliveries assigned to this user that are in-transit
      const active = allDeliveries.filter((d: Delivery) => {
        const isAssignedToUser = 
          d.agentId === user?.id || 
          d.deliveryAgentId === user?.id ||
          String(d.agentId) === String(user?.id) ||
          String(d.deliveryAgentId) === String(user?.id)
        const isActive = d.status === "accepted" || d.status === "picked" || d.status === "in-transit" || d.status === "on-the-way" || d.status === "arrived"
        console.log("Checking delivery:", d.orderId, {
          agentId: d.agentId,
          deliveryAgentId: d.deliveryAgentId,
          userId: user?.id,
          isAssignedToUser,
          isActive,
          status: d.status,
        })
        return isAssignedToUser && isActive && d.status !== "delivered" && d.status !== "rejected"
      })

      console.log("Delivery Agent: Total deliveries fetched:", allDeliveries.length)
      console.log("Delivery Agent: All deliveries details:", allDeliveries.map((d: any) => ({
        _id: d._id,
        orderId: d.orderId,
        status: d.status,
        agentId: d.agentId,
        deliveryAgentId: d.deliveryAgentId,
        agentName: d.agentName
      })))
      console.log("Delivery Agent: Pending deliveries:", pending.length, pending)
      console.log("Delivery Agent: Active deliveries:", active.length, active)
      
      // Log all delivery statuses for debugging
      const statusCounts = allDeliveries.reduce((acc: any, d: Delivery) => {
        acc[d.status || "undefined"] = (acc[d.status || "undefined"] || 0) + 1
        return acc
      }, {})
      console.log("Delivery Agent: Status breakdown:", statusCounts)
      
      // Log user ID for comparison
      console.log("Delivery Agent: Current user ID (for comparison):", user.id, typeof user.id)

      setPendingDeliveries(pending)
      setActiveDeliveries(active)
    } catch (error) {
      console.error("Delivery Agent: Failed to load deliveries:", error)
      alert("Failed to load deliveries")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptDelivery = async (delivery: Delivery) => {
    if (!user) {
      alert("Please log in to accept deliveries")
      return
    }

    if (!delivery._id) {
      alert("Invalid delivery ID")
      return
    }

    try {
      console.log("Accepting delivery:", {
        deliveryId: delivery._id,
        agentId: user.id,
        agentName: user.name,
      })

      await updateDelivery(delivery._id, {
        agentId: user.id,
        agentName: user.name || "Unknown Agent",
        status: "accepted",
      })

      alert("Delivery accepted successfully! Status updated to 'Delivery Agent Accepted Order'")
      await loadDeliveries()
    } catch (error: any) {
      console.error("Failed to accept delivery:", error)
      const errorMessage = error.message || "Failed to accept delivery. Please try again."
      alert(errorMessage)
    }
  }

  const handleRejectDelivery = async (delivery: Delivery) => {
    if (!user) {
      alert("Please log in to reject deliveries")
      return
    }

    if (!delivery._id) {
      alert("Invalid delivery ID")
      return
    }

    if (!confirm("Are you sure you want to reject this delivery?")) {
      return
    }

    try {
      await updateDelivery(delivery._id, {
        status: "rejected",
        agentId: "",
        agentName: "Unassigned",
      })

      alert("Delivery rejected. It will be reassigned to another agent.")
      await loadDeliveries()
    } catch (error: any) {
      console.error("Failed to reject delivery:", error)
      alert("Failed to reject delivery. Please try again.")
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDelivery(id, { status: newStatus })
      alert(`Delivery status updated to ${newStatus}!`)
      setSelectedDelivery(null)
      loadDeliveries()
    } catch (error) {
      console.error("Failed to update delivery status:", error)
      alert("Failed to update delivery status")
    }
  }

  const handleCompleteDelivery = async (id: string) => {
    try {
      await updateDelivery(id, { status: "delivered" })
      alert("Delivery marked as completed!")
      setSelectedDelivery(null)
      loadDeliveries()
    } catch (error) {
      console.error("Failed to complete delivery:", error)
      alert("Failed to update delivery status")
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading deliveries...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Deliveries</h1>
        <p className="text-gray-600 mt-2">View available deliveries and manage your active deliveries</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Deliveries</h2>
        {pendingDeliveries.length > 0 ? (
          <div className="grid gap-4">
            {pendingDeliveries.map((delivery) => (
              <Card key={delivery._id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order {delivery.orderId?.substring(0, 8) || delivery.orderId || "N/A"}
                    </h3>
                    <p className="text-gray-600 mt-1">📍 Delivery Location: {delivery.location || "N/A"}</p>
                    {delivery.eta && (
                      <p className="text-gray-600">
                        🕐 Expected by: {new Date(delivery.eta).toLocaleDateString()}
                      </p>
                    )}
                    {delivery.customerName && <p className="text-gray-600">Customer: {delivery.customerName}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptDelivery(delivery)}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectDelivery(delivery)}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-gray-600">No available deliveries at the moment</p>
          </Card>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Active Deliveries</h2>
        <div className="grid gap-4">
          {activeDeliveries.length > 0 ? (
            activeDeliveries.map((delivery) => (
              <Card
                key={delivery._id}
                className="p-6 cursor-pointer hover:shadow-lg transition"
                onClick={() => setSelectedDelivery(delivery)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Order {delivery.orderId.substring(0, 8)}</h3>
                    <p className="text-gray-600 mt-1">📍 Location: {delivery.location}</p>
                    {delivery.eta && (
                      <p className="text-gray-600">🕐 Estimated Arrival: {new Date(delivery.eta).toLocaleString()}</p>
                    )}
                    {delivery.customerName && <p className="text-gray-600">Customer: {delivery.customerName}</p>}
                  </div>
                  <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium">
                    {delivery.status}
                  </span>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 text-center">
              <p className="text-gray-600">No active deliveries at the moment</p>
            </Card>
          )}
        </div>
      </div>

      {selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Details</h2>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-medium text-gray-900">{selectedDelivery.orderId.substring(0, 8)}</p>
              </div>
              {selectedDelivery.customerName && (
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium text-gray-900">{selectedDelivery.customerName}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Delivery Location</p>
                <p className="font-medium text-gray-900">{selectedDelivery.location}</p>
              </div>
              {selectedDelivery.eta && (
                <div>
                  <p className="text-sm text-gray-600">Estimated Arrival</p>
                  <p className="font-medium text-gray-900">{new Date(selectedDelivery.eta).toLocaleString()}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium text-blue-600">{selectedDelivery.status}</p>
              </div>
            </div>
            <div className="space-y-2">
              {selectedDelivery.status === "accepted" && (
                <button
                  onClick={() => handleUpdateStatus(selectedDelivery._id, "picked")}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  Picked Up from Farmer
                </button>
              )}
              {selectedDelivery.status === "picked" && (
                <button
                  onClick={() => handleUpdateStatus(selectedDelivery._id, "in-transit")}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  Mark as In Transit
                </button>
              )}
              {(selectedDelivery.status === "in-transit" || selectedDelivery.status === "on-the-way") && (
                <button
                  onClick={() => handleUpdateStatus(selectedDelivery._id, "arrived")}
                  className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition"
                >
                  Reached Customer Location
                </button>
              )}
              <button
                onClick={() => setSelectedDelivery(null)}
                className="w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-medium transition"
              >
                Close
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
