import mongoose from "mongoose"
import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI
const USE_MONGODB = !!MONGODB_URI

if (!MONGODB_URI) {
  console.warn(
    "MONGODB_URI not set - using in-memory storage. Add MONGODB_URI to environment variables for persistent storage.",
  )
}

const uri = MONGODB_URI || ""

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

if (USE_MONGODB) {
  if (process.env.NODE_ENV === "development") {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
  } else {
    client = new MongoClient(uri)
    clientPromise = client.connect()
  }
}

export async function connectDB() {
  if (!USE_MONGODB) {
    console.log("Using in-memory storage (MongoDB not configured)")
    return null
  }

  try {
    if (mongoose.connection.readyState >= 1) {
      return mongoose.connection
    }

    await mongoose.connect(uri)
    console.log("MongoDB connected successfully")
    return mongoose.connection
  } catch (error) {
    console.error("MongoDB connection error:", error)
    throw error
  }
}

export async function connectToDatabase() {
  if (!USE_MONGODB || !clientPromise) {
    throw new Error("MongoDB not configured")
  }

  const client = await clientPromise
  const db = client.db()

  return { client, db }
}

export function isMongoDBAvailable(): boolean {
  return USE_MONGODB
}

export default clientPromise
