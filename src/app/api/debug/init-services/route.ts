import { NextResponse } from "next/server"
import { withDebugProtection } from "@/middleware/debug-protection"
import { db } from "@/lib/db"
import { services } from "@/drizzle/schema"
import { config } from "@/lib/config/env"

export const GET = withDebugProtection(async () => {
  try {
    // Check if services already exist
    const existing = await db.query.services.findMany({
      columns: { id: true },
      where: (services, { eq }) => eq(services.restaurantId, config.restaurantId),
    })

    if (existing.length > 0) {
      return NextResponse.json({
        error: "Ya existen servicios. Ve a /admin/services para gestionarlos.",
        existingCount: existing.length,
      })
    }

    const servicesToCreate = [
      // Comida Invierno (Octubre - Abril, Lunes-Viernes)
      {
        restaurantId: config.restaurantId,
        name: "Comida Invierno",
        description: "Servicio de comida temporada invierno (lunes a viernes)",
        serviceType: "comida",
        season: "invierno",
        dayType: "weekday",
        startTime: "13:00",
        endTime: "16:00",
        defaultDurationMinutes: 75,
        bufferMinutes: 15,
        slotGenerationMode: "auto",
        isActive: true,
        // dateRange opcional para limitar a octubre-abril
        dateRange: {
          start: new Date(new Date().getFullYear(), 9, 1).toISOString().split('T')[0], // Oct 1
          end: new Date(new Date().getFullYear() + 1, 3, 30).toISOString().split('T')[0], // Apr 30
        },
      },
      // Cena (Lunes - Viernes, todo el año)
      {
        restaurantId: config.restaurantId,
        name: "Cena",
        description: "Servicio de cena (lunes a viernes)",
        serviceType: "cena",
        season: "todos",
        dayType: "weekday",
        startTime: "20:00",
        endTime: "22:30",
        defaultDurationMinutes: 70,
        bufferMinutes: 10,
        slotGenerationMode: "auto",
        isActive: true,
        dateRange: null,
      },
    ]

    const created = await db.insert(services).values(servicesToCreate).returning()

    return NextResponse.json({
      success: true,
      message: `✅ ${created.length} servicios creados`,
      services: created.map(s => ({
        name: s.name,
        type: s.serviceType,
        hours: `${s.startTime} - ${s.endTime}`,
        days: s.dayType,
        duration: `${s.defaultDurationMinutes} min + ${s.bufferMinutes} buffer`,
        active: s.isActive ? "Sí" : "No",
      }))
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
})
