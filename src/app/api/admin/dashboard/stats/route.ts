import { NextRequest, NextResponse } from "next/server"
import { getDashboardStats } from "@/lib/services"

// GET /api/admin/dashboard/stats - Get enhanced dashboard statistics
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

    const stats = await getDashboardStats({
      restaurantId,
      date: date || new Date().toISOString().split("T")[0],
    })

    console.log("[Dashboard Stats] date:", date || "today", "result:", stats)

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    )
  }
}
