import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { services, reservations, tables } from "@/drizzle/schema"
import { eq, and, gte, lte } from "drizzle-orm"
import { servicesAvailability } from "@/lib/availability/services-availability"

/**
 * GET /api/admin/occupancy-timeline
 * Get timeline data for a specific date and service type
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const serviceType = searchParams.get("serviceType") // 'comida' | 'cena'
    const restaurantId = searchParams.get("restaurantId")

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: "La fecha es requerida",
        },
        { status: 400 }
      )
    }

    if (!serviceType || !["comida", "cena"].includes(serviceType)) {
      return NextResponse.json(
        {
          success: false,
          error: "El tipo de servicio debe ser 'comida' o 'cena'",
        },
        { status: 400 }
      )
    }

    // Get active service for this date and type
    const allServices = await db.query.services.findMany({
      where: and(
        restaurantId ? eq(services.restaurantId, restaurantId) : undefined,
        eq(services.isActive, true),
        eq(services.serviceType, serviceType)
      ),
    })

    // Filter services that match the date
    const matchingServices = allServices.filter((service) =>
      servicesAvailability.isDateMatchingService(date, service as any)
    )

    if (matchingServices.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No hay servicio configurado para esta fecha",
        },
        { status: 404 }
      )
    }

    // Use first matching service
    const service = matchingServices[0]

    // Get all tables for this restaurant
    const allTables = await db.query.tables.findMany({
      where: eq(tables.restaurantId, service.restaurantId),
    })

    // Filter by service's available tables if specified
    let serviceTables = allTables
    if (service.availableTableIds && service.availableTableIds.length > 0) {
      serviceTables = allTables.filter((t) =>
        service.availableTableIds!.includes(t.id)
      )
    }

    // Get reservations for this date and service
    const allReservations = await db.query.reservations.findMany({
      where: and(
        eq(reservations.reservationDate, date),
        eq(reservations.serviceId, service.id),
        eq(reservations.restaurantId, service.restaurantId)
      ),
    })

    // Filter active reservations
    const activeReservations = allReservations.filter(
      (r) => r.status === "PENDIENTE" || r.status === "CONFIRMADO"
    )

    // Build timeline reservations
    const timelineReservations = activeReservations.map((res) => {
      const releaseTime = servicesAvailability.calculateReleaseTime(
        res.reservationTime,
        res.estimatedDurationMinutes || service.defaultDurationMinutes
      )

      // Get table info
      const reservationTables = res.tableIds
        ? res.tableIds.map((tableId) => {
            const table = serviceTables.find((t) => t.id === tableId)
            return {
              id: table?.id,
              number: table?.tableNumber,
            }
          })
        : []

      return {
        id: res.id,
        tableIds: res.tableIds || [],
        tables: reservationTables,
        customerName: res.customerName,
        partySize: res.partySize,
        startTime: res.reservationTime,
        endTime: releaseTime,
        status: res.status,
        serviceId: res.serviceId,
      }
    })

    // Generate time slots for the service
    const timeSlots = servicesAvailability.generateAutoSlots(service as any)

    // Ensure start and end times are included
    const allTimeSlots = [service.startTime, ...timeSlots]
    if (allTimeSlots[allTimeSlots.length - 1] !== service.endTime) {
      allTimeSlots.push(service.endTime)
    }

    return NextResponse.json({
      success: true,
      data: {
        date,
        service: {
          id: service.id,
          name: service.name,
          serviceType: service.serviceType,
          startTime: service.startTime,
          endTime: service.endTime,
          defaultDurationMinutes: service.defaultDurationMinutes,
          bufferMinutes: service.bufferMinutes,
        },
        tables: serviceTables.map((t) => ({
          id: t.id,
          tableNumber: t.tableNumber,
          capacity: t.capacity,
          location: t.location,
        })),
        reservations: timelineReservations,
        timeSlots: allTimeSlots,
      },
    })
  } catch (error) {
    console.error("Error fetching occupancy timeline:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener los datos de ocupación",
      },
      { status: 500 }
    )
  }
}
