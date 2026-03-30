import { NextRequest, NextResponse } from "next/server"
import { getChartData } from "@/lib/services"

// GET /api/admin/dashboard/chart-data - Get data for charts
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

    const chartData = await getChartData({
      restaurantId,
      date: date || new Date().toISOString().split("T")[0],
    })

    return NextResponse.json(chartData)
  } catch (error) {
    console.error("Error fetching chart data:", error)
    return NextResponse.json(
      { error: "Error al obtener datos de gráficos" },
      { status: 500 }
    )
  }
}
