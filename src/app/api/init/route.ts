import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { restaurants } from "@/drizzle/schema"

// GET /api/init - Initialize default restaurant if none exists
export async function GET() {
  try {
    // Check if any restaurant exists
    const existingRestaurants = await db.query.restaurants.findMany()

    if (existingRestaurants.length > 0) {
      return NextResponse.json({
        restaurant: existingRestaurants[0],
        created: false,
      })
    }

    // Create default restaurant
    const [created] = await db
      .insert(restaurants)
      .values({
        name: "El Posit",
        phone: "+57 300 123 4567",
        address: "Carrera 7 #123-45, Bogotá",
        timezone: "America/Bogota",
        isActive: true,
      })
      .returning()

    return NextResponse.json({
      restaurant: created,
      created: true,
    })
  } catch (error) {
    console.error("Error initializing restaurant:", error)
    return NextResponse.json(
      { error: "Error al inicializar restaurante" },
      { status: 500 }
    )
  }
}
