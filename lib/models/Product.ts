import mongoose, { Schema, type Model } from "mongoose"

export interface IProduct {
  name: string
  category: string
  price: number
  stock: number
  quantity?: number
  rating?: number
  reviews?: number
  farmerId: string
  farmerName?: string
  image?: string
  description?: string
  unit?: string
  status?: "active" | "inactive"
  inStock?: boolean
  createdAt?: Date
  updatedAt?: Date
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    quantity: { type: Number },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    farmerId: { type: String, required: true },
    farmerName: { type: String },
    image: { type: String },
    description: { type: String },
    unit: { type: String, default: "kg" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    inStock: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
)

ProductSchema.index({ farmerId: 1 })
ProductSchema.index({ category: 1 })

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema)

export default Product
