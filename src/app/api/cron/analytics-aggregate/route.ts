import { NextRequest, NextResponse } from "next/server"
import { calculateAndStoreDailyAnalytics, backfillDailyAnalytics } from "@/lib/services"
import { db } from "@/lib/db"
import { restaurants } from "@/drizzle/schema"

/**
 * CRON JOB: Agregar analíticas diarias
 *
 * Se ejecuta cada noche para pre-calcular las métricas del día anterior.
 *
 * Uso:
 * - GET /api/cron/analytics-aggregate?date=2024-03-30 (fecha específica)
 * - GET /api/cron/analytics-aggregate (ayer por defecto)
 * - GET /api/cron/analytics-aggregate?backfill=true&startDate=2024-03-01&endDate=2024-03-31
 *
 * Seguridad:
 * - En producción, proteger con API_KEY header o Vercel Cron authentication
 */

// Validación de API Key opcional para producción
const CRON_API_KEY = process.env.CRON_API_KEY

function validateRequest(request: NextRequest): boolean {
  // Si no está configurado, permitir en desarrollo
  if (!CRON_API_KEY && process.env.NODE_ENV === "development") {
    return true
  }

  // Verificar header de autorización
  const authHeader = request.headers.get("authorization")
  const apiKey = authHeader?.replace("Bearer ", "")

  return apiKey === CRON_API_KEY
}

function getYesterday(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split("T")[0]
}

export async function GET(request: NextRequest) {
  try {
    // Validar API Key en producción
    if (!validateRequest(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get("date")
    const backfill = searchParams.get("backfill") === "true"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Obtener todos los restaurantes activos
    const activeRestaurants = await db.query.restaurants.findMany({
      where: (restaurants, { eq }) => eq(restaurants.isActive, true),
    })

    if (activeRestaurants.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active restaurants found",
        processed: 0,
      })
    }

    console.log(`📊 Running analytics aggregation for ${activeRestaurants.length} restaurants`)

    const results: Array<{
      restaurantId: string
      restaurantName: string
      date: string
      success: boolean
      error?: string
    }> = []

    // Procesar cada restaurante
    for (const restaurant of activeRestaurants) {
      try {
        if (backfill && startDate && endDate) {
          // Backfill de rango de fechas
          await backfillDailyAnalytics(restaurant.id, startDate, endDate)
          results.push({
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            date: `${startDate} to ${endDate}`,
            success: true,
          })
        } else {
          // Procesar una fecha específica (o ayer por defecto)
          const targetDate = dateParam || getYesterday()
          await calculateAndStoreDailyAnalytics({
            restaurantId: restaurant.id,
            date: targetDate,
          })
          results.push({
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            date: targetDate,
            success: true,
          })
        }
      } catch (error) {
        console.error(`Error processing ${restaurant.name}:`, error)
        results.push({
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          date: dateParam || getYesterday(),
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    const successCount = results.filter((r) => r.success).length

    return NextResponse.json({
      success: true,
      message: `Processed ${successCount}/${results.length} restaurants`,
      processed: successCount,
      failed: results.length - successCount,
      results,
    })
  } catch (error) {
    console.error("Error in analytics aggregation cron:", error)
    return NextResponse.json(
      {
        error: "Error processing analytics aggregation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * POST para activar manualmente la agregación
 */
export async function POST(request: NextRequest) {
  return GET(request)
}
