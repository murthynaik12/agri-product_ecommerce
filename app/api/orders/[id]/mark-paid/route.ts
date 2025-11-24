import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, isMongoDBAvailable } from "@/lib/mongodb"
import { getCollection } from "@/lib/db"
import { ObjectId } from "mongodb"

async function createNotification(userId: string, title: string, message: string, type: string = "info") {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, title, message, type }),
    })
    if (!response.ok) {
      console.error("Failed to create notification:", await response.text())
    }
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    // Try native MongoDB client first
    if (isMongoDBAvailable()) {
      try {
        const { db } = await connectToDatabase()
        const ordersCollection = db.collection("orders")

        // Update order status to "paid"
        const result = await ordersCollection.findOneAndUpdate(
          { _id: new ObjectId(id) },
          {
            $set: {
              status: "paid",
              paymentStatus: "paid",
              updatedAt: new Date(),
            },
          },
          { returnDocument: "after" },
        )

        if (!result.value) {
          return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }

        const order = result.value

        // Notify all admins
        try {
          const usersCollection = db.collection("users")
          const admins = await usersCollection.find({ role: "admin" }).toArray()

          const orderIdStr = id.substring(0, 8)
          const customerName = order.customerName || "Customer"

          for (const admin of admins) {
            await createNotification(
              admin._id.toString(),
              "New Order Ready for Delivery",
              `Order ${orderIdStr} from ${customerName} has been paid and is ready for delivery agent assignment.`,
              "info",
            )
          }
        } catch (error) {
          console.error("Error notifying admins:", error)
        }

        // Notify customer
        if (order.customerId) {
          await createNotification(
            order.customerId.toString(),
            "Payment Confirmed",
            `Your order (${id.substring(0, 8)}) payment has been confirmed. Delivery agent will be assigned soon.`,
            "success",
          )
        }

        return NextResponse.json({ success: true, message: "Order marked as paid" })
      } catch (dbError: any) {
        console.error("Native MongoDB error:", dbError)
        // Fall through
      }
    }

    // Fallback
    try {
      const ordersCollection = await getCollection("orders")

      const result = await ordersCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: "paid",
            paymentStatus: "paid",
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" },
      )

      if (!result.value) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      const order = result.value

      // Notify all admins
      try {
        const usersCollection = await getCollection("users")
        const admins = await usersCollection.find({ role: "admin" }).toArray()

        const orderIdStr = id.substring(0, 8)
        const customerName = order.customerName || "Customer"

        for (const admin of admins) {
          await createNotification(
            admin._id.toString(),
            "New Order Ready for Delivery",
            `Order ${orderIdStr} from ${customerName} has been paid and is ready for delivery agent assignment.`,
            "info",
          )
        }
      } catch (error) {
        console.error("Error notifying admins:", error)
      }

      // Notify customer
      if (order.customerId) {
        await createNotification(
          order.customerId.toString(),
          "Payment Confirmed",
          `Your order (${id.substring(0, 8)}) payment has been confirmed. Delivery agent will be assigned soon.`,
          "success",
        )
      }

      return NextResponse.json({ success: true, message: "Order marked as paid" })
    } catch (error: any) {
      console.error("Failed to mark order as paid:", error)
      return NextResponse.json(
        { error: error.message || "Failed to mark order as paid" },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Failed to mark order as paid:", error)
    return NextResponse.json(
      { error: error.message || "Failed to mark order as paid" },
      { status: 500 },
    )
  }
}

