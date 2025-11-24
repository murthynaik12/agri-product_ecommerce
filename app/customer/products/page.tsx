"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchProducts } from "@/lib/api-client"
import { useCart } from "@/context/cart-context"

interface Product {
  _id?: string
  id?: string
  name: string
  category: string
  price: number
  stock?: number
  quantity?: number
  rating?: number
  farmerName?: string
  image?: string
}

export default function CustomerProducts() {
  const { addToCart, getCartCount } = useCart()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      const data = await fetchProducts()
      const mappedProducts = data.map((p: any) => ({
        _id: p._id,
        id: p._id,
        name: p.name,
        category: p.category,
        price: p.price,
        quantity: p.stock || 0,
        rating: p.rating || 0,
        farmerName: p.farmerName || "Unknown Farmer",
        farmerId: p.farmerId || p.farmer?._id || p.farmer?._id?.toString(), // Include farmerId
        image: p.image,
      }))
      setProducts(mappedProducts)
    } catch (error) {
      console.error("Failed to load products:", error)
      alert("Failed to load products")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddToCart = (product: Product) => {
    addToCart(product)
    alert(`${product.name} added to cart!`)
  }

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product)
    setShowModal(true)
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading products...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Browse Products</h1>
        <div className="text-sm text-gray-600">Cart: {getCartCount()} items</div>
      </div>

      {/* Search Bar */}
      <Card className="p-4 bg-white border border-gray-200">
        <input
          type="text"
          placeholder="Search products by name or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product._id} className="p-4 bg-white border border-gray-200 hover:shadow-lg transition">
            <img
              src={product.image || "/placeholder.svg?height=300&width=300&query=product"}
              alt={product.name}
              className="aspect-square bg-gray-200 rounded-lg mb-3 object-cover w-full"
            />
            <h3 className="font-semibold text-gray-900">{product.name}</h3>
            <p className="text-sm text-gray-500">{product.category}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-bold text-lg text-gray-900">₹{product.price}</span>
              <span className="text-yellow-500">★ {product.rating}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{product.quantity} kg in stock</p>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => handleViewProduct(product)}
                variant="outline"
                size="sm"
                className="flex-1 text-gray-600"
              >
                Details
              </Button>
              <Button
                onClick={() => handleAddToCart(product)}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Add to Cart
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="p-12 bg-white border border-gray-200 text-center">
          <p className="text-gray-500 text-lg">No products found</p>
        </Card>
      )}

      {/* Product Details Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <img
              src={selectedProduct.image || "/placeholder.svg?height=300&width=300&query=product"}
              alt={selectedProduct.name}
              className="w-full aspect-square object-cover rounded-lg mb-4"
            />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{selectedProduct.name}</h2>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-gray-600 text-sm">Category</p>
                <p className="font-semibold text-gray-900">{selectedProduct.category}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Price</p>
                <p className="font-semibold text-lg text-gray-900">₹{selectedProduct.price}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Stock Available</p>
                <p className="font-semibold text-gray-900">{selectedProduct.quantity} kg</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Rating</p>
                <p className="font-semibold text-gray-900">★ {selectedProduct.rating}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  handleAddToCart(selectedProduct)
                  setShowModal(false)
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Add to Cart
              </Button>
              <Button onClick={() => setShowModal(false)} variant="outline" className="flex-1">
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
