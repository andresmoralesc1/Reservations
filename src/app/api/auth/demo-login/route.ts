import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const DEMO_AUTH_TOKEN = "demo_auth_token"
const DEMO_USER_ID = "demo_user_id"

export async function POST(request: NextRequest) {
  try {
    const { user } = await request.json()

    if (!user || !user.id) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 })
    }

    const cookieStore = await cookies()

    // Establecer cookie de autenticación con HttpOnly para que el middleware pueda leerla
    cookieStore.set(DEMO_AUTH_TOKEN, "demo_authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    })

    // También guardar el ID del usuario para referencia
    cookieStore.set(DEMO_USER_ID, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in demo-login:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
