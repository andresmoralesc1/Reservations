import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { services } from "@/drizzle/schema"
import { eq, and } from "drizzle-orm"
import { servicesAvailability } from "@/lib/availability/services-availability"

interface RouteContext {
  params: {
    id: string
  }
}

/**
 * GET /api/admin/services/[id]
 * Get a single service by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params

    const service = await db.query.services.findFirst({
      where: eq(services.id, id),
      with: {
        restaurant: {
          columns: {
            id: true,
            name: true,
            timezone: true,
          },
        },
      },
    })

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          error: "Servicio no encontrado",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: service,
    })
  } catch (error) {
    console.error("Error fetching service:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener el servicio",
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/services/[id]
 * Update a service
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params
    const body = await request.json()

    // Check if service exists
    const existingService = await db.query.services.findFirst({
      where: eq(services.id, id),
    })

    if (!existingService) {
      return NextResponse.json(
        {
          success: false,
          error: "Servicio no encontrado",
        },
        { status: 404 }
      )
    }

    const {
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
    } = body

    // Validate service configuration if provided
    const validation = servicesAvailability.validateServiceConfig({
      serviceType: serviceType || existingService.serviceType,
      startTime: startTime || existingService.startTime,
      endTime: endTime || existingService.endTime,
      defaultDurationMinutes: defaultDurationMinutes ?? existingService.defaultDurationMinutes,
      bufferMinutes: bufferMinutes ?? existingService.bufferMinutes,
      slotGenerationMode: slotGenerationMode || existingService.slotGenerationMode,
      manualSlots: manualSlots ?? existingService.manualSlots,
      season: season || existingService.season,
      dayType: dayType || existingService.dayType,
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

    // Check for overlapping services (exclude current service)
    if (dayType && startTime) {
      const overlappingServices = await db.query.services.findMany({
        where: and(
          eq(services.restaurantId, existingService.restaurantId),
          eq(services.dayType, dayType),
          eq(services.startTime, startTime)
        ),
      })

      const hasOverlap = overlappingServices.some(s => s.id !== id)

      if (hasOverlap) {
        return NextResponse.json(
          {
            success: false,
            error: "Ya existe un servicio configurado para este día y hora",
          },
          { status: 409 }
        )
      }
    }

    // Update the service
    const updatedService = await db
      .update(services)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(serviceType !== undefined && { serviceType }),
        ...(season !== undefined && { season }),
        ...(dayType !== undefined && { dayType }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(defaultDurationMinutes !== undefined && { defaultDurationMinutes }),
        ...(bufferMinutes !== undefined && { bufferMinutes }),
        ...(slotGenerationMode !== undefined && { slotGenerationMode }),
        ...(dateRange !== undefined && { dateRange }),
        ...(manualSlots !== undefined && { manualSlots }),
        ...(availableTableIds !== undefined && { availableTableIds }),
        updatedAt: new Date(),
      })
      .where(eq(services.id, id))
      .returning()

    return NextResponse.json({
      success: true,
      data: updatedService[0],
    })
  } catch (error) {
    console.error("Error updating service:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar el servicio",
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/services/[id]
 * Delete a service (soft delete by setting isActive = false)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = context.params

    // Check if service exists
    const existingService = await db.query.services.findFirst({
      where: eq(services.id, id),
    })

    if (!existingService) {
      return NextResponse.json(
        {
          success: false,
          error: "Servicio no encontrado",
        },
        { status: 404 }
      )
    }

    // Soft delete by setting isActive to false
    await db
      .update(services)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(services.id, id))

    return NextResponse.json({
      success: true,
      message: "Servicio desactivado correctamente",
    })
  } catch (error) {
    console.error("Error deleting service:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al desactivar el servicio",
      },
      { status: 500 }
    )
  }
}
