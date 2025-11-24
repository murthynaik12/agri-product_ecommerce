import "dotenv/config"
import { MongoClient, ObjectId } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/agritrade"

async function createDemoDeliveries() {
  console.log("Connecting to MongoDB...")
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB successfully!")

    const db = client.db()

    // Get a delivery agent user ID
    const deliveryAgent = await db.collection("users").findOne({ role: "delivery" })
    if (!deliveryAgent) {
      console.error("No delivery agent found. Please create a delivery agent user first.")
      return
    }

    console.log("Found delivery agent:", deliveryAgent.name)

    // Get an order ID (or create a dummy one)
    const existingOrder = await db.collection("orders").findOne({})
    const orderId = existingOrder?._id || new ObjectId()

    // Create demo deliveries
    console.log("Creating demo deliveries...")
    const deliveries = [
      {
        orderId: orderId,
        agentId: null,
        deliveryAgentId: null,
        agentName: "Pending Assignment",
        customerName: "Demo Customer 1",
        status: "pending",
        location: "New Delhi, India",
        deliveryLocation: "123 Main Street, New Delhi",
        pickupLocation: "Farm Location, Punjab",
        eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        orderId: new ObjectId(), // Create a new order ID for demo
        agentId: null,
        deliveryAgentId: null,
        agentName: "Pending Assignment",
        customerName: "Demo Customer 2",
        status: "pending",
        location: "Mumbai, India",
        deliveryLocation: "456 Oak Avenue, Mumbai",
        pickupLocation: "Farm Location, Maharashtra",
        eta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        orderId: new ObjectId(), // Create another order ID for demo
        agentId: deliveryAgent._id,
        deliveryAgentId: deliveryAgent._id,
        agentName: deliveryAgent.name,
        customerName: "Demo Customer 3",
        status: "in-transit",
        location: "Bangalore, India",
        deliveryLocation: "789 Pine Road, Bangalore",
        pickupLocation: "Farm Location, Karnataka",
        eta: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const result = await db.collection("deliveries").insertMany(deliveries)
    console.log("✓ Created", result.insertedCount, "demo deliveries")
    console.log("  - 2 pending deliveries (ready to assign)")
    console.log("  - 1 in-transit delivery (already assigned)")

    console.log("\n" + "=".repeat(50))
    console.log("DEMO DELIVERIES CREATED SUCCESSFULLY!")
    console.log("=".repeat(50))
    console.log("\nYou can now see these deliveries in the admin panel.")
  } catch (error) {
    console.error("Error creating demo deliveries:", error)
    throw error
  } finally {
    await client.close()
    console.log("Database connection closed")
  }
}

// Run the function
createDemoDeliveries()
  .then(() => {
    console.log("\n✓ Demo deliveries creation complete!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n✗ Demo deliveries creation failed:", error)
    process.exit(1)
  })

