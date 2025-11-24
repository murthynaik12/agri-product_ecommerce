export type UserRole = "farmer" | "customer" | "delivery" | "admin"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  phone?: string
  createdAt: string
}

export interface FarmerProfile extends User {
  farmName: string
  location: string
  latitude: number
  longitude: number
  totalProducts: number
  rating: number
  yearsExperience: number
}

export interface CustomerProfile extends User {
  address: string
  latitude: number
  longitude: number
  totalOrders: number
  spentAmount: number
}

export interface DeliveryAgent extends User {
  vehicleType: string
  licensePlate: string
  currentLocation?: string
  onlineStatus: boolean
  totalDeliveries: number
  rating: number
}

export interface AdminUser extends User {
  permissions: string[]
  department: string
}

export interface Product {
  id: string
  farmerId: string
  farmerName: string
  name: string
  category: string
  description: string
  price: number
  quantity: number
  unit: string
  image?: string
  rating: number
  reviews: number
  inStock: boolean
  createdAt: string
}

export interface Order {
  id: string
  customerId: string
  customerName: string
  items: OrderItem[]
  totalAmount: number
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  deliveryAgentId?: string
  paymentStatus: "pending" | "paid" | "failed"
  createdAt: string
  estimatedDelivery?: string
  actualDelivery?: string
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  farmerId: string
}

export interface Delivery {
  id: string
  orderId: string
  agentId: string
  agentName: string
  status: "assigned" | "in-transit" | "delivered" | "failed"
  currentLocation?: string
  estimatedArrival?: string
  actualArrival?: string
  createdAt: string
}

export interface Review {
  id: string
  productId: string
  customerId: string
  customerName: string
  rating: number
  comment: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    phone?: string
  }
}

export interface RegisterResponse {
  success: boolean
  user?: {
    id: string
    name: string
    email: string
    role: UserRole
    phone: string
  }
  error?: string
}
