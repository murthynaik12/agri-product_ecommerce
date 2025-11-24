import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { memoryStorage } from "@/lib/memory-storage"
import type { Order } from "@/lib/models/Order"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")
    const farmerId = searchParams.get("farmerId")
    const status = searchParams.get("status")

    console.log("GET /api/orders - Query params:", { customerId, farmerId, status })

    // Try MongoDB first
    try {
      const { db } = await connectToDatabase()
      const ordersCollection = db.collection("orders")

      const query: any = {}
      if (customerId) query.customerId = customerId
      if (status) query.status = status

      // For farmerId, we need to check both order-level farmerId and item-level farmerIds
      if (farmerId) {
        // Convert farmerId to ObjectId if valid, otherwise use as string
        const { ObjectId } = await import("mongodb")
        const isObjectId = ObjectId.isValid(farmerId)
        const farmerIdObj = isObjectId ? new ObjectId(farmerId) : farmerId
        const farmerIdStr = farmerId.toString()
        
        query.$or = [
          { farmerId: farmerIdObj },
          { farmerId: farmerIdStr },
          { "items.farmerId": farmerIdObj },
          { "items.farmerId": farmerIdStr },
        ]
      }

      console.log("MongoDB query:", JSON.stringify(query, null, 2))
      const orders = await ordersCollection.find(query).toArray()
      console.log("Found orders in MongoDB:", orders.length)
      
      // If farmerId was provided, also filter in-memory to ensure we only get orders with items from this farmer
      let filteredOrders = orders
      if (farmerId) {
        const farmerIdStr = farmerId.toString()
        filteredOrders = orders.filter((order: any) => {
          // Check if order has farmerId matching (handle both ObjectId and string)
          const orderFarmerId = order.farmerId?.toString() || order.farmerId
          if (orderFarmerId === farmerIdStr || orderFarmerId === farmerId) return true
          
          // Check if any item belongs to this farmer
          if (order.items && Array.isArray(order.items)) {
            return order.items.some((item: any) => {
              const itemFarmerId = item.farmerId?.toString() || item.farmerId
              return itemFarmerId === farmerIdStr || itemFarmerId === farmerId
            })
          }
          return false
        })
        console.log("Filtered orders for farmer:", filteredOrders.length)
      }
      
      return NextResponse.json(filteredOrders)
    } catch (dbError) {
      console.error("MongoDB error, falling back to memory:", dbError)
      // Fallback to memory storage
      let orders = memoryStorage.getOrders()

      if (customerId) {
        orders = orders.filter((o) => o.customerId === customerId)
      }
      if (farmerId) {
        // Filter by order-level farmerId OR item-level farmerIds
        orders = orders.filter((o) => {
          if (o.farmerId === farmerId) return true
          if (o.items && Array.isArray(o.items)) {
            return o.items.some((item: any) => item.farmerId === farmerId)
          }
          return false
        })
      }
      if (status) {
        orders = orders.filter((o) => o.status === status)
      }

      return NextResponse.json(orders)
    }
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const order: Order = await request.json()

    console.log("POST /api/orders - Creating order:", order)

    // Try MongoDB first
    try {
      const { db } = await connectToDatabase()
      const ordersCollection = db.collection("orders")

      // Remove _id if it exists (MongoDB will generate it)
      const orderData: any = { ...order }
      delete orderData._id

      const result = await ordersCollection.insertOne({
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      console.log("Order created in MongoDB with ID:", result.insertedId)
      return NextResponse.json({ _id: result.insertedId, ...order }, { status: 201 })
    } catch (dbError) {
      console.error("MongoDB error, falling back to memory:", dbError)
      // Fallback to memory storage
      const newOrder = memoryStorage.addOrder(order)
      console.log("Order created in memory storage:", newOrder)
      return NextResponse.json(newOrder, { status: 201 })
    }
  } catch (error) {
    console.error("Error creating order:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
