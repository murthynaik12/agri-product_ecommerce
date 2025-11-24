import { getCollection } from "./db"
import { ObjectId } from "mongodb"

export async function getOrderWithFarmer(orderId: string) {
  const ordersCollection = await getCollection("orders")
  const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) })

  if (!order) return null

  const usersCollection = await getCollection("users")
  const farmer = await usersCollection.findOne({ _id: new ObjectId(order.farmerId) })

  return { ...order, farmer }
}

export async function getDeliveryWithAgent(deliveryId: string) {
  const deliveriesCollection = await getCollection("deliveries")
  const delivery = await deliveriesCollection.findOne({ _id: new ObjectId(deliveryId) })

  if (!delivery) return null

  const usersCollection = await getCollection("users")
  const agent = await usersCollection.findOne({ _id: new ObjectId(delivery.deliveryAgentId) })

  return { ...delivery, agent }
}

export async function getOrdersForFarmer(farmerId: string) {
  const ordersCollection = await getCollection("orders")
  return ordersCollection.find({ farmerId: new ObjectId(farmerId) }).toArray()
}

export async function getOrdersForCustomer(customerId: string) {
  const ordersCollection = await getCollection("orders")
  return ordersCollection.find({ customerId: new ObjectId(customerId) }).toArray()
}

export async function getDeliveriesForAgent(agentId: string) {
  const deliveriesCollection = await getCollection("deliveries")
  return deliveriesCollection.find({ deliveryAgentId: new ObjectId(agentId) }).toArray()
}

export async function getProductsForFarmer(farmerId: string) {
  const productsCollection = await getCollection("products")
  return productsCollection.find({ farmerId: new ObjectId(farmerId) }).toArray()
}
