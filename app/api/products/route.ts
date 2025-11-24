import { type NextRequest, NextResponse } from "next/server"
import { connectDB, isMongoDBAvailable } from "@/lib/mongodb"
import Product from "@/lib/models/Product"
import { memoryStorage } from "@/lib/memory-storage"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const farmerId = searchParams.get("farmerId")
    const category = searchParams.get("category")

    if (isMongoDBAvailable()) {
      await connectDB()

      const filter: any = {}
      if (farmerId) filter.farmerId = farmerId
      if (category) filter.category = category

      const products = await Product.find(filter).sort({ createdAt: -1 }).lean()
      return NextResponse.json(products)
    } else {
      const filter: any = {}
      if (farmerId) filter.farmerId = farmerId
      if (category) filter.category = category

      const products = memoryStorage.products.find(filter)
      return NextResponse.json(products)
    }
  } catch (error) {
    console.error("GET /api/products error:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const productData = await request.json()

    if (!productData.farmerId) {
      return NextResponse.json({ error: "farmerId is required to create a product" }, { status: 400 })
    }

    if (isMongoDBAvailable()) {
      await connectDB()

      const dataToSave = {
        ...productData,
        rating: productData.rating || 0,
        reviews: 0,
        inStock: true,
        status: "active",
      }

      const newProduct = await Product.create(dataToSave)
      return NextResponse.json(newProduct, { status: 201 })
    } else {
      const newProduct = memoryStorage.products.create({
        ...productData,
        rating: productData.rating || 0,
        reviews: 0,
        inStock: true,
        status: "active",
      })

      return NextResponse.json(newProduct, { status: 201 })
    }
  } catch (error: any) {
    console.error("POST /api/products error:", error)
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 })
  }
}
