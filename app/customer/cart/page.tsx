"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/cart-context"

export default function CustomerCart() {
  const router = useRouter()
  const { cart, removeFromCart, updateQuantity, getCartTotal, getCartCount } = useCart()

  const subtotal = getCartTotal()
  const shipping = subtotal > 0 ? 50 : 0
  const tax = subtotal * 0.05
  const total = subtotal + shipping + tax

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>

      {cart.length > 0 ? (
        <Card className="p-6 bg-white border border-gray-200">
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item._id || item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                <img
                  src={item.image || "/placeholder.svg?height=100&width=100&query=product"}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500">{item.category}</p>
                  <p className="text-sm text-gray-600 mt-1">₹{item.price} per kg</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      onClick={() => updateQuantity(item._id || item.id || "", item.cartQuantity - 1)}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      -
                    </Button>
                    <span className="w-12 text-center">{item.cartQuantity} kg</span>
                    <Button
                      onClick={() => updateQuantity(item._id || item.id || "", item.cartQuantity + 1)}
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <Button
                    onClick={() => removeFromCart(item._id || item.id || "")}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                  <p className="font-bold text-gray-900">₹{(item.price * item.cartQuantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-6 bg-white border border-gray-200">
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Start shopping to add products to your cart</p>
            <Button
              onClick={() => router.push("/customer/products")}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Continue Shopping
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6 bg-white border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
        <div className="space-y-2 border-t border-gray-200 pt-4">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Shipping</span>
            <span>₹{shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax (5%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 border-t border-gray-200 pt-4 mt-4">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>
        <Button
          onClick={() => router.push("/customer/checkout")}
          disabled={cart.length === 0}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Proceed to Checkout
        </Button>
      </Card>
    </div>
  )
}
