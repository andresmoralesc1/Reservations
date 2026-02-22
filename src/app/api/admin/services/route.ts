import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { services } from "@/drizzle/schema"
import { eq, and, desc } from "drizzle-orm"
import { servicesAvailability } from "@/lib/availability/services-availability"

/**
 * GET /api/admin/services
 * List all services with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("restaurantId")
    const isActive = searchParams.get("isActive")
    const serviceType = searchParams.get("serviceType")
    const season = searchParams.get("season")

    const conditions = []

    if (restaurantId) {
      conditions.push(eq(services.restaurantId, restaurantId))
    }

    if (isActive !== null) {
      conditions.push(eq(services.isActive, isActive === "true"))
    }

    if (serviceType) {
      conditions.push(eq(services.serviceType, serviceType))
    }

    if (season) {
      conditions.push(eq(services.season, season))
    }

    const allServices = await db.query.services.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        restaurant: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [desc(services.createdAt)],
    })

    return NextResponse.json({
      success: true,
      data: allServices,
      meta: {
        total: allServices.length,
      },
    })
  } catch (error) {
    console.error("Error fetching services:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener los servicios",
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/services
 * Create a new service
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      restaurantId,
      name,
      description,
      isActive = true,
      serviceType,
      season = "todos",
      dayType = "all",
      startTime,
      endTime,
      defaultDurationMinutes = 90,
      bufferMinutes = 15,
      slotGenerationMode = "auto",
      dateRange,
      manualSlots,
      availableTableIds,
    } = body

    // Validate required fields
    if (!restaurantId) {
      return NextResponse.json(
        {
          success: false,
          error: "El restaurantId es requerido",
        },
        { status: 400 }
      )
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "El nombre es requerido",
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

    if (!startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: "Las horas de inicio y fin son requeridas",
        },
        { status: 400 }
      )
    }

    // Validate service configuration
    const validation = servicesAvailability.validateServiceConfig({
      serviceType,
      startTime,
      endTime,
      defaultDurationMinutes,
      bufferMinutes,
      slotGenerationMode,
      manualSlots,
      season,
      dayType,
    })

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Configuración de servicio inválida",
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // Check for overlapping services
    const existingServices = await db.query.services.findMany({
      where: and(
        eq(services.restaurantId, restaurantId),
        eq(services.dayType, dayType),
        eq(services.startTime, startTime)
      ),
    })

    if (existingServices.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Ya existe un servicio configurado para este restaurante, día y hora",
        },
        { status: 409 }
      )
    }

    // Create the service
    const newService = await db
      .insert(services)
      .values({
        restaurantId,
        name,
        description,
        isActive,
        serviceType,
        season,
        dayType,
        startTime,
        endTime,
        defaultDurationMinutes,
        bufferMinutes,
        slotGenerationMode,
        dateRange,
        manualSlots,
        availableTableIds,
      })
      .returning()

    return NextResponse.json({
      success: true,
      data: newService[0],
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating service:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al crear el servicio",
      },
      { status: 500 }
    )
  }
}
