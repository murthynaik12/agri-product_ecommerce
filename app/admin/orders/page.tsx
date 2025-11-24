"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchOrders } from "@/lib/api-client"

interface Order {
  _id?: string
  id?: string
  customerId: string
  customerName: string
  items: any[]
  totalAmount: number
  status: string
  paymentStatus: string
  orderDate?: string
  createdAt?: string
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const data = await fetchOrders()
      const mappedOrders = data.map((o: any) => ({
        _id: o._id,
        id: o._id,
        customerId: o.customerId,
        customerName: o.customerName,
        items: o.items || [],
        totalAmount: o.totalAmount,
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.orderDate
          ? new Date(o.orderDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      }))
      setOrders(mappedOrders)
    } catch (error) {
      console.error("Failed to load orders:", error)
      alert("Failed to load orders")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading orders...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>

      <Card className="p-6 bg-white border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Order ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Payment</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {order.id?.substring(0, 8) || order._id?.substring(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{order.customerName}</td>
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
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{order.createdAt}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-600 bg-transparent"
                      onClick={() => {
                        setSelectedOrder(order)
                        setShowViewModal(true)
                      }}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 bg-white max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Order Details</h2>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-medium">{selectedOrder.id?.substring(0, 8) || selectedOrder._id?.substring(0, 8)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{selectedOrder.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">₹{selectedOrder.totalAmount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{selectedOrder.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <p className="font-medium capitalize">{selectedOrder.paymentStatus}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{selectedOrder.createdAt}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Items</p>
                <div className="space-y-1">
                  {selectedOrder.items &&
                    selectedOrder.items.map((item: any, idx: number) => (
                      <p key={idx} className="text-sm">
                        {item.productName} x {item.quantity} = ₹{item.price * item.quantity}
                      </p>
                    ))}
                </div>
              </div>
            </div>
            <Button onClick={() => setShowViewModal(false)} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Close
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
