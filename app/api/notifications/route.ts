import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase, isMongoDBAvailable } from "@/lib/mongodb"
import { getCollection } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const role = searchParams.get("role")

    console.log("Fetching notifications:", { userId, role })

    // Try native MongoDB client first
    if (isMongoDBAvailable()) {
      try {
        const { db } = await connectToDatabase()
        const notificationsCollection = db.collection("notifications")

        const query: any = {}
        if (userId) {
          // Handle both ObjectId and string formats
          const isObjectId = ObjectId.isValid(userId)
          const userIdObj = isObjectId ? new ObjectId(userId) : userId
          const userIdStr = userId.toString()
          
          query.$or = [
            { userId: userIdObj },
            { userId: userIdStr },
          ]
          console.log("Notification query for userId:", userId, "Query:", JSON.stringify(query, null, 2))
        } else if (role) {
          // Get all users with this role and fetch their notifications
          const usersCollection = db.collection("users")
          const users = await usersCollection.find({ role: role.toLowerCase() }).toArray()
          const userIds = users.map((u: any) => u._id.toString())
          query.userId = { $in: userIds }
        }

        let notifications = await notificationsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .limit(50)
          .toArray()
        
        console.log("Found notifications:", notifications.length, "for userId:", userId)
        
        // Fallback: if no notifications found and userId was provided, fetch all and filter in memory
        if (notifications.length === 0 && userId) {
          console.log("No notifications found with query, fetching all and filtering in memory")
          const allNotifications = await notificationsCollection
            .find({})
            .sort({ createdAt: -1 })
            .limit(100)
            .toArray()
          
          const userIdStr = userId.toString()
          notifications = allNotifications.filter((n: any) => {
            const nUserId = n.userId?.toString() || n.userId
            return nUserId === userIdStr || nUserId === userId
          })
          console.log("Found notifications after in-memory filter:", notifications.length)
        }

        const serialized = notifications.map((n: any) => ({
          ...n,
          _id: n._id?.toString() || n._id,
          userId: n.userId?.toString() || n.userId,
        }))

        return NextResponse.json(serialized)
      } catch (dbError: any) {
        console.error("Native MongoDB error:", dbError)
        // Fall through
      }
    }

    // Fallback
    try {
      const notificationsCollection = await getCollection("notifications")
      const query: any = {}
      if (userId) {
        // Handle both ObjectId and string formats
        const isObjectId = ObjectId.isValid(userId)
        const userIdObj = isObjectId ? new ObjectId(userId) : userId
        const userIdStr = userId.toString()
        
        query.$or = [
          { userId: userIdObj },
          { userId: userIdStr },
        ]
        console.log("Notification query (fallback) for userId:", userId)
      }

      const notifications = await notificationsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray()
      
      console.log("Found notifications (fallback):", notifications.length)

      const serialized = notifications.map((n: any) => ({
        ...n,
        _id: n._id?.toString() || n._id,
        userId: n.userId?.toString() || n.userId,
      }))

      return NextResponse.json(serialized)
    } catch (error: any) {
      console.error("Failed to fetch notifications:", error)
      return NextResponse.json(
        { error: error.message || "Failed to fetch notifications" },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Failed to fetch notifications:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const notification: any = await request.json()
    console.log("Creating notification:", notification)

    // Try native MongoDB client first
    if (isMongoDBAvailable()) {
      try {
        const { db } = await connectToDatabase()
        const notificationsCollection = db.collection("notifications")

        const notificationData: any = {
          ...notification,
          read: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // Convert userId to ObjectId if it's a string
        if (notificationData.userId && ObjectId.isValid(notificationData.userId)) {
          notificationData.userId = new ObjectId(notificationData.userId)
        }

        const result = await notificationsCollection.insertOne(notificationData)
        console.log("Notification created (native):", result.insertedId)
        return NextResponse.json(
          { _id: result.insertedId.toString(), ...notificationData },
          { status: 201 },
        )
      } catch (dbError: any) {
        console.error("Native MongoDB error:", dbError)
        // Fall through
      }
    }

    // Fallback
    try {
      const notificationsCollection = await getCollection("notifications")

      const notificationData: any = {
        ...notification,
        read: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      if (notificationData.userId && ObjectId.isValid(notificationData.userId)) {
        notificationData.userId = new ObjectId(notificationData.userId)
      }

      const result = await notificationsCollection.insertOne(notificationData)
      console.log("Notification created (fallback):", result.insertedId)
      return NextResponse.json(
        { _id: result.insertedId.toString(), ...notificationData },
        { status: 201 },
      )
    } catch (error: any) {
      console.error("Failed to create notification:", error)
      return NextResponse.json(
        { error: error.message || "Failed to create notification" },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("Failed to create notification:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create notification" },
      { status: 500 },
    )
  }
}

