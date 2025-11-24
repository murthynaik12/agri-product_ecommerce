import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET ?? "change_this"

export function verifyToken(token?: string) {
  if (!token) return null
  try {
    const payload = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET)
    return payload
  } catch (e) {
    return null
  }
}

export function generateToken(userId: string, role: string, email: string) {
  return jwt.sign({ sub: userId, role, email }, JWT_SECRET, { expiresIn: "7d" })
}
