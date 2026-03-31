/**
 * Backfill Analytics Script (JavaScript version)
 *
 * Uso: node scripts/backfill-analytics.js <restaurant_id> <start_date> <end_date>
 * Ejemplo: node scripts/backfill-analytics.js "abc-123" "2024-03-01" "2024-03-31"
 */

const { db } = require("../src/lib/db")
const { reservations, dailyAnalytics } = require("../drizzle/schema")
const { eq, and, sql } = require("drizzle-orm")

async function calculateAndStoreDailyAnalytics({ restaurantId, date }) {
  console.log(`📊 Calculating for ${date}`)

  const dayReservations = await db.query.reservations.findMany({
    where: and(
      eq(reservations.restaurantId, restaurantId),
      eq(reservations.reservationDate, date)
    ),
  })

  const confirmedCount = dayReservations.filter((r) => r.status === "CONFIRMADO").length
  const pendingCount = dayReservations.filter((r) => r.status === "PENDIENTE").length
  const cancelledCount = dayReservations.filter((r) => r.status === "CANCELADO").length
  const noShowCount = dayReservations.filter((r) => r.status === "NO_SHOW").length

  const nonCancelled = dayReservations.filter((r) => r.status !== "CANCELADO")
  const totalCovers = nonCancelled.reduce((sum, r) => sum + r.partySize, 0)
  const avgPartySize = nonCancelled.length > 0
    ? Math.round((totalCovers / nonCancelled.length) * 10)
    : null

  const sourceBreakdown = {}
  for (const res of dayReservations) {
    sourceBreakdown[res.source] = (sourceBreakdown[res.source] || 0) + 1
  }

  const hourlyMap = new Map()
  for (let h = 13; h <= 23; h++) {
    hourlyMap.set(h, { count: 0, covers: 0 })
  }

  for (const res of dayReservations) {
    const hour = parseInt(res.reservationTime.split(":")[0], 10)
    const current = hourlyMap.get(hour) || { count: 0, covers: 0 }
    current.count++
    if (res.status !== "CANCELADO") {
      current.covers += res.partySize
    }
    hourlyMap.set(hour, current)
  }

  const hourlyBreakdown = Array.from(hourlyMap.entries())
    .filter(([_, data]) => data.count > 0)
    .map(([hour, data]) => ({ hour, ...data }))

  const totalActive = confirmedCount + pendingCount
  const confirmationRate = totalActive > 0
    ? Math.round((confirmedCount / totalActive) * 100)
    : 0

  const noShowRate = confirmedCount > 0
    ? Math.round((noShowCount / confirmedCount) * 100)
    : 0

  await db.insert(dailyAnalytics)
    .values({
      restaurantId,
      date,
      totalReservations: dayReservations.length,
      confirmedCount,
      pendingCount,
      cancelledCount,
      noShowCount,
      totalCovers,
      avgPartySize,
      sourceBreakdown,
      hourlyBreakdown,
      confirmationRate,
      noShowRate,
      calculatedAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [dailyAnalytics.restaurantId, dailyAnalytics.date],
      set: {
        totalReservations: dayReservations.length,
        confirmedCount,
        pendingCount,
        cancelledCount,
        noShowCount,
        totalCovers,
        avgPartySize,
        sourceBreakdown,
        hourlyBreakdown,
        confirmationRate,
        noShowRate,
        calculatedAt: new Date(),
        updatedAt: new Date(),
      },
    })

  console.log(`  ✅ ${dayReservations.length} reservations`)
}

async function backfillDailyAnalytics(restaurantId, startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  let count = 0
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0]
    await calculateAndStoreDailyAnalytics({ restaurantId, date: dateStr })
    count++
  }

  console.log(`✅ Backfill complete: ${count} days from ${startDate} to ${endDate}`)
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 3) {
    console.error("Usage: node scripts/backfill-analytics.js <restaurant_id> <start_date> <end_date>")
    console.error('Example: node scripts/backfill-analytics.js "abc-123" "2024-03-01" "2024-03-31"')
    process.exit(1)
  }

  const [restaurantId, startDate, endDate] = args

  console.log(`📊 Starting backfill for restaurant ${restaurantId}`)
  console.log(`📊 Date range: ${startDate} to ${endDate}`)

  await backfillDailyAnalytics(restaurantId, startDate, endDate)

  console.log("✅ Done!")
  process.exit(0)
}

main().catch((error) => {
  console.error("Error:", error)
  process.exit(1)
})
