export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  farmerId: string
}

export interface Order {
  _id?: string
  customerId: string
  customerName: string
  farmerId: string
  deliveryId?: string
  items: OrderItem[]
  totalAmount: number
  status: "pending" | "accepted" | "packed" | "dispatched" | "delivered" | "rejected" | "cancelled"
  paymentStatus: "pending" | "paid" | "failed"
  shippingAddress: string
  orderDate: Date
  deliveryDate?: Date
}

export interface OrderDocument extends Order {
  _id: string
  createdAt: Date
  updatedAt: Date
}
