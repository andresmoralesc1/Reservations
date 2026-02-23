import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { services } from "@/drizzle/schema"

/**
 * GET /api/admin/services/debug
 * Debug endpoint to check what's in the database
 */
export async function GET() {
  try {
    // Get ALL services without any filters
    const allServices = await db.query.services.findMany({
      with: {
        restaurant: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      count: allServices.length,
      services: allServices.map(s => ({
        id: s.id,
        name: s.name,
        restaurantId: s.restaurantId,
        restaurantName: s.restaurant?.name || "N/A",
        isActive: s.isActive,
        serviceType: s.serviceType,
        dayType: s.dayType,
        startTime: s.startTime,
        endTime: s.endTime,
        createdAt: s.createdAt,
      })),
    })
  } catch (error: any) {
    console.error("[DEBUG] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.toString(),
      },
      { status: 500 }
    )
  }
}
