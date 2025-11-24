import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB, connectToDatabase, isMongoDBAvailable } from "@/lib/mongodb"
import User from "@/lib/models/User"
import { generateToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function POST(req: Request) {
  try {
    const { email, password, expectedRole } = await req.json()

    const emailNorm = email.trim().toLowerCase()

    console.log("Login attempt:", { email: emailNorm, expectedRole })

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Try native MongoDB client first
    let user: any = null

    if (isMongoDBAvailable()) {
      try {
        const { db } = await connectToDatabase()
        const usersCollection = db.collection("users")

        user = await usersCollection.findOne({ email: emailNorm })

        if (user) {
          // Verify password
          if (!user.password) {
            console.log("User has no password stored")
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
          }

          const isValid = await bcrypt.compare(password, user.password)
          console.log("Password valid:", isValid)

          if (!isValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
          }

          // Verify role if expected role is provided
          if (expectedRole && user.role !== expectedRole) {
            return NextResponse.json(
              { error: `This account is registered as ${user.role}, not ${expectedRole}. Please select the correct role.` },
              { status: 403 }
            )
          }

          const token = generateToken(user._id.toString(), user.role, user.email)

          console.log("Login successful for:", user.email, "Role:", user.role)

          return NextResponse.json({
            token,
            user: {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
              phone: user.phone || "",
            },
          })
        }
      } catch (dbError: any) {
        console.error("Native MongoDB login error:", dbError)
        // Fall through to try mongoose
      }
    }

    // Try mongoose as fallback
    try {
      await connectDB()

      const userCount = await User.countDocuments()
      console.log("Total users in database:", userCount)

      user = await User.findOne({ email: emailNorm })

      console.log("User found:", user ? `Yes (${user.email}, role: ${user.role})` : "No")

      if (!user) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      if (!user.password) {
        console.log("User has no password stored")
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      const isValid = await bcrypt.compare(password, user.password)
      console.log("Password valid:", isValid)

      if (!isValid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      // Verify role if expected role is provided
      if (expectedRole && user.role !== expectedRole) {
        return NextResponse.json(
          { error: `This account is registered as ${user.role}, not ${expectedRole}. Please select the correct role.` },
          { status: 403 }
        )
      }

      const token = generateToken(user._id.toString(), user.role, user.email)

      console.log("Login successful for:", user.email, "Role:", user.role)

      return NextResponse.json({
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || "",
        },
      })
    } catch (mongooseError: any) {
      console.error("Mongoose login error:", mongooseError)
      if (isMongoDBAvailable()) {
        throw mongooseError
      }
      return NextResponse.json(
        { error: "Database not configured. Please set MONGODB_URI environment variable." },
        { status: 503 }
      )
    }
  } catch (error: any) {
    console.error("Login error:", error)
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 })
  }
}
