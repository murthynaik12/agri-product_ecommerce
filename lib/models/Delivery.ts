export interface Delivery {
  _id?: string
  orderId: string
  deliveryAgentId: string
  agentName: string
  customerName: string
  status: "assigned" | "picked" | "on-the-way" | "delivered" | "failed"
  pickupLocation: string
  deliveryLocation: string
  currentLat?: number
  currentLng?: number
  eta: Date
  deliveredAt?: Date
  remarks?: string
}

export interface DeliveryDocument extends Delivery {
  _id: string
  createdAt: Date
  updatedAt: Date
}
