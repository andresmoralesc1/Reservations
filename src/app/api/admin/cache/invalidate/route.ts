import { NextRequest, NextResponse } from "next/server"
import { invalidateReservationCache, invalidateRestaurantCache } from "@/lib/cache"

// POST /api/admin/cache/invalidate - Invalidar caché manualmente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantId, reservationDate, type } = body

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Se requiere restaurantId" },
        { status: 400 }
      )
    }

    if (type === "all") {
      // Invalidar todo el caché del restaurante
      await invalidateRestaurantCache(restaurantId)
      return NextResponse.json({
        success: true,
        message: `Caché invalidado para restaurante ${restaurantId}`,
        type: "all",
      })
    }

    // Invalidar caché por fecha
    const date = reservationDate || new Date().toISOString().split("T")[0]
    await invalidateReservationCache(restaurantId, date)

    return NextResponse.json({
      success: true,
      message: `Caché invalidado para restaurante ${restaurantId}, fecha ${date}`,
      type: "date",
    })
  } catch (error) {
    console.error("Error invalidating cache:", error)
    return NextResponse.json(
      { error: "Error al invalidar caché" },
      { status: 500 }
    )
  }
}
