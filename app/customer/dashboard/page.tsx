"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchOrders, fetchProducts } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/context/cart-context"

interface Order {
  _id?: string
  id?: string
  customerId: string
  customerName: string
  items: any[]
  totalAmount: number
  status: string
  createdAt?: string
}

interface Product {
  _id?: string
  name: string
  category: string
  price: number
  rating?: number
  image?: string
}

export default function CustomerDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const [ordersData, productsData] = await Promise.all([fetchOrders(user.id), fetchProducts()])

      const mappedOrders = ordersData.slice(0, 2).map((o: any) => ({
        _id: o._id,
        id: o._id,
        customerId: o.customerId,
        customerName: o.customerName,
        items: o.items || [],
        totalAmount: o.totalAmount,
        status: o.status,
        createdAt: o.orderDate
          ? new Date(o.orderDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      }))

      const mappedProducts = productsData.slice(0, 3).map((p: any) => ({
        _id: p._id,
        id: p._id, // Add id field for cart compatibility
        name: p.name,
        category: p.category,
        price: p.price,
        rating: p.rating || 0,
        farmerId: p.farmerId?.toString() || p.farmerId || p.farmer?._id?.toString() || p.farmer?._id, // Include farmerId
        image: p.image,
      }))

      setOrders(mappedOrders)
      setProducts(mappedProducts)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0)

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name || "Customer"}</h1>
        <p className="text-gray-600 mt-1">Manage your orders and explore fresh products</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-white border border-gray-200">
          <div className="text-gray-600 text-sm font-medium">Total Orders</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{orders.length}</div>
          <div className="text-gray-500 text-xs mt-2">All time</div>
        </Card>
        <Card className="p-6 bg-white border border-gray-200">
          <div className="text-gray-600 text-sm font-medium">Total Spent</div>
          <div className="text-3xl font-bold text-green-600 mt-2">₹{totalSpent.toLocaleString()}</div>
          <div className="text-gray-500 text-xs mt-2">On purchases</div>
        </Card>
        <Card className="p-6 bg-white border border-gray-200">
          <div className="text-gray-600 text-sm font-medium">Pending Orders</div>
          <div className="text-3xl font-bold text-orange-600 mt-2">
            {orders.filter((o) => o.status !== "delivered").length}
          </div>
          <div className="text-gray-500 text-xs mt-2">In transit</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2 p-6 bg-white border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Button
              onClick={() => router.push("/customer/orders")}
              variant="outline"
              size="sm"
              className="text-blue-600"
            >
              View All
            </Button>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No orders yet</p>
              <p className="text-gray-400 text-sm mt-1">Start shopping to place your first order</p>
              <Button
                onClick={() => router.push("/customer/products")}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white"
              >
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{order.id?.substring(0, 8)}</p>
                    <p className="text-sm text-gray-500">{order.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{order.totalAmount}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-700"
                            : order.status === "in-transit"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleViewOrder(order)}
                      variant="outline"
                      size="sm"
                      className="text-blue-600"
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="p-6 bg-white border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Button
              onClick={() => router.push("/customer/products")}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2"
            >
              Browse Products
            </Button>
            <Button
              onClick={() => router.push("/customer/cart")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
            >
              View Cart
            </Button>
            <Button
              onClick={() => router.push("/customer/wishlist")}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-2"
            >
              My Wishlist
            </Button>
            <Button
              onClick={() => router.push("/customer/support")}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white text-sm py-2"
            >
              Contact Support
            </Button>
          </div>
        </Card>
      </div>

      {/* Recommended Products */}
      <Card className="p-6 bg-white border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recommended For You</h2>
          <Button
            onClick={() => router.push("/customer/products")}
            variant="outline"
            size="sm"
            className="text-blue-600"
          >
            See All
          </Button>
        </div>
        {products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No products available</p>
            <p className="text-gray-400 text-sm mt-1">Check back later for fresh products from our farmers</p>
            <Button
              onClick={() => router.push("/customer/products")}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white"
            >
              Browse All Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product._id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition">
                <img
                  src={product.image || "/placeholder.svg?height=300&width=300&query=product"}
                  alt={product.name}
                  className="aspect-square bg-gray-200 rounded-lg mb-3 object-cover w-full"
                />
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.category}</p>
                <div className="flex justify-between items-center mt-3">
                  <span className="font-bold text-gray-900">₹{product.price}</span>
                  <span className="text-yellow-500">★ {product.rating}</span>
                </div>
                <Button
                  className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white text-sm py-1"
                  onClick={() => {
                    // Ensure product has farmerId before adding to cart
                    const productWithFarmerId = {
                      ...product,
                      farmerId: product.farmerId || (product as any).farmer?._id || (product as any).farmer?._id?.toString()
                    }
                    addToCart(productWithFarmerId)
                    alert(`Added ${product.name} to cart!`)
                  }}
                >
                  Add to Cart
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* View Order Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Details</h2>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-gray-600 text-sm">Order ID</p>
                <p className="font-semibold text-gray-900">{selectedOrder.id?.substring(0, 8)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Date</p>
                <p className="font-semibold text-gray-900">{selectedOrder.createdAt}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Amount</p>
                <p className="font-semibold text-gray-900">₹{selectedOrder.totalAmount}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Status</p>
                <p className="font-semibold text-gray-900 capitalize">{selectedOrder.status}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Items</p>
                <ul className="text-gray-900 text-sm mt-1">
                  {selectedOrder.items.map((item, idx) => (
                    <li key={idx}>• {item.productName}</li>
                  ))}
                </ul>
              </div>
            </div>
            <Button
              onClick={() => setShowOrderModal(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Close
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
