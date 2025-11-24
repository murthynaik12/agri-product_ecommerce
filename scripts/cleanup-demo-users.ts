import "dotenv/config"
import { connectToDatabase, isMongoDBAvailable, connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"
import { ObjectId } from "mongodb"

// List of demo/test user emails to remove
const demoUserEmails = [
  "admin@agritrade.com",
  "rajesh@agritrade.com",
  "farmer@agritrade.com",
  "priya@gmail.com",
  "customer@agritrade.com",
  "amit@delivery.com",
  "delivery@agritrade.com",
]

async function cleanupDemoUsers() {
  try {
    console.log("Starting cleanup of demo users...")
    console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Set" : "Not set")

    if (!process.env.MONGODB_URI) {
      console.error("ERROR: MONGODB_URI is not set in .env.local")
      process.exit(1)
    }

    let deletedCount = 0

    // Try native MongoDB client first
    if (isMongoDBAvailable()) {
      try {
        const { db } = await connectToDatabase()
        const usersCollection = db.collection("users")

        console.log("\nUsing native MongoDB client...")

        for (const email of demoUserEmails) {
          const result = await usersCollection.deleteMany({ email: email.toLowerCase().trim() })
          if (result.deletedCount > 0) {
            console.log(`✓ Deleted user: ${email} (${result.deletedCount} record(s))`)
            deletedCount += result.deletedCount
          }
        }

        console.log(`\n✓ Cleanup complete! Deleted ${deletedCount} demo user(s)`)
        process.exit(0)
      } catch (dbError: any) {
        console.error("Native MongoDB cleanup error:", dbError)
        // Fall through to try mongoose
      }
    }

    // Try mongoose as fallback
    try {
      await connectDB()
      console.log("\nUsing Mongoose...")

      for (const email of demoUserEmails) {
        const result = await User.deleteMany({ email: email.toLowerCase().trim() })
        if (result.deletedCount > 0) {
          console.log(`✓ Deleted user: ${email} (${result.deletedCount} record(s))`)
          deletedCount += result.deletedCount
        }
      }

      console.log(`\n✓ Cleanup complete! Deleted ${deletedCount} demo user(s)`)
      process.exit(0)
    } catch (mongooseError: any) {
      console.error("Mongoose cleanup error:", mongooseError)
      process.exit(1)
    }
  } catch (error: any) {
    console.error("Cleanup error:", error)
    process.exit(1)
  }
}

cleanupDemoUsers()

