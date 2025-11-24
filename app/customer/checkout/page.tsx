"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/cart-context"
import { createOrder, createDelivery } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"

export default function Checkout() {
  const router = useRouter()
  const { user } = useAuth()
  const { cart, getCartTotal, clearCart } = useCart()
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipcode: "",
    paymentMethod: "cod", // Default to Cash on Delivery
  })

  // Pre-fill user data when available
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
      }))
    }
  }, [user])

  const subtotal = getCartTotal()
  const shipping = subtotal > 0 ? 50 : 0
  const tax = Math.round(subtotal * 0.05)
  const finalTotal = subtotal + shipping + tax

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!cart || cart.length === 0) {
      alert("Your cart is empty!")
      return
    }

    if (!user) {
      alert("Please log in to place an order")
      router.push("/login")
      return
    }

    setIsProcessing(true)

    try {
      // Get farmerId from cart items - fetch product details if farmerId is missing
      const itemsWithFarmerId = await Promise.all(
        cart.map(async (item) => {
          let farmerId = item.farmerId
          
          // If farmerId is missing, fetch it from the product
          if (!farmerId && (item._id || item.id)) {
            try {
              // Fetch all products and find the one matching this item
              const productResponse = await fetch(`/api/products`)
              const products = await productResponse.json()
              const product = products.find((p: any) => {
                const pId = p._id?.toString() || p._id
                const iId = (item._id || item.id)?.toString()
                return pId === iId
              })
              if (product) {
                farmerId = product.farmerId?.toString() || product.farmerId
                console.log(`Found farmerId for product ${item.name}:`, farmerId)
              } else {
                console.warn(`Product not found for item:`, item.name, item._id || item.id)
              }
            } catch (error) {
              console.error("Failed to fetch product farmerId:", error)
            }
          }
          
          return {
            ...item,
            farmerId: farmerId || "unknown"
          }
        })
      )
      
      // Get primary farmerId (use the first item's farmerId, or most common if multiple)
      const farmerIds = itemsWithFarmerId.map(item => item.farmerId).filter(Boolean)
      const primaryFarmerId = farmerIds[0] || "unknown"
      
      console.log("Cart items for order:", itemsWithFarmerId.map(item => ({
        name: item.name,
        farmerId: item.farmerId,
        _id: item._id || item.id
      })))
      
      const orderData = {
        customerId: user.id,
        customerName: formData.fullName || user.name,
        farmerId: primaryFarmerId,
        items: itemsWithFarmerId.map((item) => ({
          productId: item._id || item.id || "",
          productName: item.name,
          quantity: item.cartQuantity,
          price: item.price,
          farmerId: item.farmerId || primaryFarmerId, // Include farmerId in each item
        })),
        totalAmount: finalTotal,
        status: "pending",
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentMethod === "cod" ? "pending" : "paid",
        shippingAddress: {
          fullName: formData.fullName,
          email: formData.email || user.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          zipcode: formData.zipcode,
        },
        orderDate: new Date().toISOString(),
      }

      console.log("Creating order:", orderData)
      const order = await createOrder(orderData)
      console.log("Order created successfully:", order)

      const deliveryData = {
        orderId: order._id || order.id,
        agentId: "unassigned",
        agentName: "Pending Assignment",
        customerName: formData.fullName || user.name,
        status: "pending",
        location: `${formData.address}, ${formData.city}`,
        eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      }

      console.log("Creating delivery:", deliveryData)
      await createDelivery(deliveryData)
      console.log("Delivery created successfully")

      clearCart()
      setOrderPlaced(true)

      setTimeout(() => {
        router.push("/customer/orders")
      }, 2000)
    } catch (error) {
      console.error("Failed to create order or delivery:", error)
      alert("Failed to place order. Please try again.")
      setIsProcessing(false)
    }
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 bg-white border border-gray-200 text-center max-w-md">
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600 mb-4">Your order has been placed. Redirecting to orders page...</p>
          <div className="animate-spin inline-block w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
        </Card>
      </div>
    )
  }

  if (!cart || cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 bg-white border border-gray-200 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-4">Add some items to your cart before checking out</p>
          <Button
            onClick={() => router.push("/customer/products")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Continue Shopping
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <Card className="p-6 bg-white border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                  <input
                    type="text"
                    value={formData.zipcode}
                    onChange={(e) => setFormData({ ...formData, zipcode: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>
            </form>
          </Card>

          {/* Payment Method */}
          <Card className="p-6 bg-white border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === "cod"}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="mr-3 w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Cash on Delivery</div>
                  <div className="text-sm text-gray-500">Pay when you receive your order</div>
              </div>
              </label>
              
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={formData.paymentMethod === "upi"}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="mr-3 w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">UPI Payment</div>
                  <div className="text-sm text-gray-500">Pay via UPI (PhonePe, Google Pay, etc.)</div>
                </div>
              </label>
              
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition">
                  <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={formData.paymentMethod === "card"}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="mr-3 w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Card Payment</div>
                  <div className="text-sm text-gray-500">Credit/Debit Card</div>
                </div>
              </label>
              </div>
          </Card>
        </div>

        {/* Order Summary */}
        <Card className="p-6 bg-white border border-gray-200 h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3 border-b border-gray-200 pb-4 mb-4">
            {cart.map((item) => (
              <div key={item._id || item.id} className="flex justify-between text-gray-600">
                <span>
                  {item.name} ({item.cartQuantity})
                </span>
                <span>₹{item.price * item.cartQuantity}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>₹{shipping}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>₹{tax}</span>
            </div>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-4 mb-6">
            <span>Total</span>
            <span>₹{finalTotal}</span>
          </div>
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 font-semibold disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : formData.paymentMethod === "cod" ? `Place Order (₹${finalTotal})` : `Pay ₹${finalTotal}`}
          </Button>
          <Button onClick={() => router.back()} variant="outline" className="w-full mt-2">
            Cancel
          </Button>
        </Card>
      </div>
    </div>
  )
}
