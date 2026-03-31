/**
 * Analytics Aggregation Cron Script
 *
 * Se ejecuta vía PM2 cron_restart o directamente
 * Uso: node scripts/analytics-cron.js
 */

const { calculateAndStoreDailyAnalytics, backfillDailyAnalytics } = require("../src/lib/services")
const { db } = require("../src/lib/db")
const { restaurants } = require("../drizzle/schema")

async function main() {
  console.log("📊 Starting analytics aggregation cron...")

  // Obtener ayer
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split("T")[0]

  console.log(`📊 Processing date: ${dateStr}`)

  // Obtener restaurantes activos
  const activeRestaurants = await db.query.restaurants.findMany({
    where: (restaurants, { eq }) => eq(restaurants.isActive, true),
  })

  if (activeRestaurants.length === 0) {
    console.log("No active restaurants found")
    process.exit(0)
  }

  console.log(`📊 Processing ${activeRestaurants.length} restaurants`)

  const results = []

  for (const restaurant of activeRestaurants) {
    try {
      await calculateAndStoreDailyAnalytics({
        restaurantId: restaurant.id,
        date: dateStr,
      })
      results.push({ restaurant: restaurant.name, success: true })
      console.log(`✅ ${restaurant.name}`)
    } catch (error) {
      console.error(`❌ Error processing ${restaurant.name}:`, error)
      results.push({ restaurant: restaurant.name, success: false, error: error.message })
    }
  }

  const successCount = results.filter((r) => r.success).length
  console.log(`📊 Complete: ${successCount}/${results.length} restaurants processed`)

  process.exit(successCount === results.length ? 0 : 1)
}

main().catch((error) => {
  console.error("Fatal error:", error)
  process.exit(1)
})
