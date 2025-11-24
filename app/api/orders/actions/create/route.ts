import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db"
import type { Order } from "@/lib/models/Order"

export async function POST(request: NextRequest) {
  try {
    const order: Order = await request.json()

    const ordersCollection = await getCollection("orders")

    const result = await ordersCollection.insertOne({
      ...order,
      status: "pending",
      paymentStatus: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ _id: result.insertedId, ...order }, { status: 201 })
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
