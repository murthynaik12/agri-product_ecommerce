"use server"

export async function registerUser(formData: {
  name: string
  email: string
  phoneNumber: string
  password: string
  role: string
}) {
  try {
    if (!formData.name || !formData.email || !formData.phoneNumber || !formData.password) {
      return { success: false, error: "All fields are required" }
    }

    if (formData.password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      return { success: false, error: "Please enter a valid email address" }
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phoneNumber,
        password: formData.password,
        role: formData.role,
      }),
      cache: "no-store",
    })

    const data = await response.json()

    if (data.success) {
      return {
        success: true,
        message: "Registration successful",
        user: data.user,
      }
    } else {
      return {
        success: false,
        error: data.error || "Registration failed",
      }
    }
  } catch (error) {
    console.error("Registration error:", error)
    return {
      success: false,
      error: "Network error. Please try again.",
    }
  }
}
