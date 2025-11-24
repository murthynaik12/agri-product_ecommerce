"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchOrders } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"

interface Order {
  _id?: string
  id?: string
  customerId: string
  customerName: string
  items: any[]
  totalAmount: number
  status: string
  createdAt?: string
  deliveryStatus?: string
}

export default function CustomerOrders() {
  const { user } = useAuth()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [user])

  const loadOrders = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      console.log("Loading orders for user:", user.id)
      const data = await fetchOrders(user.id)
      
      // Fetch deliveries to get delivery status
      const deliveriesResponse = await fetch("/api/deliveries")
      const deliveries = await deliveriesResponse.json()
      const deliveriesMap = new Map(
        deliveries.map((d: any) => [d.orderId?.toString() || d.orderId, d])
      )
      
      console.log("Received orders from API:", data)
      const mappedOrders = data.map((o: any) => {
        const delivery = deliveriesMap.get(o._id?.toString() || o._id)
        return {
        _id: o._id,
        id: o._id,
        customerId: o.customerId,
        customerName: o.customerName,
        items: o.items || [],
        totalAmount: o.totalAmount,
        status: o.status,
          deliveryStatus: delivery?.status || "pending",
        createdAt: o.orderDate
          ? new Date(o.orderDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        }
      })
      console.log("Mapped orders:", mappedOrders)
      setOrders(mappedOrders)
    } catch (error) {
      console.error("Failed to load orders:", error)
      alert("Failed to load orders")
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmDelivery = async (order: Order) => {
    if (!order._id && !order.id) {
      alert("Invalid order ID")
      return
    }

    const orderId = order._id || order.id

    if (!confirm("Confirm that you have received your order?")) {
      return
    }

    try {
      // Find the delivery for this order
      const deliveriesResponse = await fetch("/api/deliveries")
      if (!deliveriesResponse.ok) {
        throw new Error("Failed to fetch deliveries")
      }
      
      const deliveries = await deliveriesResponse.json()
      console.log("All deliveries:", deliveries)
      console.log("Looking for order ID:", orderId)
      
      // Try to find delivery by matching orderId (handle both string and ObjectId formats)
      const delivery = deliveries.find((d: any) => {
        const dOrderId = d.orderId?.toString() || d.orderId
        const oId = orderId?.toString() || orderId
        console.log("Comparing:", dOrderId, "===", oId, "Result:", dOrderId === oId)
        return dOrderId === oId
      })

      console.log("Found delivery:", delivery)

      if (delivery && delivery._id) {
        // Update delivery status to delivered
        const deliveryId = delivery._id.toString() || delivery._id
        console.log("Updating delivery:", deliveryId)
        
        // Try update-status route first
        let response = await fetch(`/api/deliveries/actions/update-status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliveryId: deliveryId,
            status: "delivered",
          }),
        })

        // If that fails, try the direct delivery update route
        if (!response.ok) {
          console.log("Update-status route failed, trying direct delivery update")
          response = await fetch(`/api/deliveries/${deliveryId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "delivered",
            }),
          })
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          console.error("API Error:", errorData)
          throw new Error(errorData.error || `Failed to confirm delivery: ${response.status} ${response.statusText}`)
        }

        const result = await response.json()
        console.log("Delivery update result:", result)

        alert("Order delivery confirmed! Thank you for your purchase.")
        await loadOrders()
      } else {
        // If no delivery found, just update order status
        console.log("No delivery found, updating order directly")
        const response = await fetch(`/api/orders/${orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "delivered" }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          console.error("Order update error:", errorData)
          throw new Error(errorData.error || `Failed to update order: ${response.status} ${response.statusText}`)
        }

        alert("Order delivery confirmed! Thank you for your purchase.")
        await loadOrders()
      }
    } catch (error: any) {
      console.error("Failed to confirm delivery:", error)
      const errorMessage = error.message || "Failed to confirm delivery. Please try again."
      alert(errorMessage)
    }
  }

  const filteredOrders = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus)

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setShowModal(true)
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading orders...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "in-transit", "delivered", "cancelled"].map((status) => (
          <Button
            key={status}
            onClick={() => setFilterStatus(status)}
            variant={filterStatus === status ? "default" : "outline"}
            className={filterStatus === status ? "bg-blue-600 text-white" : ""}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
          </Button>
        ))}
      </div>

      <Card className="p-6 bg-white border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Order ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Items</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{order.id?.substring(0, 8)}</td>
                    <td className="px-4 py-3 text-gray-600">{order.createdAt}</td>
                    <td className="px-4 py-3 text-gray-600">{order.items.length} items</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">₹{order.totalAmount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-700"
                            : order.status === "in-transit"
                              ? "bg-blue-100 text-blue-700"
                              : order.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <Button
                        onClick={() => handleViewOrder(order)}
                        variant="outline"
                        size="sm"
                        className="text-blue-600"
                      >
                        View
                      </Button>
                      {order.deliveryStatus === "arrived" && order.status !== "delivered" && (
                        <Button
                          onClick={() => handleConfirmDelivery(order)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Order Delivered
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Order Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Details</h2>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-gray-600 text-sm">Order ID</p>
                <p className="font-semibold text-gray-900">{selectedOrder.id?.substring(0, 8)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Order Date</p>
                <p className="font-semibold text-gray-900">{selectedOrder.createdAt}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Amount</p>
                <p className="font-semibold text-gray-900">₹{selectedOrder.totalAmount}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Status</p>
                <p className="font-semibold text-gray-900 capitalize">{selectedOrder.status}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-2">Items Ordered</p>
                <ul className="text-gray-900 text-sm space-y-1">
                  {selectedOrder.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-blue-600">•</span>
                      <span>
                        {item.productName} - {item.quantity} @ ₹{item.price}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-2">
              {selectedOrder.deliveryStatus === "arrived" && selectedOrder.status !== "delivered" && (
                <Button
                  onClick={() => {
                    handleConfirmDelivery(selectedOrder)
                    setShowModal(false)
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Order Delivered
                </Button>
              )}
            <Button onClick={() => setShowModal(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Close
            </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
