import { db } from "@/lib/db"
import { config } from "@/lib/config/env"
import { withDebugProtection } from "@/middleware/debug-protection"
import { services, tables } from "@/drizzle/schema"
import { eq, sql } from "drizzle-orm"

// Restaurant ID from config

export const GET = withDebugProtection(async () => {
  try {
    const [allServices, allTables, tableCount] = await Promise.all([
      db.query.services.findMany({
        where: eq(services.restaurantId, config.restaurantId),
      }),
      db.query.tables.findMany({
        where: eq(tables.restaurantId, config.restaurantId),
      }),
      db.select({ count: sql<number>`count(*)`.as("count") }).from(tables).where(eq(tables.restaurantId, config.restaurantId)),
    ])

    return Response.json({
      restaurantId: config.restaurantId,
      tables: {
        count: tableCount[0]?.count || 0,
        tables: allTables.map(t => ({
          tableCode: t.tableCode,
          capacity: t.capacity,
          location: t.location,
        }))
      },
      services: {
        count: allServices.length,
        active: allServices.filter(s => s.isActive).length,
        services: allServices.map(s => ({
          name: s.name,
          isActive: s.isActive,
          dayType: s.dayType,
          startTime: s.startTime,
          endTime: s.endTime,
          dateRange: s.dateRange,
        }))
      }
    })
  } catch (error) {
    console.error("Error:", error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
})
