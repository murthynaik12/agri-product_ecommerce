import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db"
import type { Delivery } from "@/lib/models/Delivery"
import { connectToDatabase, isMongoDBAvailable } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agentId")
    const status = searchParams.get("status")

    console.log("Fetching deliveries with params:", { agentId, status })

    // Try native MongoDB client first
    if (isMongoDBAvailable()) {
      try {
        const { db } = await connectToDatabase()
        const deliveriesCollection = db.collection("deliveries")

        const query: any = {}
        if (agentId) {
          // Support both agentId and deliveryAgentId
          // Try to convert to ObjectId if valid, otherwise use as string
          const { ObjectId } = await import("mongodb")
          const isObjectId = ObjectId.isValid(agentId)
          const agentIdObj = isObjectId ? new ObjectId(agentId) : agentId
          const agentIdStr = agentId.toString()
          
          // Query with both ObjectId and string formats for maximum compatibility
          query.$or = [
            { agentId: agentIdObj },
            { deliveryAgentId: agentIdObj },
            { agentId: agentIdStr },
            { deliveryAgentId: agentIdStr },
          ]
        }
        if (status) query.status = status

        console.log("Deliveries query:", JSON.stringify(query, null, 2))
        const deliveries = await deliveriesCollection.find(query).toArray()
        console.log("Found deliveries (native):", deliveries.length, "for agentId:", agentId)

        // Convert ObjectIds to strings for JSON serialization
        const serializedDeliveries = deliveries.map((d: any) => ({
          ...d,
          _id: d._id?.toString() || d._id,
          orderId: d.orderId?.toString() || d.orderId || "",
          // Ensure both agentId and deliveryAgentId are available
          agentId: d.agentId?.toString() || d.agentId || d.deliveryAgentId?.toString() || d.deliveryAgentId || "",
          deliveryAgentId: d.deliveryAgentId?.toString() || d.deliveryAgentId || d.agentId?.toString() || d.agentId || "",
          // Map location fields
          location: d.location || d.deliveryLocation || d.pickupLocation || "N/A",
          deliveryLocation: d.deliveryLocation || d.location || "",
          pickupLocation: d.pickupLocation || "",
          // Ensure required fields have defaults
          customerName: d.customerName || "Unknown Customer",
          agentName: d.agentName || "Unassigned",
          status: d.status || "pending",
        }))

        return NextResponse.json(serializedDeliveries)
      } catch (dbError: any) {
        console.error("Native MongoDB error:", dbError)
        // Fall through to try getCollection
      }
    }

    // Fallback to getCollection
    try {
    const deliveriesCollection = await getCollection("deliveries")

    const query: any = {}
      if (agentId) {
        // Support both agentId and deliveryAgentId
        // Try to convert to ObjectId if valid, otherwise use as string
        const { ObjectId } = await import("mongodb")
        const isObjectId = ObjectId.isValid(agentId)
        const agentIdObj = isObjectId ? new ObjectId(agentId) : agentId
        const agentIdStr = agentId.toString()
        
        // Query with both ObjectId and string formats for maximum compatibility
        query.$or = [
          { agentId: agentIdObj },
          { deliveryAgentId: agentIdObj },
          { agentId: agentIdStr },
          { deliveryAgentId: agentIdStr },
        ]
      }
    if (status) query.status = status

    console.log("Deliveries query (fallback):", JSON.stringify(query, null, 2))
    const deliveries = await deliveriesCollection.find(query).toArray()
      console.log("Found deliveries (fallback):", deliveries.length, "for agentId:", agentId)

      // Convert ObjectIds to strings
      const serializedDeliveries = deliveries.map((d: any) => ({
        ...d,
        _id: d._id?.toString() || d._id,
        orderId: d.orderId?.toString() || d.orderId || "",
        // Ensure both agentId and deliveryAgentId are available
        agentId: d.agentId?.toString() || d.agentId || d.deliveryAgentId?.toString() || d.deliveryAgentId || "",
        deliveryAgentId: d.deliveryAgentId?.toString() || d.deliveryAgentId || d.agentId?.toString() || d.agentId || "",
        // Map location fields
        location: d.location || d.deliveryLocation || d.pickupLocation || "N/A",
        deliveryLocation: d.deliveryLocation || d.location || "",
        pickupLocation: d.pickupLocation || "",
        // Ensure required fields have defaults
        customerName: d.customerName || "Unknown Customer",
        agentName: d.agentName || "Unassigned",
        status: d.status || "pending",
      }))

      return NextResponse.json(serializedDeliveries)
    } catch (error: any) {
      console.error("Failed to fetch deliveries:", error)
      return NextResponse.json(
        { error: error.message || "Failed to fetch deliveries" },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Failed to fetch deliveries:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch deliveries" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const delivery: any = await request.json()
    console.log("Creating delivery:", delivery)

    // Try native MongoDB client first
    if (isMongoDBAvailable()) {
      try {
        const { db } = await connectToDatabase()
        const deliveriesCollection = db.collection("deliveries")

        const deliveryData: any = {
          ...delivery,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // Remove _id if it exists (MongoDB will generate it)
        delete deliveryData._id

        const result = await deliveriesCollection.insertOne(deliveryData)
        console.log("Delivery created with ID (native):", result.insertedId)
        return NextResponse.json({ _id: result.insertedId.toString(), ...delivery }, { status: 201 })
      } catch (dbError: any) {
        console.error("Native MongoDB error:", dbError)
        // Fall through to try getCollection
      }
    }

    // Fallback to getCollection
    try {
    const deliveriesCollection = await getCollection("deliveries")

      const deliveryData: any = {
      ...delivery,
      createdAt: new Date(),
      updatedAt: new Date(),
      }

      // Remove _id if it exists
      delete deliveryData._id

      const result = await deliveriesCollection.insertOne(deliveryData)
      console.log("Delivery created with ID (fallback):", result.insertedId)
      return NextResponse.json({ _id: result.insertedId.toString(), ...delivery }, { status: 201 })
    } catch (error: any) {
      console.error("Failed to create delivery:", error)
      return NextResponse.json(
        { error: error.message || "Failed to create delivery" },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Failed to create delivery:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create delivery" },
      { status: 500 },
    )
  }
}
