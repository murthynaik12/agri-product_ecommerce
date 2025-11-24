"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { fetchOrders } from "@/lib/api-client"
import { fetchDeliveries } from "@/lib/api-client"

export default function Reports() {
  const [orders, setOrders] = useState<any[]>([])
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [ordersData, deliveriesData] = await Promise.all([
        fetchOrders(),
        fetchDeliveries(),
      ])
      setOrders(ordersData || [])
      setDeliveries(deliveriesData || [])
    } catch (error) {
      console.error("Failed to load reports data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate sales metrics
  const paidOrders = orders.filter((o) => o.paymentStatus === "paid" || o.status === "delivered")
  const totalSales = paidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
  const totalTransactions = paidOrders.length
  const avgOrderValue = totalTransactions > 0 ? Math.round(totalSales / totalTransactions) : 0

  // Calculate delivery metrics
  const deliveredDeliveries = deliveries.filter((d) => d.status === "delivered")
  const totalDeliveries = deliveries.length
  const failedDeliveries = deliveries.filter((d) => d.status === "failed" || d.status === "cancelled").length
  
  // Calculate on-time deliveries (delivered within estimated time)
  const onTimeDeliveries = deliveredDeliveries.filter((d) => {
    if (!d.deliveryDate || !d.estimatedArrival) return false
    const deliveryDate = new Date(d.deliveryDate)
    const estimatedDate = new Date(d.estimatedArrival)
    return deliveryDate <= estimatedDate
  }).length
  const onTimePercentage = deliveredDeliveries.length > 0 
    ? Math.round((onTimeDeliveries / deliveredDeliveries.length) * 100) 
    : 0

  // Calculate average delivery time
  const deliveriesWithTime = deliveredDeliveries.filter((d) => {
    if (!d.createdAt || !d.deliveryDate) return false
    return true
  })
  const avgDeliveryTimeDays = deliveriesWithTime.length > 0
    ? deliveriesWithTime.reduce((sum, d) => {
        const created = new Date(d.createdAt)
        const delivered = new Date(d.deliveryDate)
        const days = (delivered.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        return sum + days
      }, 0) / deliveriesWithTime.length
    : 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="text-center py-8">Loading reports...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Report</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Sales</span>
              <span className="font-semibold">₹{totalSales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Order Value</span>
              <span className="font-semibold">₹{avgOrderValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Transactions</span>
              <span className="font-semibold">{totalTransactions}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Report</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">On Time Deliveries</span>
              <span className="font-semibold">{onTimePercentage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Delivery Time</span>
              <span className="font-semibold">{avgDeliveryTimeDays.toFixed(1)} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Failed Deliveries</span>
              <span className="font-semibold">{failedDeliveries}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
