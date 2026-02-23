import { db } from "@/lib/db"
import { services, tables } from "@/drizzle/schema"
import { eq, sql } from "drizzle-orm"

const RESTAURANT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

export async function GET() {
  try {
    const [allServices, allTables, tableCount] = await Promise.all([
      db.query.services.findMany({
        where: eq(services.restaurantId, RESTAURANT_ID),
      }),
      db.query.tables.findMany({
        where: eq(tables.restaurantId, RESTAURANT_ID),
      }),
      db.select({ count: sql<number>`count(*)`.as("count") }).from(tables).where(eq(tables.restaurantId, RESTAURANT_ID)),
    ])

    return Response.json({
      restaurantId: RESTAURANT_ID,
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
}
