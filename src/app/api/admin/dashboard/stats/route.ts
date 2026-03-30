import { NextRequest, NextResponse } from "next/server"
import { getDashboardStats } from "@/lib/services"
import { getCachedDashboardKPIs } from "@/lib/cache"
import { redisEnabled } from "@/lib/redis"

// GET /api/admin/dashboard/stats - Get enhanced dashboard statistics (con caché)

// GET /api/admin/dashboard/stats - Get enhanced dashboard statistics (con caché)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restaurantId = searchParams.get("restaurantId")
    const date = searchParams.get("date") // Format: YYYY-MM-DD

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Se requiere restaurantId" },
        { status: 400 }
      )
    }

    const targetDate = date || new Date().toISOString().split("T")[0]

    // Usar caché si Redis está disponible
    const stats = await getCachedDashboardKPIs(
      restaurantId,
      targetDate,
      () => getDashboardStats({ restaurantId, date: targetDate })
    )

    console.log(`[Dashboard Stats] date:${targetDate} cached:${redisEnabled()}`)

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    )
  }
}
