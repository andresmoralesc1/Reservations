import { db } from "@/lib/db"
import { withDebugProtection } from "@/middleware/debug-protection"
import { tables } from "@/drizzle/schema"

export const GET = withDebugProtection(async () => {
  try {
    const allTables = await db.query.tables.findMany({
      orderBy: (tables, { asc }) => [asc(tables.tableNumber)],
    })

    return Response.json({
      count: allTables.length,
      tables: allTables.map(t => ({
        id: t.id,
        tableNumber: t.tableNumber,
        tableCode: t.tableCode,
        capacity: t.capacity,
        location: t.location,
        restaurantId: t.restaurantId,
      }))
    })
  } catch (error) {
    console.error("Error:", error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
})
