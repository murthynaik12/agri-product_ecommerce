"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchOrders, updateOrder } from "@/lib/api-client"
import { useAuth } from "@/context/auth-context"

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  farmerId: string
}

interface Order {
  _id?: string
  customerId: string
  customerName: string
  items: OrderItem[]
  totalAmount: number
  status: string
  createdAt?: string
  deliveryStatus?: string
}

export default function FarmerOrders() {
  const { user } = useAuth()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updateStatus, setUpdateStatus] = useState("")
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadOrders()
    }
    
    // Auto-refresh orders every 10 seconds to catch status updates
    const interval = setInterval(() => {
      if (user) {
    loadOrders()
      }
    }, 10000) // Refresh every 10 seconds
    
    return () => clearInterval(interval)
  }, [user])

  const loadOrders = async () => {
    if (!user || !user.id) {
      console.error("User not found")
      return
    }

    try {
      setIsLoading(true)
      console.log("Loading orders for farmer:", user.id, "Type:", typeof user.id)
      // Pass the current farmer's ID to filter orders
      const data = await fetchOrders(undefined, user.id)
      console.log("Orders fetched from API:", data.length, "orders")
      console.log("Sample order data:", data[0] ? {
        _id: data[0]._id,
        farmerId: data[0].farmerId,
        items: data[0].items?.map((item: any) => ({
          productName: item.productName,
          farmerId: item.farmerId
        }))
      } : "No orders")
      
      // Fetch deliveries to get delivery status for each order
      const deliveriesResponse = await fetch("/api/deliveries")
      const deliveries = await deliveriesResponse.json()
      const deliveriesMap = new Map(
        deliveries.map((d: any) => [d.orderId?.toString() || d.orderId, d])
      )
      
      const mappedOrders = data.map((o: any) => {
        const delivery = deliveriesMap.get(o._id?.toString() || o._id)
        return {
        _id: o._id,
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
      console.log("Mapped orders for display:", mappedOrders.length)
      setOrders(mappedOrders)
    } catch (error) {
      console.error("Failed to load orders:", error)
      alert("Failed to load orders")
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setShowViewModal(true)
  }

  const handleUpdateOrder = (order: Order) => {
    setSelectedOrder(order)
    setUpdateStatus(order.status)
    setShowUpdateModal(true)
  }


  const handleConfirmUpdate = async () => {
    if (selectedOrder && selectedOrder._id) {
      try {
        console.log("Updating order status to:", updateStatus)
        await updateOrder(selectedOrder._id, { status: updateStatus })
        console.log("Order updated successfully, refreshing list")

        // Update the local state
        setOrders(orders.map((o) => (o._id === selectedOrder._id ? { ...o, status: updateStatus } : o)))
        setShowUpdateModal(false)
        setSelectedOrder(null)
      } catch (error) {
        console.error("Failed to update order:", error)
        alert("Failed to update order")
      }
    } else {
      console.error("No order selected or order ID missing")
      alert("Please select an order to update")
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading orders...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>

      <Card className="p-6 bg-white border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Order ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Items</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{order._id?.substring(0, 8)}</td>
                  <td className="px-4 py-3 text-gray-600">{order.customerName}</td>
                  <td className="px-4 py-3 text-gray-600">{order.items.length} items</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">₹{order.totalAmount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "in-transit" || order.status === "in transit"
                            ? "bg-blue-100 text-blue-700"
                            : order.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{order.createdAt}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button
                      onClick={() => handleViewOrder(order)}
                      variant="outline"
                      size="sm"
                      className="text-gray-600 bg-transparent"
                    >
                      View
                    </Button>
                    {(order.deliveryStatus === "arrived" || order.deliveryStatus === "reached") && (
                      <Button
                        onClick={() => handleUpdateOrder(order)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Update Status
                      </Button>
                    )}
                    {order.status !== "delivered" && order.deliveryStatus !== "arrived" && order.deliveryStatus !== "reached" && (
                    <Button
                      onClick={() => handleUpdateOrder(order)}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 bg-transparent"
                    >
                      Update
                    </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Details</h2>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-gray-600 text-sm">Order ID</p>
                <p className="font-semibold text-gray-900">{selectedOrder._id?.substring(0, 8)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Customer Name</p>
                <p className="font-semibold text-gray-900">{selectedOrder.customerName}</p>
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
                <p className="text-gray-600 text-sm">Items</p>
                <ul className="text-gray-900 text-sm mt-1">
                  {selectedOrder.items.map((item, idx) => (
                    <li key={idx}>• {typeof item === "string" ? item : item.productName || "Unknown Item"}</li>
                  ))}
                </ul>
              </div>
            </div>
            <Button onClick={() => setShowViewModal(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Close
            </Button>
          </Card>
        </div>
      )}

      {showUpdateModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Update Order Status</h2>
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-600 text-sm mb-2">Order ID</p>
                <p className="font-semibold text-gray-900">{selectedOrder._id?.substring(0, 8)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                <select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="in-transit">In Transit</option>
                  <option value="arrived">Arrived</option>
                  {(selectedOrder.deliveryStatus === "arrived" || selectedOrder.deliveryStatus === "reached") && (
                  <option value="delivered">Delivered</option>
                  )}
                  <option value="cancelled">Cancelled</option>
                </select>
                {(selectedOrder.deliveryStatus === "arrived" || selectedOrder.deliveryStatus === "reached") && (
                  <p className="text-xs text-green-600 mt-1">
                    Delivery agent has reached the customer. You can mark this as delivered.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleConfirmUpdate} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                Update
              </Button>
              <Button onClick={() => setShowUpdateModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
