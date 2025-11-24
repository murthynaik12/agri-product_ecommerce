import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db"
import { connectToDatabase, isMongoDBAvailable } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

async function createNotification(userId: string, title: string, message: string, type: string = "info") {
  try {
    console.log("Creating notification:", { userId, title, message, type })
    
    const notificationData: any = {
      title,
      message,
      type,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Convert userId to ObjectId if valid, otherwise keep as string
    if (ObjectId.isValid(userId)) {
      notificationData.userId = new ObjectId(userId)
    } else {
      notificationData.userId = userId
    }

    if (isMongoDBAvailable()) {
      try {
        const { db } = await connectToDatabase()
        const notificationsCollection = db.collection("notifications")

        const result = await notificationsCollection.insertOne(notificationData)
        console.log("Notification created (native) for user:", userId, "Notification ID:", result.insertedId)
        return result.insertedId
      } catch (error) {
        console.error("Failed to create notification (native):", error)
        // Fall through to try fallback
      }
    }
    
    // Fallback
    try {
      const notificationsCollection = await getCollection("notifications")
      const result = await notificationsCollection.insertOne(notificationData)
      console.log("Notification created (fallback) for user:", userId, "Notification ID:", result.insertedId)
      return result.insertedId
    } catch (error) {
      console.error("Failed to create notification (fallback):", error)
    }
  } catch (error) {
    console.error("Error creating notification:", error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { deliveryId, status, currentLat, currentLng, remarks } = await request.json()

    if (!deliveryId) {
      return NextResponse.json({ error: "Delivery ID is required" }, { status: 400 })
    }

    if (!ObjectId.isValid(deliveryId)) {
      return NextResponse.json({ error: "Invalid delivery ID format" }, { status: 400 })
    }

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    console.log("Updating delivery status:", { deliveryId, status })

    const deliveriesCollection = await getCollection("deliveries")

    // Update delivery status
    const updateData: any = {
      status,
      updatedAt: new Date(),
    }

    if (currentLat && currentLng) {
      updateData.currentLat = currentLat
      updateData.currentLng = currentLng
    }

    if (remarks) {
      updateData.remarks = remarks
    }

    if (status === "delivered") {
      updateData.deliveredAt = new Date()
    }

    const delivery = await deliveriesCollection.findOneAndUpdate(
      { _id: new ObjectId(deliveryId) },
      { $set: updateData },
      { returnDocument: "after" },
    )

    if (!delivery || !delivery.value) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 })
    }

    const deliveryData = delivery.value

    // Update order status based on delivery status
    const orderId = deliveryData.orderId
    
    if (orderId) {
      // Convert orderId to ObjectId if it's a string
      const orderIdObj = ObjectId.isValid(orderId) ? new ObjectId(orderId) : orderId
      console.log("Updating order status for orderId:", orderId, "ObjectId:", orderIdObj)
      
      // Try native MongoDB client first
      if (isMongoDBAvailable()) {
        try {
          const { db } = await connectToDatabase()
          const ordersCollection = db.collection("orders")
          
          const order = await ordersCollection.findOne({ _id: orderIdObj })
          
          if (order) {
            let orderStatus = order.status
            
            // Map delivery status to order status
            if (status === "accepted") {
              orderStatus = "accepted"
            } else if (status === "picked") {
              orderStatus = "dispatched"
            } else if (status === "in-transit" || status === "on-the-way") {
              orderStatus = "in-transit"
            } else if (status === "arrived") {
              orderStatus = "arrived"
            } else if (status === "delivered") {
              orderStatus = "delivered"
            }
            
            // Update order status if it changed
            if (orderStatus !== order.status) {
              console.log(`Updating order ${orderId} status from ${order.status} to ${orderStatus}`)
              const updateResult = await ordersCollection.updateOne(
                { _id: orderIdObj },
                {
                  $set: {
                    status: orderStatus,
                    updatedAt: new Date(),
                    ...(status === "delivered" && { deliveryDate: new Date() }),
                  },
                },
              )
              console.log(`Order update result:`, updateResult)
              
              // Verify the update
              const updatedOrder = await ordersCollection.findOne({ _id: orderIdObj })
              console.log(`Order status after update:`, updatedOrder?.status)
            } else {
              console.log(`Order status unchanged: ${orderStatus}`)
            }
          } else {
            console.error(`Order not found: ${orderId}`)
          }
        } catch (dbError: any) {
          console.error("Native MongoDB order update error:", dbError)
          // Fall through to try getCollection
        }
      }
      
      // Fallback to getCollection
      try {
      const ordersCollection = await getCollection("orders")
        const order = await ordersCollection.findOne({ _id: orderIdObj })
        
        if (order) {
          let orderStatus = order.status
          
          // Map delivery status to order status
          if (status === "accepted") {
            orderStatus = "accepted"
          } else if (status === "picked") {
            orderStatus = "dispatched"
          } else if (status === "in-transit" || status === "on-the-way") {
            orderStatus = "in-transit"
          } else if (status === "arrived") {
            orderStatus = "arrived"
          } else if (status === "delivered") {
            orderStatus = "delivered"
          }
          
          // Update order status if it changed
          if (orderStatus !== order.status) {
            console.log(`Updating order ${orderId} status from ${order.status} to ${orderStatus} (fallback)`)
      await ordersCollection.updateOne(
              { _id: orderIdObj },
        {
          $set: {
                  status: orderStatus,
            updatedAt: new Date(),
                  ...(status === "delivered" && { deliveryDate: new Date() }),
          },
        },
      )
          }
        }
      } catch (fallbackError: any) {
        console.error("Fallback order update error:", fallbackError)
      }
      
      // Get the order for notifications (use the one we found above)
      let order: any = null
      if (isMongoDBAvailable()) {
        try {
          const { db } = await connectToDatabase()
          const ordersCollection = db.collection("orders")
          order = await ordersCollection.findOne({ _id: orderIdObj })
        } catch {
          const ordersCollection = await getCollection("orders")
          order = await ordersCollection.findOne({ _id: orderIdObj })
        }
      } else {
        const ordersCollection = await getCollection("orders")
        order = await ordersCollection.findOne({ _id: orderIdObj })
      }
      
      if (order) {

        const orderIdStr = orderId.toString().substring(0, 8)
        const customerName = deliveryData.customerName || order.customerName || "Customer"
        const agentName = deliveryData.agentName || "Delivery Agent"

        // Create notifications when delivery agent accepts order
        if (status === "accepted") {
          // Notify Customer
          if (order.customerId) {
            await createNotification(
              order.customerId.toString(),
              "Delivery Agent Accepted Order",
              `Delivery agent ${agentName} has accepted your order (${orderIdStr}). Your order will be picked up soon.`,
              "info",
            )
          }
          console.log("Notifications created for delivery agent acceptance")
        }

        // Create notifications when delivery agent picks up from farmer
        if (status === "picked") {
          // Notify Farmer
          if (order.farmerId) {
            await createNotification(
              order.farmerId.toString(),
              "Product Picked Up",
              `Your product for order ${orderIdStr} has been picked up by delivery agent ${agentName}.`,
              "info",
            )
          }
          console.log("Notifications created for product pickup")
        }

        // Create notifications when delivery agent reaches customer
        if (status === "arrived") {
          // Notify Customer
          if (order.customerId) {
            await createNotification(
              order.customerId.toString(),
              "Delivery Agent is Near Your Location",
              `Delivery agent ${agentName} is near your location with order (${orderIdStr}). Please be ready to receive your delivery.`,
              "info",
            )
          }

          console.log("Notifications created for delivery agent arrival")
        }

        // Create notifications if delivered
        if (status === "delivered") {
          // Notification for Customer
          if (order.customerId) {
            const customerMessage = `Your order (${orderIdStr}) has been delivered successfully by ${agentName}. Thank you for your purchase!`
            await createNotification(
              order.customerId.toString(),
              "Order Delivered! 🎉",
              customerMessage,
              "success",
            )
          }

          // Notification for Farmer
          if (order.farmerId) {
            await createNotification(
              order.farmerId.toString(),
              "Product Delivered Successfully",
              `Your product has been delivered successfully to ${customerName} for order ${orderIdStr}.`,
              "success",
            )
          }

          // Notification for all Admins
          try {
            let usersCollection
            if (isMongoDBAvailable()) {
              const { db } = await connectToDatabase()
              usersCollection = db.collection("users")
            } else {
              usersCollection = await getCollection("users")
            }
            const admins = await usersCollection.find({ role: "admin" }).toArray()
            
            for (const admin of admins) {
              const adminMessage = `Order ${orderIdStr} has been delivered to ${customerName} by ${agentName}.`
              await createNotification(
                admin._id.toString(),
                "Delivery Completed",
                adminMessage,
                "info",
              )
            }
          } catch (error) {
            console.error("Error notifying admins:", error)
          }

          console.log("Notifications created for delivery completion")
        }
      }
    }

    return NextResponse.json({ success: true, message: "Delivery status updated" })
  } catch (error) {
    console.error("Error updating delivery status:", error)
    return NextResponse.json({ error: "Failed to update delivery status" }, { status: 500 })
  }
}
