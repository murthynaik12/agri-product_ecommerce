import type {
  FarmerProfile,
  CustomerProfile,
  DeliveryAgent,
  AdminUser,
  Product,
  Order,
  Delivery,
  Review,
} from "./types"

export const mockUsers = {
  farmer: {
    id: "farmer1",
    name: "Rajesh Kumar",
    email: "rajesh@agritrade.com",
    role: "farmer" as const,
    phone: "+91 98765 43210",
    avatar: "/diverse-farmers-harvest.png",
    createdAt: "2024-01-15",
    farmName: "Green Valley Farms",
    location: "Punjab",
    latitude: 30.901,
    longitude: 75.8573,
    totalProducts: 24,
    rating: 4.8,
    yearsExperience: 12,
  } as FarmerProfile,

  customer: {
    id: "customer1",
    name: "Priya Singh",
    email: "priya@gmail.com",
    role: "customer" as const,
    phone: "+91 87654 32109",
    avatar: "/diverse-customer-group.png",
    createdAt: "2024-02-20",
    address: "New Delhi",
    latitude: 28.7041,
    longitude: 77.1025,
    totalOrders: 18,
    spentAmount: 15000,
  } as CustomerProfile,

  delivery: {
    id: "delivery1",
    name: "Amit Sharma",
    email: "amit@delivery.com",
    role: "delivery" as const,
    phone: "+91 76543 21098",
    avatar: "/package-delivery.png",
    createdAt: "2024-03-10",
    vehicleType: "Motorcycle",
    licensePlate: "DL01AB1234",
    onlineStatus: true,
    totalDeliveries: 156,
    rating: 4.9,
  } as DeliveryAgent,

  admin: {
    id: "admin1",
    name: "Admin User",
    email: "admin@agritrade.com",
    role: "admin" as const,
    avatar: "/admin-interface.png",
    createdAt: "2024-01-01",
    permissions: ["view_all", "manage_users", "manage_products", "manage_orders"],
    department: "Management",
  } as AdminUser,
}

export const mockProducts: Product[] = [
  {
    id: "prod1",
    farmerId: "farmer1",
    farmerName: "Green Valley Farms",
    name: "Organic Wheat",
    category: "Grains",
    description: "High-quality organic wheat from Punjab",
    price: 45,
    quantity: 500,
    unit: "kg",
    image: "/organic-wheat-grains-golden.jpg",
    rating: 4.7,
    reviews: 23,
    inStock: true,
    createdAt: "2024-10-01",
  },
  {
    id: "prod2",
    farmerId: "farmer1",
    farmerName: "Green Valley Farms",
    name: "Fresh Tomatoes",
    category: "Vegetables",
    description: "Ripe, fresh tomatoes directly from farm",
    price: 35,
    quantity: 200,
    unit: "kg",
    image: "/fresh-red-tomatoes.jpg",
    rating: 4.5,
    reviews: 15,
    inStock: true,
    createdAt: "2024-10-02",
  },
  {
    id: "prod3",
    farmerId: "farmer2",
    farmerName: "Golden Harvest",
    name: "Basmati Rice",
    category: "Grains",
    description: "Premium basmati rice with excellent aroma",
    price: 120,
    quantity: 300,
    unit: "kg",
    image: "/basmati-rice-premium.jpg",
    rating: 4.9,
    reviews: 42,
    inStock: true,
    createdAt: "2024-10-03",
  },
]

export const mockOrders: Order[] = [
  {
    id: "order1",
    customerId: "customer1",
    customerName: "Priya Singh",
    items: [{ productId: "prod1", productName: "Organic Wheat", quantity: 10, price: 45, farmerId: "farmer1" }],
    totalAmount: 450,
    status: "delivered",
    deliveryAgentId: "delivery1",
    paymentStatus: "paid",
    createdAt: "2024-11-01",
    estimatedDelivery: "2024-11-05",
    actualDelivery: "2024-11-05",
  },
  {
    id: "order2",
    customerId: "customer1",
    customerName: "Priya Singh",
    items: [
      { productId: "prod2", productName: "Fresh Tomatoes", quantity: 5, price: 35, farmerId: "farmer1" },
      { productId: "prod3", productName: "Basmati Rice", quantity: 2, price: 120, farmerId: "farmer2" },
    ],
    totalAmount: 415,
    status: "in-transit",
    deliveryAgentId: "delivery1",
    paymentStatus: "paid",
    createdAt: "2024-11-15",
    estimatedDelivery: "2024-11-18",
  },
]

export const mockDeliveries: Delivery[] = [
  {
    id: "del1",
    orderId: "order2",
    agentId: "delivery1",
    agentName: "Amit Sharma",
    status: "in-transit",
    currentLocation: "Sector 12, Noida",
    estimatedArrival: "2024-11-18, 4:30 PM",
    createdAt: "2024-11-17",
  },
]

export const mockReviews: Review[] = [
  {
    id: "review1",
    productId: "prod1",
    customerId: "customer1",
    customerName: "Priya Singh",
    rating: 5,
    comment: "Excellent quality wheat, very fresh!",
    createdAt: "2024-11-06",
  },
  {
    id: "review2",
    productId: "prod1",
    customerId: "customer2",
    customerName: "Ankit Verma",
    rating: 4,
    comment: "Good quality, fast delivery",
    createdAt: "2024-11-07",
  },
]

export const products: any[] = mockProducts.map((p) => ({
  ...p,
  _id: p.id,
}))

console.log("Mock data initialized with products:", products.length)

export function addProduct(product: any) {
  console.log("Adding product:", product.name)
  products.push(product)
  console.log("Total products after add:", products.length)
  return product
}

export function updateProductById(id: string, updates: any) {
  console.log("Updating product ID:", id)
  const index = products.findIndex((p) => p._id === id || p.id === id)
  if (index !== -1) {
    products[index] = { ...products[index], ...updates }
    console.log("Product updated:", products[index].name)
    return products[index]
  }
  console.log("Product not found for update:", id)
  return null
}

export function deleteProductById(id: string) {
  console.log("Attempting to delete product with ID:", id)
  console.log("Current products count:", products.length)

  const index = products.findIndex((p) => p._id === id || p.id === id)

  console.log("Found product at index:", index)

  if (index !== -1) {
    const deleted = products.splice(index, 1)[0]
    console.log("Product deleted:", deleted.name)
    console.log("Remaining products count:", products.length)
    return deleted
  }

  console.log("Product not found with ID:", id)
  return null
}
