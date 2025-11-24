import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB, connectToDatabase, isMongoDBAvailable } from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, role, phone } = body

    const emailNorm = email.trim().toLowerCase()

    console.log("Registration attempt:", { name, email: emailNorm, role })

    // Validate required fields
    if (!name || !email || !password || !phone) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailNorm)) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 })
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Validate role
    const validRoles = ["customer", "farmer", "delivery", "admin"]
    const userRole = role || "customer"
    if (!validRoles.includes(userRole)) {
      return NextResponse.json({ success: false, error: "Invalid role selected" }, { status: 400 })
    }

    // Try to connect to database and register user
    // Prefer native MongoDB client to avoid mongoose middleware issues
    if (isMongoDBAvailable()) {
      try {
        const { db } = await connectToDatabase()
        const usersCollection = db.collection("users")

        // Check if user already exists
        const existing = await usersCollection.findOne({ email: emailNorm })
        if (existing) {
          return NextResponse.json({ success: false, error: "Email already registered" }, { status: 409 })
        }

        // Hash password
        const hashed = await bcrypt.hash(password, 10)

        // Create user using native MongoDB client
        const result = await usersCollection.insertOne({
          name,
          email: emailNorm,
          password: hashed,
          phone,
          role: userRole,
          status: "active",
          verified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        console.log("User registered successfully:", emailNorm)

        return NextResponse.json(
          {
            success: true,
            user: {
              id: result.insertedId.toString(),
              name,
              email: emailNorm,
              role: userRole,
              phone,
            },
          },
          { status: 201 },
        )
      } catch (dbError: any) {
        console.error("Native MongoDB client error:", dbError)
        // Fall through to try mongoose as fallback
      }
    }

    // Try mongoose as fallback or if native client not available
    try {
      const dbConnection = await connectDB()
      if (!dbConnection) {
        return NextResponse.json(
          {
            success: false,
            error: "Database not configured. Please set MONGODB_URI environment variable.",
          },
          { status: 503 },
        )
      }

      // Verify mongoose is actually connected
      if (dbConnection.readyState !== 1) {
        throw new Error("Mongoose connection not ready")
      }

      // Use mongoose models
    const existing = await User.findOne({ email: emailNorm })
    if (existing) {
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 409 })
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email: emailNorm,
      password: hashed,
      phone,
        role: userRole,
      status: "active",
      verified: false,
    })

      console.log("User registered successfully (mongoose):", user.email)

    // Return success response
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
      },
      { status: 201 },
    )
    } catch (mongooseError: any) {
      console.error("Mongoose error:", mongooseError)
      // If mongoose also fails and we haven't returned yet, return error
      if (isMongoDBAvailable()) {
        return NextResponse.json(
          {
            success: false,
            error: "Database connection failed. Please check your MongoDB configuration.",
          },
          { status: 503 },
        )
      }
      throw mongooseError
    }
  } catch (error: any) {
    console.error("Registration error:", error)
    
    // Provide more specific error messages
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 409 })
    }
    
    if (error.message?.includes("validation")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Registration failed. Please try again.",
      },
      { status: 500 },
    )
  }
}
