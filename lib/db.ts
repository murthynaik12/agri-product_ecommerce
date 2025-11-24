import clientPromise from "./mongodb"
import type { Db } from "mongodb"

let db: Db | null = null

export async function getDatabase(): Promise<Db> {
  if (!db) {
    const client = await clientPromise
    db = client.db("agritrade")
  }
  return db
}

export async function getCollection(collectionName: string) {
  const database = await getDatabase()
  return database.collection(collectionName)
}
