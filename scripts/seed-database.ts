import { MongoClient, ObjectId } from "mongodb"
import bcrypt from "bcryptjs"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/agritrade"

interface SeedUser {
  _id: ObjectId
  name: string
  email: string
  password: string
  phone: string
  role: "customer" | "farmer" | "delivery" | "admin"
  createdAt: Date
  verified?: boolean
  farmName?: string
  location?: string
  address?: string
  vehicleType?: string
  licensePlate?: string
  onlineStatus?: boolean
  permissions?: string[]
  department?: string
}

async function seedDatabase() {
  console.log("Connecting to MongoDB...")
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB successfully!")

    const db = client.db()

    // Clear existing data
    console.log("Clearing existing data...")
    await db.collection("users").deleteMany({})
    await db.collection("products").deleteMany({})
    await db.collection("orders").deleteMany({})
    await db.collection("deliveries").deleteMany({})
    await db.collection("payments").deleteMany({})
    console.log("Existing data cleared!")

    // Create users with ObjectIds
    const farmerObjectId = new ObjectId()
    const customerObjectId = new ObjectId()
    const deliveryObjectId = new ObjectId()
    const adminObjectId = new ObjectId()

    console.log("Hashing passwords...")
    const hashedFarmerPassword = await bcrypt.hash("farmer123", 10)
    const hashedCustomerPassword = await bcrypt.hash("customer123", 10)
    const hashedDeliveryPassword = await bcrypt.hash("delivery123", 10)
    const hashedAdminPassword = await bcrypt.hash("admin123", 10)

    console.log("Creating users...")
    const users: SeedUser[] = [
      {
        _id: farmerObjectId,
        name: "Rajesh Kumar",
        email: "farmer@agritrade.com",
        password: hashedFarmerPassword, // Now using hashed password
        phone: "+91 98765 43210",
        role: "farmer",
        verified: true,
        farmName: "Green Valley Farms",
        location: "Punjab, India",
        createdAt: new Date("2024-01-15"),
      },
      {
        _id: customerObjectId,
        name: "Priya Singh",
        email: "customer@agritrade.com",
        password: hashedCustomerPassword, // Now using hashed password
        phone: "+91 87654 32109",
        role: "customer",
        address: "New Delhi, India",
        createdAt: new Date("2024-02-20"),
      },
      {
        _id: deliveryObjectId,
        name: "Amit Sharma",
        email: "delivery@agritrade.com",
        password: hashedDeliveryPassword, // Now using hashed password
        phone: "+91 76543 21098",
        role: "delivery",
        vehicleType: "Motorcycle",
        licensePlate: "DL01AB1234",
        onlineStatus: true,
        createdAt: new Date("2024-03-10"),
      },
      {
        _id: adminObjectId,
        name: "Admin User",
        email: "admin@agritrade.com",
        password: hashedAdminPassword, // Now using hashed password
        phone: "+91 99999 99999",
        role: "admin",
        permissions: ["view_all", "manage_users", "manage_products", "manage_orders"],
        department: "Management",
        createdAt: new Date("2024-01-01"),
      },
    ]

    await db.collection("users").insertMany(users)
    console.log("✓ Created 4 users (farmer, customer, delivery, admin)")

    // Create products
    console.log("Creating products...")
    const productObjectId1 = new ObjectId()
    const productObjectId2 = new ObjectId()
    const productObjectId3 = new ObjectId()

    const products = [
      {
        _id: productObjectId1,
        farmerId: farmerObjectId,
        name: "Organic Wheat",
        category: "Grains",
        description: "High-quality organic wheat from Punjab",
        price: 45,
        stock: 500,
        unit: "kg",
        images: ["/organic-wheat-grains.jpg"],
        status: "active",
        createdAt: new Date("2024-10-01"),
      },
      {
        _id: productObjectId2,
        farmerId: farmerObjectId,
        name: "Fresh Tomatoes",
        category: "Vegetables",
        description: "Ripe, fresh tomatoes directly from farm",
        price: 35,
        stock: 200,
        unit: "kg",
        images: ["/fresh-red-tomatoes.jpg"],
        status: "active",
        createdAt: new Date("2024-10-02"),
      },
      {
        _id: productObjectId3,
        farmerId: farmerObjectId,
        name: "Basmati Rice",
        category: "Grains",
        description: "Premium basmati rice with excellent aroma",
        price: 120,
        stock: 300,
        unit: "kg",
        images: ["/basmati-rice-premium.jpg"],
        status: "active",
        createdAt: new Date("2024-10-03"),
      },
    ]

    await db.collection("products").insertMany(products)
    console.log("✓ Created 3 products")

    // Create a sample order
    console.log("Creating sample order...")
    const orderObjectId = new ObjectId()

    const order = {
      _id: orderObjectId,
      customerId: customerObjectId,
      farmerId: farmerObjectId,
      deliveryId: null,
      items: [
        {
          productId: productObjectId1,
          quantity: 10,
          price: 45,
        },
      ],
      amount: 450,
      status: "pending",
      paymentStatus: "pending",
      createdAt: new Date(),
    }

    await db.collection("orders").insertMany([order])
    console.log("✓ Created 1 sample order")

    // Create demo deliveries
    console.log("Creating demo deliveries...")
    const deliveryObjectId1 = new ObjectId()
    const deliveryObjectId2 = new ObjectId()
    const deliveryObjectId3 = new ObjectId()

    const deliveries = [
      {
        _id: deliveryObjectId1,
        orderId: orderObjectId,
        agentId: null,
        deliveryAgentId: null,
        agentName: "Pending Assignment",
        customerName: "Priya Singh",
        status: "pending",
        location: "New Delhi, India",
        deliveryLocation: "123 Main Street, New Delhi",
        pickupLocation: "Green Valley Farms, Punjab",
        eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: deliveryObjectId2,
        orderId: new ObjectId(), // Create a new order ID for demo
        agentId: null,
        deliveryAgentId: null,
        agentName: "Pending Assignment",
        customerName: "Demo Customer",
        status: "pending",
        location: "Mumbai, India",
        deliveryLocation: "456 Oak Avenue, Mumbai",
        pickupLocation: "Farm Location, Maharashtra",
        eta: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: deliveryObjectId3,
        orderId: new ObjectId(), // Create another order ID for demo
        agentId: deliveryObjectId, // Assign to demo delivery agent
        deliveryAgentId: deliveryObjectId,
        agentName: "Amit Sharma",
        customerName: "Test Customer",
        status: "in-transit",
        location: "Bangalore, India",
        deliveryLocation: "789 Pine Road, Bangalore",
        pickupLocation: "Farm Location, Karnataka",
        eta: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    await db.collection("deliveries").insertMany(deliveries)
    console.log("✓ Created 3 demo deliveries (2 pending, 1 in-transit)")

    console.log("\n" + "=".repeat(50))
    console.log("DATABASE SEEDING COMPLETED SUCCESSFULLY!")
    console.log("=".repeat(50))
    console.log("\nYou can now login with these credentials:\n")
    console.log("👨‍🌾 FARMER:")
    console.log("   Email: farmer@agritrade.com")
    console.log("   Password: farmer123\n")
    console.log("👤 CUSTOMER:")
    console.log("   Email: customer@agritrade.com")
    console.log("   Password: customer123\n")
    console.log("🚚 DELIVERY AGENT:")
    console.log("   Email: delivery@agritrade.com")
    console.log("   Password: delivery123\n")
    console.log("👔 ADMIN:")
    console.log("   Email: admin@agritrade.com")
    console.log("   Password: admin123\n")
    console.log("=".repeat(50))
  } catch (error) {
    console.error("Error seeding database:", error)
    throw error
  } finally {
    await client.close()
    console.log("Database connection closed")
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log("[] Seeding complete!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("[] Seeding failed:", error)
    process.exit(1)
  })
