import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { orderId, deliveryAgentId, agentName, customerName, pickupLocation, deliveryLocation } = await request.json()

    // Create delivery record
    const deliveriesCollection = await getCollection("deliveries")
    const deliveryResult = await deliveriesCollection.insertOne({
      orderId: new ObjectId(orderId),
      deliveryAgentId: new ObjectId(deliveryAgentId),
      agentName,
      customerName,
      status: "assigned",
      pickupLocation,
      deliveryLocation,
      eta: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Update order with deliveryId and status
    const ordersCollection = await getCollection("orders")
    await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          deliveryId: deliveryResult.insertedId.toString(),
          status: "dispatched",
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({ _id: deliveryResult.insertedId, orderId, deliveryAgentId }, { status: 201 })
  } catch (error) {
    console.error("Error assigning delivery:", error)
    return NextResponse.json({ error: "Failed to assign delivery" }, { status: 500 })
  }
}
