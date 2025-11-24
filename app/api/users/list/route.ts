import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function GET() {
  try {
    console.log("Fetching all users...")
    await connectDB()

    const users = await User.find({}).select("name email role phone verified createdAt").lean()

    console.log("Found users:", users.length)

    return NextResponse.json({
      success: true,
      count: users.length,
      users: users.map((user) => ({
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        verified: user.verified,
        createdAt: user.createdAt,
      })),
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch users", error: String(error) },
      { status: 500 },
    )
  }
}
