import mongoose, { Schema, type Model } from "mongoose"

export interface IUser {
  name: string
  email: string
  password?: string
  phone: string
  address?: string
  role: "farmer" | "customer" | "delivery" | "admin"
  status?: "active" | "inactive"
  joinDate?: Date
  profileImage?: string
  verified?: boolean
  farmName?: string
  yearsExperience?: number
  vehicleType?: string
  vehicleLicense?: string
  area?: string
  permissions?: string[]
  department?: string
  createdAt?: Date
  updatedAt?: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String },
    phone: { type: String, required: true },
    address: { type: String },
    role: { type: String, enum: ["farmer", "customer", "delivery", "admin"], required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    joinDate: { type: Date, default: Date.now },
    profileImage: { type: String },
    verified: { type: Boolean, default: false },
    farmName: { type: String },
    yearsExperience: { type: Number },
    vehicleType: { type: String },
    vehicleLicense: { type: String },
    area: { type: String },
    permissions: [{ type: String }],
    department: { type: String },
  },
  {
    timestamps: true,
  },
)

UserSchema.pre("save", function (next) {
  try {
  if (this.email) {
    this.email = this.email.trim().toLowerCase()
  }
    if (typeof next === "function") {
  next()
    }
  } catch (error) {
    if (typeof next === "function") {
      next(error)
    } else {
      throw error
    }
  }
})

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

export default User
