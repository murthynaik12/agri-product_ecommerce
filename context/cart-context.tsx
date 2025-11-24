"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

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
  farmerId?: string // Include farmerId
  image?: string
}

interface CartItem extends Product {
  cartQuantity: number
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error("Failed to load cart:", error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart))
  }, [cart])

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const productId = product._id || product.id || ""
      
      // Normalize IDs for comparison (handle both string and ObjectId formats)
      const existingItem = prevCart.find((item) => {
        const itemId = String(item._id || item.id || "")
        const compareId = String(productId)
        return itemId === compareId
      })

      if (existingItem) {
        return prevCart.map((item) => {
          const itemId = String(item._id || item.id || "")
          const compareId = String(productId)
          return itemId === compareId 
            ? { ...item, cartQuantity: (item.cartQuantity || 0) + 1 } 
            : item
        })
      }

      // Ensure product has both _id and id fields for compatibility
      const productToAdd = {
        ...product,
        _id: product._id || product.id,
        id: product.id || product._id,
        cartQuantity: 1,
      }

      return [...prevCart, productToAdd]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => (item._id || item.id) !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart((prevCart) =>
      prevCart.map((item) => ((item._id || item.id) === productId ? { ...item, cartQuantity: quantity } : item)),
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.cartQuantity, 0)
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.cartQuantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
