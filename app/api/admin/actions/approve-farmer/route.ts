import { type NextRequest, NextResponse } from "next/server"
import { getCollection } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function PATCH(request: NextRequest) {
  try {
    const { farmerId } = await request.json()

    const usersCollection = await getCollection("users")

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(farmerId), role: "farmer" },
      {
        $set: {
          verified: true,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Farmer not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Farmer approved" })
  } catch (error) {
    console.error("Error approving farmer:", error)
    return NextResponse.json({ error: "Failed to approve farmer" }, { status: 500 })
  }
}
