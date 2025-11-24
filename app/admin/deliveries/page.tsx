"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchDeliveries, updateDelivery, fetchUsers } from "@/lib/api-client"

interface Delivery {
  _id?: string
  id?: string
  orderId: string
  agentId: string
  agentName: string
  customerName: string
  status: string
  location: string
  eta?: string
  createdAt?: string
}

interface User {
  _id: string
  name: string
  role: string
}

export default function DeliveriesManagement() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [deliveryAgents, setDeliveryAgents] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [showTrackModal, setShowTrackModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState("")

  useEffect(() => {
    loadDeliveries()
    loadDeliveryAgents()
  }, [])

  const loadDeliveries = async () => {
    try {
      setIsLoading(true)
      console.log("Admin: Loading deliveries...")
      const data = await fetchDeliveries()
      console.log("Admin: Loaded deliveries:", data)

      // Fetch orders to check their status
      const ordersResponse = await fetch("/api/orders")
      const orders = await ordersResponse.json()
      const ordersMap = new Map(orders.map((o: any) => [o._id?.toString() || o.id, o]))

      const mappedDeliveries = data
        .map((d: any) => ({
          _id: d._id || d.id,
          id: d._id || d.id,
          orderId: d.orderId || "",
          agentId: d.agentId || d.deliveryAgentId || "",
          agentName: d.agentName || "Unassigned",
          customerName: d.customerName || "Unknown Customer",
          status: d.status || "pending",
          location: d.location || d.deliveryLocation || d.pickupLocation || "N/A",
          eta: d.eta ? new Date(d.eta).toISOString().split("T")[0] : "N/A",
          createdAt: d.createdAt
            ? new Date(d.createdAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          orderStatus: ordersMap.get(d.orderId?.toString() || d.orderId)?.status || "unknown",
        }))
        // Show all deliveries (no need to filter by paid status anymore)
        .filter((d: any) => {
          return d.status === "pending" || d.status === "assigned" || d.status === "in-transit" || d.status === "picked" || d.status === "arrived" || d.status === "delivered"
        })

      console.log("Admin: Filtered deliveries (paid orders only):", mappedDeliveries)
      setDeliveries(mappedDeliveries)
    } catch (error) {
      console.error("Admin: Failed to load deliveries:", error)
      alert("Failed to load deliveries")
    } finally {
      setIsLoading(false)
    }
  }

  const loadDeliveryAgents = async () => {
    try {
      console.log("Loading delivery agents...")
      const agents = await fetchUsers("delivery")
      console.log("Loaded delivery agents:", agents)
      
      // Ensure all agents are properly formatted with _id
      const formattedAgents = (agents || []).map((agent: any) => ({
        _id: agent._id || agent.id || "",
        name: agent.name || "Unknown",
        role: agent.role || "delivery",
      }))
      
      console.log("Formatted delivery agents:", formattedAgents)
      setDeliveryAgents(formattedAgents)
      
      if (formattedAgents.length === 0) {
        console.warn("No delivery agents found. Make sure you have users with role 'delivery' in the database.")
      } else {
        console.log(`Found ${formattedAgents.length} delivery agent(s)`)
      }
    } catch (error) {
      console.error("Failed to load delivery agents:", error)
      alert("Failed to load delivery agents. Please check the console for details.")
    }
  }

  const handleAssignDelivery = async () => {
    if (!selectedDelivery || !selectedAgent) {
      alert("Please select a delivery agent")
      return
    }

    try {
      const agent = deliveryAgents.find((a) => a._id === selectedAgent)

      console.log("Admin: Assigning delivery:", {
        deliveryId: selectedDelivery._id || selectedDelivery.id,
        agentId: selectedAgent,
        agentName: agent?.name,
      })

      await updateDelivery(selectedDelivery._id || selectedDelivery.id || "", {
        agentId: selectedAgent,
        agentName: agent?.name || "Unknown",
        status: "assigned",
      })

      console.log("Admin: Delivery assigned successfully")
      alert("Delivery assigned successfully!")
      setShowAssignModal(false)
      setSelectedDelivery(null)
      setSelectedAgent("")
      // Reload both deliveries and agents to reflect changes
      await Promise.all([loadDeliveries(), loadDeliveryAgents()])
    } catch (error) {
      console.error("Admin: Failed to assign delivery:", error)
      alert("Failed to assign delivery")
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading deliveries...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Deliveries Management</h1>

      <Card className="p-6 bg-white border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Delivery ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Order ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Agent</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Location</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">ETA</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((delivery) => (
                <tr key={delivery._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {delivery.id?.substring(0, 8) || delivery._id?.substring(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{delivery.orderId?.substring(0, 8)}</td>
                  <td className="px-4 py-3 text-gray-600">{delivery.agentName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        delivery.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : delivery.status === "in-transit"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {delivery.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{delivery.location}</td>
                  <td className="px-4 py-3 text-gray-600">{delivery.eta}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-600 bg-transparent"
                      onClick={() => {
                        setSelectedDelivery(delivery)
                        setShowTrackModal(true)
                      }}
                    >
                      Track
                    </Button>
                    {(delivery.status === "pending" || (!delivery.agentId || delivery.agentId === "unassigned")) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 bg-transparent"
                        onClick={async () => {
                          setSelectedDelivery(delivery)
                          // Reload delivery agents when opening the modal to get latest list
                          await loadDeliveryAgents()
                          setShowAssignModal(true)
                        }}
                      >
                        Assign
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showTrackModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 bg-white max-w-md w-full mx-4">
            <h2 className="text-lg font-bold mb-4">Track Delivery</h2>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-sm text-gray-500">Delivery ID</p>
                <p className="font-medium">
                  {selectedDelivery.id?.substring(0, 8) || selectedDelivery._id?.substring(0, 8)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-medium">{selectedDelivery.orderId?.substring(0, 8)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Agent</p>
                <p className="font-medium">{selectedDelivery.agentName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{selectedDelivery.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{selectedDelivery.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Location</p>
                <p className="font-medium">{selectedDelivery.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estimated Arrival</p>
                <p className="font-medium">{selectedDelivery.eta}</p>
              </div>
            </div>
            <Button
              onClick={() => setShowTrackModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Close
            </Button>
          </Card>
        </div>
      )}

      {showAssignModal && selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 bg-white max-w-md w-full mx-4">
            <h2 className="text-lg font-bold mb-4">Assign Delivery</h2>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Delivery ID</p>
                <p className="font-medium">
                  {selectedDelivery.id?.substring(0, 8) || selectedDelivery._id?.substring(0, 8)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-medium">{selectedDelivery.orderId?.substring(0, 8)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Delivery Agent</label>
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Choose an agent...</option>
                  {deliveryAgents.map((agent) => (
                    <option key={agent._id} value={agent._id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedAgent("")
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleAssignDelivery} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                Assign
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
