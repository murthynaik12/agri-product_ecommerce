import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db"
import { ObjectId } from "mongodb"
import type { User } from "@/lib/models/User"
import { connectToDatabase, isMongoDBAvailable, connectDB } from "@/lib/mongodb"
import UserModel from "@/lib/models/User"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user: Partial<User> = await request.json()
    const { id: userId } = await params

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    // Try native MongoDB client first
    if (isMongoDBAvailable()) {
      try {
        const { db } = await connectToDatabase()
        const usersCollection = db.collection("users")

    const result = await usersCollection.updateOne(
          { _id: new ObjectId(userId) },
      {
        $set: {
          ...user,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        return NextResponse.json({ success: true, updated: result.modifiedCount > 0 })
      } catch (dbError: any) {
        console.error("Native MongoDB update error:", dbError)
        // Fall through to try mongoose
      }
    }

    // Try mongoose as fallback
    try {
      await connectDB()
      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        {
          ...user,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true },
      )

      if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
    } catch (mongooseError: any) {
      console.error("Mongoose update error:", mongooseError)
      if (isMongoDBAvailable()) {
        throw mongooseError
      }
      return NextResponse.json(
        { error: "Database not configured. Please set MONGODB_URI environment variable." },
        { status: 503 },
      )
    }
  } catch (error: any) {
    console.error("Update user error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
    }

    // Try native MongoDB client first
    if (isMongoDBAvailable()) {
      try {
        const { db } = await connectToDatabase()
        const usersCollection = db.collection("users")

    const result = await usersCollection.deleteOne({
          _id: new ObjectId(userId),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
      } catch (dbError: any) {
        console.error("Native MongoDB delete error:", dbError)
        // Fall through to try mongoose
      }
    }

    // Try mongoose as fallback
    try {
      await connectDB()
      const deletedUser = await UserModel.findByIdAndDelete(userId)

      if (!deletedUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      return NextResponse.json({ success: true })
    } catch (mongooseError: any) {
      console.error("Mongoose delete error:", mongooseError)
      if (isMongoDBAvailable()) {
        throw mongooseError
      }
      return NextResponse.json(
        { error: "Database not configured. Please set MONGODB_URI environment variable." },
        { status: 503 },
      )
    }
  } catch (error: any) {
    console.error("Delete user error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 },
    )
  }
}
