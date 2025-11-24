import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { memoryStorage } from "@/lib/memory-storage"
import { ObjectId } from "mongodb"
import type { Order } from "@/lib/models/Order"

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const { id } = params
    const updateData: Partial<Order> = await request.json()

    console.log("Updating order:", id, "with data:", updateData)

    // Try MongoDB first
    try {
      const { db } = await connectToDatabase()
      const ordersCollection = db.collection("orders")

      const result = await ordersCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...updateData,
            updatedAt: new Date(),
            ...(updateData.status === "delivered" && { deliveryDate: new Date() }),
          },
        },
      )

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      // If order status is updated to "delivered", also update the delivery status
      if (updateData.status === "delivered") {
        try {
          const deliveriesCollection = db.collection("deliveries")
          await deliveriesCollection.updateOne(
            { orderId: new ObjectId(id) },
            {
              $set: {
                status: "delivered",
                deliveredAt: new Date(),
                updatedAt: new Date(),
              },
            },
          )
          console.log("Delivery status also updated to delivered")
        } catch (deliveryError) {
          console.error("Failed to update delivery status:", deliveryError)
          // Don't fail the request if delivery update fails
        }
      }

      console.log("Order updated successfully in MongoDB")
      return NextResponse.json({ success: true })
    } catch (dbError) {
      console.log("MongoDB failed, using memory storage:", dbError)
      // Fallback to memory storage
      const orders = memoryStorage.getOrders()
      const orderIndex = orders.findIndex((o) => o._id === id)

      if (orderIndex === -1) {
        console.log("Order not found in memory storage")
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      const updatedOrder = memoryStorage.updateOrder(id, updateData)

      if (!updatedOrder) {
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
      }

      console.log("Order updated successfully in memory storage:", updatedOrder)
      return NextResponse.json({ success: true, order: updatedOrder })
    }
  } catch (error) {
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const { id } = params

    // Try MongoDB first
    try {
      const { db } = await connectToDatabase()
      const ordersCollection = db.collection("orders")

      const result = await ordersCollection.deleteOne({ _id: new ObjectId(id) })

      if (result.deletedCount === 0) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      return NextResponse.json({ success: true })
    } catch (dbError) {
      // Fallback to memory storage
      const success = memoryStorage.deleteOrder(id)

      if (!success) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("Error deleting order:", error)
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 })
  }
}
