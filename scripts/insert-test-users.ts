import "dotenv/config"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import User from "@/lib/models/User"

const testUsers = [
  {
    name: "Farmer User",
    email: "farmer@agritrade.com",
    password: "farmer123",
    phone: "9876543210",
    role: "farmer",
  },
  {
    name: "Customer User",
    email: "customer@agritrade.com",
    password: "customer123",
    phone: "9876543211",
    role: "customer",
  },
  {
    name: "Delivery Agent",
    email: "delivery@agritrade.com",
    password: "delivery123",
    phone: "9876543212",
    role: "delivery",
  },
  {
    name: "Admin User",
    email: "admin@agritrade.com",
    password: "admin123",
    phone: "9876543213",
    role: "admin",
  },
]

async function insertTestUsers() {
  try {
    console.log("MONGODB_URI:", process.env.MONGODB_URI ? "Set" : "Not set")

    const uri = process.env.MONGODB_URI

    if (!uri) {
      console.error("ERROR: MONGODB_URI is not set in .env.local")
      process.exit(1)
    }

    await mongoose.connect(uri)
    console.log("Connected to MongoDB")

    // Delete existing test users
    await User.deleteMany({
      email: { $in: testUsers.map((u) => u.email) },
    })
    console.log("Deleted existing test users")

    // Insert new test users with hashed passwords
    for (const testUser of testUsers) {
      const hashedPassword = await bcrypt.hash(testUser.password, 10)

      const user = await User.create({
        name: testUser.name,
        email: testUser.email.toLowerCase().trim(),
        password: hashedPassword,
        phone: testUser.phone,
        role: testUser.role,
        status: "active",
        verified: true,
      })

      console.log(`Created ${testUser.role} user: ${user.email}`)
    }

    console.log("All test users inserted successfully!")
    console.log("You can now login with:")
    console.log("   FARMER: farmer@agritrade.com / farmer123")
    console.log("   CUSTOMER: customer@agritrade.com / customer123")
    console.log("   DELIVERY: delivery@agritrade.com / delivery123")
    console.log("   ADMIN: admin@agritrade.com / admin123")

    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error("Error inserting test users:", error)
    process.exit(1)
  }
}

insertTestUsers()
