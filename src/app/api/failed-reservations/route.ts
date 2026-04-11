import { NextRequest, NextResponse } from "next/server"
import { getPendingFailedReservations, markAsRecovered } from "@/lib/services/failed-reservations"

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "admin-recovery-key-2026"

function isAuthenticated(request: NextRequest): boolean {
  const authKey = request.headers.get("x-admin-api-key")
  return authKey === ADMIN_API_KEY
}

export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json(
      { error: "No autorizado", message: "Se requiere autenticación" },
      { status: 401 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")

    const result = await getPendingFailedReservations(limit)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: result.data?.length || 0,
      data: result.data,
    })
  } catch (error) {
    console.error("[API] Error fetching failed reservations:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json(
      { error: "No autorizado", message: "Se requiere autenticación" },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { id, action, recoveredBy } = body

    if (action === "markRecovered" && id && recoveredBy) {
      const result = await markAsRecovered(id, recoveredBy)

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: "Acción no válida" },
      { status: 400 }
    )
  } catch (error) {
    console.error("[API] Error in failed reservations POST:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
