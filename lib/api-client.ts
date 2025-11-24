// Utility functions for API calls to MongoDB endpoints

export async function fetchUsers(role?: string) {
  const url = new URL("/api/users", window.location.origin)
  if (role) url.searchParams.append("role", role)

  const response = await fetch(url.toString())
  if (!response.ok) throw new Error("Failed to fetch users")
  return response.json()
}

export async function createUser(user: any) {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  })
  if (!response.ok) throw new Error("Failed to create user")
  return response.json()
}

export async function updateUser(id: string, user: any) {
  const response = await fetch(`/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  })
  if (!response.ok) throw new Error("Failed to update user")
  return response.json()
}

export async function deleteUser(id: string) {
  const response = await fetch(`/api/users/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to delete user" }))
    throw new Error(errorData.error || "Failed to delete user")
  }
  return response.json()
}

export async function fetchProducts(farmerId?: string, category?: string) {
  const url = new URL("/api/products", window.location.origin)
  if (farmerId) url.searchParams.append("farmerId", farmerId)
  if (category) url.searchParams.append("category", category)

  const response = await fetch(url.toString())
  if (!response.ok) throw new Error("Failed to fetch products")
  return response.json()
}

export async function createProduct(product: any) {
  const response = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || "Failed to create product")
  }
  return response.json()
}

export async function updateProduct(id: string, product: any) {
  const response = await fetch(`/api/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product),
  })
  if (!response.ok) throw new Error("Failed to update product")
  return response.json()
}

export async function deleteProduct(id: string) {
  const response = await fetch(`/api/products/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) throw new Error("Failed to delete product")
  return response.json()
}

export async function fetchOrders(customerId?: string, farmerId?: string, status?: string) {
  const url = new URL("/api/orders", window.location.origin)
  if (customerId) url.searchParams.append("customerId", customerId)
  if (farmerId) url.searchParams.append("farmerId", farmerId)
  if (status) url.searchParams.append("status", status)

  const response = await fetch(url.toString())
  if (!response.ok) throw new Error("Failed to fetch orders")
  return response.json()
}

export async function createOrder(order: any) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  })
  if (!response.ok) throw new Error("Failed to create order")
  return response.json()
}

export async function updateOrder(id: string, order: any) {
  const response = await fetch(`/api/orders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  })
  if (!response.ok) throw new Error("Failed to update order")
  return response.json()
}

export async function fetchDeliveries(agentId?: string, status?: string) {
  const url = new URL("/api/deliveries", window.location.origin)
  if (agentId) url.searchParams.append("agentId", agentId)
  if (status) url.searchParams.append("status", status)

  const response = await fetch(url.toString())
  if (!response.ok) throw new Error("Failed to fetch deliveries")
  return response.json()
}

export async function createDelivery(delivery: any) {
  const response = await fetch("/api/deliveries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(delivery),
  })
  if (!response.ok) throw new Error("Failed to create delivery")
  return response.json()
}

export async function updateDelivery(id: string, delivery: any) {
  const response = await fetch(`/api/deliveries/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(delivery),
  })
  if (!response.ok) throw new Error("Failed to update delivery")
  return response.json()
}
