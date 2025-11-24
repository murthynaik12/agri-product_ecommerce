"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchProducts } from "@/lib/api-client"

export default function Wishlist() {
  const router = useRouter()
  const [wishlistItems, setWishlistItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadWishlist()
  }, [])

  const loadWishlist = async () => {
    try {
      setIsLoading(true)
      // For now, wishlist is empty - in a real app, you'd fetch from a wishlist API
      // This could be stored in localStorage or a database
      const savedWishlist = localStorage.getItem("wishlist")
      if (savedWishlist) {
        const productIds = JSON.parse(savedWishlist)
        if (productIds.length > 0) {
          const allProducts = await fetchProducts()
          const wishlistProducts = allProducts.filter((p: any) => 
            productIds.includes(p._id?.toString() || p.id)
          )
          setWishlistItems(wishlistProducts)
        }
      }
    } catch (error) {
      console.error("Failed to load wishlist:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFromWishlist = (productId: string) => {
    const savedWishlist = localStorage.getItem("wishlist")
    if (savedWishlist) {
      const productIds = JSON.parse(savedWishlist)
      const updated = productIds.filter((id: string) => id !== productId)
      localStorage.setItem("wishlist", JSON.stringify(updated))
      setWishlistItems(wishlistItems.filter((p) => (p._id || p.id) !== productId))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600 mt-1">Your saved items for later</p>
        </div>
        <div className="text-center py-8">Loading wishlist...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
        <p className="text-gray-600 mt-1">Your saved items for later</p>
      </div>

      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlistItems.map((product) => (
            <Card key={product._id || product.id} className="p-4 bg-white border border-gray-200 hover:shadow-md transition">
              <img
                src={product.image || "/placeholder.svg?height=250&width=250&query=product"}
                alt={product.name}
                className="aspect-square bg-gray-200 rounded-lg mb-3 object-cover w-full"
              />
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500">{product.category}</p>
              <div className="flex justify-between items-center mt-3">
                <span className="font-bold text-gray-900">₹{product.price}</span>
                <span className="text-yellow-500">★ {product.rating || 0}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={() => alert(`Added ${product.name} to cart!`)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-1"
                >
                  Add to Cart
                </Button>
                <Button
                  onClick={() => handleRemoveFromWishlist(product._id || product.id)}
                  variant="outline"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50 text-sm py-1"
                >
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 bg-white border border-gray-200 text-center">
          <div className="text-5xl mb-4">❤️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-600 mb-6">Add items to your wishlist to save them for later</p>
          <Button
            onClick={() => router.push("/customer/products")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Browse Products
          </Button>
        </Card>
      )}
    </div>
  )
}
