import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { restaurants } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

/**
 * POST /api/init/all-restaurants
 * Initialize example restaurants for demo
 */
export async function POST() {
  try {
    // Define example restaurants with valid UUIDs
    const allRestaurants = [
      {
        id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        name: "Restaurante Principal",
        phone: "+34 977 100 111",
        address: "Passeig de la Grava, 15, Cambrils",
        timezone: "Europe/Madrid",
        isActive: true,
      },
      {
        id: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
        name: "Restaurante Centro",
        phone: "+34 977 200 222",
        address: "Plaça de la Font, 8, Tarragona",
        timezone: "Europe/Madrid",
        isActive: true,
      },
      {
        id: "c3d4e5f6-a7b8-9012-cdef-345678901234",
        name: "Restaurante Playa",
        phone: "+34 977 300 333",
        address: "Passeig Marítim, 42, Vila-Seca",
        timezone: "Europe/Madrid",
        isActive: true,
      },
      {
        id: "d4e5f6a7-b8c9-0123-def4-567890123456",
        name: "Bar Lounge",
        phone: "+34 977 400 444",
        address: "Rambla Nova, 25, Cambrils",
        timezone: "Europe/Madrid",
        isActive: true,
      },
    ]

    const results = []

    for (const restaurant of allRestaurants) {
      // Check if exists
      const existing = await db.query.restaurants.findFirst({
        where: (r, { eq }) => eq(r.id, restaurant.id),
      })

      if (existing) {
        // Update
        const [updated] = await db
          .update(restaurants)
          .set({
            name: restaurant.name,
            phone: restaurant.phone,
            address: restaurant.address,
          })
          .where(eq(restaurants.id, restaurant.id))
          .returning()
        results.push({ action: "updated", restaurant: updated })
      } else {
        // Create
        const [created] = await db
          .insert(restaurants)
          .values(restaurant)
          .returning()
        results.push({ action: "created", restaurant: created })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      total: results.length,
    })
  } catch (error) {
    console.error("Error initializing restaurants:", error)
    return NextResponse.json(
      { error: "Error al inicializar restaurantes", details: String(error) },
      { status: 500 }
    )
  }
}
