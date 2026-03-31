/**
 * Script para hacer backfill de analíticas diarias
 * Puebla la tabla daily_analytics con datos históricos
 *
 * Uso:
 * npx tsx scripts/backfill-analytics.ts <restaurant_id> <start_date> <end_date>
 *
 * Ejemplo:
 * npx tsx scripts/backfill-analytics.ts "abc-123" "2024-03-01" "2024-03-31"
 */

import * as dotenv from "dotenv"
import { backfillDailyAnalytics } from "../src/lib/services"

dotenv.config({ path: ".env.local" })

async function main() {
  const args = process.argv.slice(2)

  if (args.length < 3) {
    console.error("Usage: npx tsx scripts/backfill-analytics.ts <restaurant_id> <start_date> <end_date>")
    console.error("Example: npx tsx scripts/backfill-analytics.ts \"abc-123\" \"2024-03-01\" \"2024-03-31\"")
    process.exit(1)
  }

  const [restaurantId, startDate, endDate] = args

  console.log(`📊 Starting backfill for restaurant ${restaurantId}`)
  console.log(`📊 Date range: ${startDate} to ${endDate}`)

  await backfillDailyAnalytics(restaurantId, startDate, endDate)

  console.log("✅ Backfill complete!")
}

main().catch(console.error)
