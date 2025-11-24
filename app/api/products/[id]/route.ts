import { type NextRequest, NextResponse } from "next/server"
import { connectDB, isMongoDBAvailable } from "@/lib/mongodb"
import Product from "@/lib/models/Product"
import { ObjectId } from "mongodb"
import { memoryStorage } from "@/lib/memory-storage"

function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const productUpdate = await request.json()

    if (isMongoDBAvailable()) {
      await connectDB()

      if (!isValidObjectId(id)) {
        return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { $set: productUpdate },
        { new: true, runValidators: true },
      )

      if (!updatedProduct) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }

      return NextResponse.json(updatedProduct)
    } else {
      const updatedProduct = memoryStorage.products.update(id, productUpdate)

      if (!updatedProduct) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }

      return NextResponse.json(updatedProduct)
    }
  } catch (error) {
    console.error("PUT /api/products/:id error:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    if (isMongoDBAvailable()) {
      await connectDB()

      if (!isValidObjectId(id)) {
        return NextResponse.json({ error: "Invalid product ID" }, { status: 400 })
      }

      const deletedProduct = await Product.findByIdAndDelete(id)

      if (!deletedProduct) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }

      return NextResponse.json({ success: true, message: "Product deleted successfully" })
    } else {
      const deletedProduct = memoryStorage.products.delete(id)

      if (!deletedProduct) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 })
      }

      return NextResponse.json({ success: true, message: "Product deleted successfully" })
    }
  } catch (error) {
    console.error("DELETE /api/products/:id error:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
