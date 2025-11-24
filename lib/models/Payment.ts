export interface Payment {
  _id?: string
  orderId: string
  customerId: string
  amount: number
  method: "UPI" | "COD" | "Wallet" | "Card"
  status: "pending" | "paid" | "failed"
  transactionId?: string
  paidAt?: Date
}

export interface PaymentDocument extends Payment {
  _id: string
  createdAt: Date
  updatedAt: Date
}
