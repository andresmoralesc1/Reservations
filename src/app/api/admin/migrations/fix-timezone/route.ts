import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { restaurants } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

/**
 * Migration: Fix timezone from America/Bogota to Europe/Madrid
 * GET /api/admin/migrations/fix-timezone
 */
export async function GET() {
  try {
    console.log('🔧 Fixing timezone for restaurants...\n')

    // Check current restaurants
    const allRestaurants = await db.query.restaurants.findMany()

    console.log(`📋 Found ${allRestaurants.length} restaurants:`)
    allRestaurants.forEach(r => {
      console.log(`   - ${r.name}: ${r.timezone}`)
    })

    // Update timezone for restaurants with America/Bogota
    const toUpdate = allRestaurants.filter(r =>
      r.timezone === 'America/Bogota' || !r.timezone
    )

    if (toUpdate.length === 0) {
      return NextResponse.json({
        success: true,
        message: '✅ No restaurants need timezone update',
        restaurants: allRestaurants.map(r => ({
          name: r.name,
          timezone: r.timezone
        }))
      })
    }

    // Update each restaurant
    const updated = []
    for (const restaurant of toUpdate) {
      const [updatedRestaurant] = await db
        .update(restaurants)
        .set({
          timezone: 'Europe/Madrid',
          updatedAt: new Date()
        })
        .where(eq(restaurants.id, restaurant.id))
        .returning()

      updated.push(updatedRestaurant)
      console.log(`✅ Updated: ${updatedRestaurant.name} → Europe/Madrid`)
    }

    // Verify the update
    const verify = await db.query.restaurants.findMany()

    return NextResponse.json({
      success: true,
      message: `✅ Updated ${updated.length} restaurant(s) timezone to Europe/Madrid`,
      updated: updated.map(r => ({
        name: r.name,
        oldTimezone: 'America/Bogota',
        newTimezone: r.timezone
      })),
      allRestaurants: verify.map(r => ({
        name: r.name,
        timezone: r.timezone
      }))
    })

  } catch (error) {
    console.error('❌ Error fixing timezone:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
