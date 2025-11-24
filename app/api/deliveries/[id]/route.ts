import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db"
import { ObjectId } from "mongodb"
import type { Delivery } from "@/lib/models/Delivery"
import { connectToDatabase, isMongoDBAvailable } from "@/lib/mongodb"

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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const delivery: any = await request.json()
    console.log("Updating delivery:", id, delivery)

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid delivery ID" }, { status: 400 })
    }

    // Try native MongoDB client first
    if (isMongoDBAvailable()) {
      try {
        const { db } = await connectToDatabase()
        const deliveriesCollection = db.collection("deliveries")

        const updateFields: any = {
          updatedAt: new Date(),
        }

        // Handle both agentId (from frontend) and deliveryAgentId (from model)
        if (delivery.agentId || delivery.deliveryAgentId) {
          const agentId = delivery.agentId || delivery.deliveryAgentId
          // Convert agentId to ObjectId if it's a valid ObjectId string
          if (ObjectId.isValid(agentId)) {
            updateFields.agentId = new ObjectId(agentId)
            updateFields.deliveryAgentId = new ObjectId(agentId)
          } else {
            updateFields.agentId = agentId
            updateFields.deliveryAgentId = agentId
          }
        }
        if (delivery.agentName) updateFields.agentName = delivery.agentName
        if (delivery.status) updateFields.status = delivery.status
        // Handle both location (from frontend) and deliveryLocation (from model)
        if (delivery.location) updateFields.location = delivery.location
        if (delivery.deliveryLocation) updateFields.deliveryLocation = delivery.deliveryLocation
        if (delivery.pickupLocation) updateFields.pickupLocation = delivery.pickupLocation
        if (delivery.currentLocation) updateFields.currentLocation = delivery.currentLocation
        if (delivery.eta) updateFields.eta = delivery.eta instanceof Date ? delivery.eta : new Date(delivery.eta)

        const result = await deliveriesCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updateFields },
        )

        if (result.matchedCount === 0) {
          console.log("Delivery not found:", id)
          return NextResponse.json({ error: "Delivery not found" }, { status: 404 })
        }

        const updatedDelivery = await deliveriesCollection.findOne({ _id: new ObjectId(id) })

        // Create notifications if delivery is assigned to an agent
        if (delivery.status === "assigned" && updatedDelivery && delivery.agentId) {
          try {
            const ordersCollection = db.collection("orders")
            const orderId = updatedDelivery.orderId
            
            if (orderId) {
              const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) })
              
              if (order) {
                // Update order status to dispatched
                await ordersCollection.updateOne(
                  { _id: new ObjectId(orderId) },
                  {
                    $set: {
                      status: "dispatched",
                      updatedAt: new Date(),
                    },
                  },
                )

                const orderIdStr = orderId.toString().substring(0, 8)
                const customerName = updatedDelivery.customerName || order.customerName || "Customer"
                const agentName = updatedDelivery.agentName || "Delivery Agent"

                // Notify Delivery Agent
                if (delivery.agentId) {
                  await createNotification(
                    delivery.agentId.toString(),
                    "New Delivery Assigned",
                    `You have been assigned to deliver order ${orderIdStr} to ${customerName}. Please accept the delivery.`,
                    "info",
                  )
                }

                // Notify Customer
                if (order.customerId) {
                  await createNotification(
                    order.customerId.toString(),
                    "Delivery Agent Assigned",
                    `Your order (${orderIdStr}) has been assigned to ${agentName}. Delivery will begin soon.`,
                    "info",
                  )
                }

                console.log("Notifications created for delivery assignment")
              }
            }
          } catch (notifError) {
            console.error("Error creating assignment notifications:", notifError)
          }
        }

        // Create notifications if delivery is marked as delivered
        if (delivery.status === "delivered" && updatedDelivery) {
          try {
            const ordersCollection = db.collection("orders")
            const orderId = updatedDelivery.orderId
            
            if (orderId) {
              const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) })
              
              if (order) {
                // Update order status
                await ordersCollection.updateOne(
                  { _id: new ObjectId(orderId) },
                  {
                    $set: {
                      status: "delivered",
                      deliveryDate: new Date(),
                      updatedAt: new Date(),
                    },
                  },
                )

                // Create notifications
                const orderIdStr = orderId.toString().substring(0, 8)
                const customerName = updatedDelivery.customerName || order.customerName || "Customer"
                const agentName = updatedDelivery.agentName || "Delivery Agent"

                // Notify Customer
                if (order.customerId) {
                  await createNotification(
                    order.customerId.toString(),
                    "Order Delivered! 🎉",
                    `Your order (${orderIdStr}) has been delivered successfully by ${agentName}. Thank you for your purchase!`,
                    "success",
                  )
                }

                // Notify Farmer
                if (order.farmerId) {
                  await createNotification(
                    order.farmerId.toString(),
                    "Product Delivered Successfully",
                    `Your product has been delivered successfully to ${customerName} for order ${orderIdStr}.`,
                    "success",
                  )
                }

                // Notify all Admins
                const usersCollection = db.collection("users")
                const admins = await usersCollection.find({ role: "admin" }).toArray()
                for (const admin of admins) {
                  await createNotification(
                    admin._id.toString(),
                    "Delivery Completed",
                    `Order ${orderIdStr} has been delivered to ${customerName} by ${agentName}.`,
                    "info",
                  )
                }

                console.log("Notifications created for delivery completion")
              }
            }
          } catch (notifError) {
            console.error("Error creating notifications:", notifError)
            // Don't fail the request if notifications fail
          }
        }

        console.log("Delivery updated successfully:", updatedDelivery)
        return NextResponse.json(updatedDelivery)
      } catch (dbError: any) {
        console.error("Native MongoDB update error:", dbError)
        // Fall through to try getCollection
      }
    }

    // Fallback to getCollection
    try {
    const deliveriesCollection = await getCollection("deliveries")

    const updateFields: any = {
      updatedAt: new Date(),
    }

      // Handle both agentId (from frontend) and deliveryAgentId (from model)
      if (delivery.agentId || delivery.deliveryAgentId) {
        const agentId = delivery.agentId || delivery.deliveryAgentId
        if (ObjectId.isValid(agentId)) {
          updateFields.agentId = new ObjectId(agentId)
          updateFields.deliveryAgentId = new ObjectId(agentId)
        } else {
          updateFields.agentId = agentId
          updateFields.deliveryAgentId = agentId
        }
    }
    if (delivery.agentName) updateFields.agentName = delivery.agentName
    if (delivery.status) updateFields.status = delivery.status
      // Handle both location (from frontend) and deliveryLocation (from model)
    if (delivery.location) updateFields.location = delivery.location
      if (delivery.deliveryLocation) updateFields.deliveryLocation = delivery.deliveryLocation
      if (delivery.pickupLocation) updateFields.pickupLocation = delivery.pickupLocation
    if (delivery.currentLocation) updateFields.currentLocation = delivery.currentLocation
      if (delivery.eta) updateFields.eta = delivery.eta instanceof Date ? delivery.eta : new Date(delivery.eta)

    const result = await deliveriesCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateFields })

    if (result.matchedCount === 0) {
        console.log("Delivery not found:", id)
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 })
    }

    const updatedDelivery = await deliveriesCollection.findOne({ _id: new ObjectId(id) })

      // Create notifications if delivery is assigned to an agent
      if (delivery.status === "assigned" && updatedDelivery && delivery.agentId) {
        try {
          const ordersCollection = await getCollection("orders")
          const orderId = updatedDelivery.orderId
          
          if (orderId) {
            const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) })
            
            if (order) {
              // Update order status to dispatched
              await ordersCollection.updateOne(
                { _id: new ObjectId(orderId) },
                {
                  $set: {
                    status: "dispatched",
                    updatedAt: new Date(),
                  },
                },
              )

              const orderIdStr = orderId.toString().substring(0, 8)
              const customerName = updatedDelivery.customerName || order.customerName || "Customer"
              const agentName = updatedDelivery.agentName || "Delivery Agent"

              // Notify Delivery Agent
              if (delivery.agentId) {
                await createNotification(
                  delivery.agentId.toString(),
                  "New Delivery Assigned",
                  `You have been assigned to deliver order ${orderIdStr} to ${customerName}. Please accept the delivery.`,
                  "info",
                )
              }

              // Notify Customer
              if (order.customerId) {
                await createNotification(
                  order.customerId.toString(),
                  "Delivery Agent Assigned",
                  `Your order (${orderIdStr}) has been assigned to ${agentName}. Delivery will begin soon.`,
                  "info",
                )
              }

              console.log("Notifications created for delivery assignment")
            }
          }
        } catch (notifError) {
          console.error("Error creating assignment notifications:", notifError)
        }
      }

      // Create notifications if delivery is marked as delivered
      if (delivery.status === "delivered" && updatedDelivery) {
        try {
          const ordersCollection = await getCollection("orders")
          const orderId = updatedDelivery.orderId
          
          if (orderId) {
            const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) })
            
            if (order) {
              // Update order status
              await ordersCollection.updateOne(
                { _id: new ObjectId(orderId) },
                {
                  $set: {
                    status: "delivered",
                    deliveryDate: new Date(),
                    updatedAt: new Date(),
                  },
                },
              )

              // Create notifications
              const orderIdStr = orderId.toString().substring(0, 8)
              const customerName = updatedDelivery.customerName || order.customerName || "Customer"
              const agentName = updatedDelivery.agentName || "Delivery Agent"

              // Notify Customer
              if (order.customerId) {
                await createNotification(
                  order.customerId.toString(),
                  "Order Delivered! 🎉",
                  `Your order (${orderIdStr}) has been delivered successfully by ${agentName}. Thank you for your purchase!`,
                  "success",
                )
              }

              // Notify Farmer
              if (order.farmerId) {
                await createNotification(
                  order.farmerId.toString(),
                  "Order Delivered to Customer",
                  `Order ${orderIdStr} has been delivered to ${customerName}. Payment will be processed soon.`,
                  "info",
                )
              }

              // Notify all Admins
              const usersCollection = await getCollection("users")
              const admins = await usersCollection.find({ role: "admin" }).toArray()
              for (const admin of admins) {
                await createNotification(
                  admin._id.toString(),
                  "Delivery Completed",
                  `Order ${orderIdStr} has been delivered to ${customerName} by ${agentName}.`,
                  "info",
                )
              }

              console.log("Notifications created for delivery completion")
            }
          }
        } catch (notifError) {
          console.error("Error creating notifications:", notifError)
          // Don't fail the request if notifications fail
        }
      }

      console.log("Delivery updated successfully:", updatedDelivery)
    return NextResponse.json(updatedDelivery)
    } catch (error: any) {
      console.error("Failed to update delivery:", error)
      return NextResponse.json(
        { error: error.message || "Failed to update delivery" },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Failed to update delivery:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update delivery" },
      { status: 500 },
    )
  }
}
