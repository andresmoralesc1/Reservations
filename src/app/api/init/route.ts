import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { restaurants } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

// The restaurant ID used by demo users
const DEMO_RESTAURANT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

// GET /api/init - Initialize default restaurant if none exists
export async function GET() {
  try {
    // Check if the demo restaurant exists
    const demoRestaurant = await db.query.restaurants.findFirst({
      where: (restaurants, { eq }) => eq(restaurants.id, DEMO_RESTAURANT_ID),
    })

    if (demoRestaurant) {
      return NextResponse.json({
        restaurant: demoRestaurant,
        created: false,
      })
    }

    // Create default restaurant with the demo ID
    const [created] = await db
      .insert(restaurants)
      .values({
        id: DEMO_RESTAURANT_ID,
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
