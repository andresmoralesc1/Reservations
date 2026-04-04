import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const DEMO_AUTH_TOKEN = "demo_auth_token"
const DEMO_USER_ID = "demo_user_id"

export async function POST() {
  try {
    const cookieStore = await cookies()

    // Eliminar cookies de autenticación
    cookieStore.delete(DEMO_AUTH_TOKEN)
    cookieStore.delete(DEMO_USER_ID)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in demo-logout:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
