"use server"

export async function loginUser(email: string, password: string, expectedRole?: string) {
  try {
    if (!email || !password) {
      return {
        success: false,
        message: "Email and password are required",
        role: null,
        user: null,
        token: null,
      }
    }

    const normalizedEmail = email.trim().toLowerCase()

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
        expectedRole, // Pass expected role for verification
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        message: error.error || "Invalid email or password",
        role: null,
        user: null,
        token: null,
      }
    }

    const data = await response.json()

    // Verify role matches if expected role was provided
    if (expectedRole && data.user.role !== expectedRole) {
      return {
        success: false,
        message: `This account is registered as ${data.user.role}, not ${expectedRole}. Please select the correct role.`,
        role: null,
        user: null,
        token: null,
      }
    }

    return {
      success: true,
      message: "Login successful",
      token: data.token,
      user: data.user,
      role: data.user.role,
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      success: false,
      message: "Network error. Please try again.",
      role: null,
      user: null,
      token: null,
    }
  }
}
