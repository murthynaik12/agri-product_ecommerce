import type { Product } from "./models/Product"
import type { Order } from "./models/Order"

// In-memory storage
let productsStore: Product[] = []
let productIdCounter = 1
let ordersStore: Order[] = []
let orderIdCounter = 1

// Mock data to start with
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Organic Wheat",
    description: "Premium quality organic wheat grown without pesticides",
    category: "Grains",
    price: 45,
    unit: "kg",
    quantity: 500,
    image: "/golden-wheat-field.png",
    farmerId: "farmer1",
    rating: 4.5,
    reviews: 23,
    inStock: true,
    status: "active",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "Fresh Tomatoes",
    description: "Juicy red tomatoes freshly harvested",
    category: "Vegetables",
    price: 60,
    unit: "kg",
    quantity: 200,
    image: "/ripe-tomatoes.png",
    farmerId: "farmer1",
    rating: 4.8,
    reviews: 45,
    inStock: true,
    status: "active",
    createdAt: new Date("2024-01-16"),
    updatedAt: new Date("2024-01-16"),
  },
  {
    id: "3",
    name: "Basmati Rice",
    description: "Aromatic basmati rice with long grains",
    category: "Grains",
    price: 120,
    unit: "kg",
    quantity: 300,
    image: "/bowl-of-steamed-rice.png",
    farmerId: "farmer2",
    rating: 4.7,
    reviews: 67,
    inStock: true,
    status: "active",
    createdAt: new Date("2024-01-14"),
    updatedAt: new Date("2024-01-14"),
  },
]

const mockOrders: Order[] = [
  {
    _id: "6920762b",
    customerId: "customer1",
    customerName: "John Doe",
    farmerId: "farmer1",
    items: [
      {
        productId: "1",
        productName: "Organic Wheat",
        quantity: 10,
        price: 45,
        farmerId: "farmer1",
      },
    ],
    totalAmount: 450,
    status: "pending",
    paymentStatus: "pending",
    shippingAddress: "123 Main St, City",
    orderDate: new Date("2025-11-22"),
  },
  {
    _id: "692076bc",
    customerId: "customer2",
    customerName: "Jane Smith",
    farmerId: "farmer1",
    items: [
      {
        productId: "2",
        productName: "Fresh Tomatoes",
        quantity: 5,
        price: 60,
        farmerId: "farmer1",
      },
    ],
    totalAmount: 300,
    status: "pending",
    paymentStatus: "pending",
    shippingAddress: "456 Oak Ave, Town",
    orderDate: new Date("2025-11-22"),
  },
]

// Initialize with mock data
if (productsStore.length === 0) {
  productsStore = [...mockProducts]
  productIdCounter = 4
}

if (ordersStore.length === 0) {
  ordersStore = [...mockOrders]
  orderIdCounter = 3
}

export const memoryStorage = {
  products: {
    find: (filter: any = {}) => {
      let results = [...productsStore]

      if (filter.farmerId) {
        results = results.filter((p) => p.farmerId === filter.farmerId)
      }

      if (filter.category) {
        results = results.filter((p) => p.category === filter.category)
      }

      return results.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
    },

    findById: (id: string) => {
      return productsStore.find((p) => p.id === id || p.id === String(id)) || null
    },

    create: (productData: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
      const newProduct: Product = {
        ...productData,
        id: String(productIdCounter++),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      productsStore.push(newProduct)
      return newProduct
    },

    update: (id: string, productData: Partial<Product>) => {
      const index = productsStore.findIndex((p) => p.id === id || p.id === String(id))
      if (index === -1) return null

      productsStore[index] = {
        ...productsStore[index],
        ...productData,
        id: productsStore[index].id,
        updatedAt: new Date(),
      }
      return productsStore[index]
    },

    delete: (id: string) => {
      const index = productsStore.findIndex((p) => p.id === id || p.id === String(id))
      if (index === -1) return null

      const deleted = productsStore[index]
      productsStore.splice(index, 1)
      return deleted
    },
  },

  getOrders: () => [...ordersStore],

  addOrder: (orderData: Omit<Order, "_id">) => {
    const newOrder: Order = {
      ...orderData,
      _id: String(orderIdCounter++),
    }
    ordersStore.push(newOrder)
    return newOrder
  },

  updateOrder: (id: string, orderData: Partial<Order>) => {
    const index = ordersStore.findIndex((o) => o._id === id)
    if (index === -1) return null

    ordersStore[index] = {
      ...ordersStore[index],
      ...orderData,
    }
    return ordersStore[index]
  },

  deleteOrder: (id: string) => {
    const index = ordersStore.findIndex((o) => o._id === id)
    if (index === -1) return false

    ordersStore.splice(index, 1)
    return true
  },
}
