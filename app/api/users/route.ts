import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db"
import type { IUser } from "@/lib/models/User"
import { connectToDatabase, isMongoDBAvailable, connectDB } from "@/lib/mongodb"
import UserModel from "@/lib/models/User"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")

    console.log("Fetching users with role:", role)

    // Try native MongoDB client first
    if (isMongoDBAvailable()) {
      try {
        const { db } = await connectToDatabase()
        const usersCollection = db.collection("users")

        const query = role ? { role: role.toLowerCase() } : {}
        console.log("Query:", query)
        
    let users = await usersCollection.find(query).toArray()
        console.log("Found users (native):", users.length)

        // Only apply basic filtering for delivery agents - remove overly strict requirements
        if (role === "delivery") {
          users = users.filter(
            (user: any) =>
              user.name &&
              user.name.trim().length > 0 &&
              user.role === "delivery" // Ensure role matches
          )
        }

        // Convert ObjectIds to strings for JSON serialization
        const serializedUsers = users.map((user: any) => ({
          _id: user._id?.toString() || user._id,
          id: user._id?.toString() || user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          status: user.status,
        }))

        console.log("Serialized users:", serializedUsers.length)
        return NextResponse.json(serializedUsers)
      } catch (dbError: any) {
        console.error("Native MongoDB error:", dbError)
        // Fall through to try mongoose
      }
    }

    // Try mongoose as fallback
    try {
      await connectDB()
      const query = role ? { role: role.toLowerCase() } : {}
      let users = await UserModel.find(query).lean()
      
      console.log("Found users (mongoose):", users.length)

      // Only apply basic filtering for delivery agents
    if (role === "delivery") {
      users = users.filter(
        (user: any) =>
          user.name &&
          user.name.trim().length > 0 &&
            user.role === "delivery"
        )
      }

      // Convert mongoose documents to plain objects
      const usersArray = users.map((user: any) => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status,
      }))

      return NextResponse.json(usersArray)
    } catch (mongooseError: any) {
      console.error("Mongoose error:", mongooseError)
      if (isMongoDBAvailable()) {
        throw mongooseError
      }
      return NextResponse.json(
        { error: "Database not configured. Please set MONGODB_URI environment variable." },
        { status: 503 },
      )
    }
  } catch (error: any) {
    console.error("Fetch users error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user: IUser = await request.json()

    const usersCollection = await getCollection("users")

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: user.email })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const result = await usersCollection.insertOne({
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ _id: result.insertedId, ...user }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
