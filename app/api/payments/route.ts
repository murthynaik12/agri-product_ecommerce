import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db"
import { ObjectId } from "mongodb"
import type { Payment } from "@/lib/models/Payment"

export async function POST(request: NextRequest) {
  try {
    const payment: Payment = await request.json()

    const paymentsCollection = await getCollection("payments")

    const result = await paymentsCollection.insertOne({
      ...payment,
      orderId: new ObjectId(payment.orderId),
      customerId: new ObjectId(payment.customerId),
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ _id: result.insertedId, ...payment }, { status: 201 })
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { paymentId, status, transactionId } = await request.json()

    const paymentsCollection = await getCollection("payments")

    const payment = await paymentsCollection.findOneAndUpdate(
      { _id: new ObjectId(paymentId) },
      {
        $set: {
          status,
          transactionId: transactionId || undefined,
          paidAt: status === "paid" ? new Date() : undefined,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    )

    if (!payment.value) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Update order payment status
    if (status === "paid") {
      const ordersCollection = await getCollection("orders")
      await ordersCollection.updateOne(
        { _id: new ObjectId(payment.value.orderId) },
        {
          $set: {
            paymentStatus: "paid",
            updatedAt: new Date(),
          },
        },
      )
    }

    return NextResponse.json({ success: true, message: "Payment updated" })
  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 })
  }
}
