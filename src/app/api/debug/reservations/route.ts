import { db } from "@/lib/db"
import { withDebugProtection } from "@/middleware/debug-protection"
import { reservations } from "@/drizzle/schema"
import { desc } from "drizzle-orm"

export const GET = withDebugProtection(async () => {
  try {
    const allReservations = await db.query.reservations.findMany({
      orderBy: [desc(reservations.createdAt)],
      limit: 20,
    })

    return Response.json({
      count: allReservations.length,
      reservations: allReservations.map(r => ({
        code: r.reservationCode,
        date: r.reservationDate,
        time: r.reservationTime,
        status: r.status,
        source: r.source,
        customer: r.customerName,
        partySize: r.partySize,
        restaurantId: r.restaurantId,
      }))
    })
  } catch (error) {
    console.error("Error:", error)
    return Response.json({ error: String(error) }, { status: 500 })
  }
})
