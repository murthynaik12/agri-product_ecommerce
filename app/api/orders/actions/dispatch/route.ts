import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function PATCH(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    const ordersCollection = await getCollection("orders")

    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          status: "dispatched",
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Order ready for dispatch" })
  } catch (error) {
    console.error("Error dispatching order:", error)
    return NextResponse.json({ error: "Failed to dispatch order" }, { status: 500 })
  }
}
