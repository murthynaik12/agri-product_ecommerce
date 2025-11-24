import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, isMongoDBAvailable } from "@/lib/mongodb"
import { getCollection } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { read } = await request.json()

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 })
    }

    // Try native MongoDB client first
    if (isMongoDBAvailable()) {
      try {
        const { db } = await connectToDatabase()
        const notificationsCollection = db.collection("notifications")

        const result = await notificationsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { read, updatedAt: new Date() } },
        )

        if (result.matchedCount === 0) {
          return NextResponse.json({ error: "Notification not found" }, { status: 404 })
        }

        return NextResponse.json({ success: true })
      } catch (dbError: any) {
        console.error("Native MongoDB error:", dbError)
        // Fall through
      }
    }

    // Fallback
    try {
      const notificationsCollection = await getCollection("notifications")

      const result = await notificationsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { read, updatedAt: new Date() } },
      )

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 })
      }

      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error("Failed to update notification:", error)
      return NextResponse.json(
        { error: error.message || "Failed to update notification" },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Failed to update notification:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update notification" },
      { status: 500 },
    )
  }
}

