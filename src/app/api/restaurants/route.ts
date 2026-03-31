import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { restaurants } from "@/drizzle/schema"

/**
 * GET /api/restaurants
 * Returns all active restaurants for the switcher
 */
export async function GET() {
  try {
    const allRestaurants = await db.query.restaurants.findMany({
      where: (restaurants, { eq }) => eq(restaurants.isActive, true),
      orderBy: (restaurants, { asc }) => [asc(restaurants.name)],
    })

    return NextResponse.json({
      restaurants: allRestaurants,
    })
  } catch (error) {
    console.error("Error fetching restaurants:", error)
    return NextResponse.json(
      { error: "Error al obtener restaurantes", details: String(error) },
      { status: 500 }
    )
  }
}
