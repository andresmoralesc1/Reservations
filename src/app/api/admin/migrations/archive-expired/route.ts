import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { reservations, reservationsArchive } from "@/drizzle/schema"
import { eq, and, sql } from "drizzle-orm"

/**
 * POST /api/admin/migrations/archive-expired
 *
 * Archiva reservas pendientes que tienen más de 48 horas
 */
export async function POST() {
  try {
    const now = new Date()
    const cutoffDate = new Date(Date.now() - 48 * 60 * 60 * 1000)
    const cutoffISO = cutoffDate.toISOString()

    console.log("[Archive] cutoffDate:", cutoffISO)

    // 1. Encontrar reservas pendientes expiradas (más de 48h)
    const expiredReservations = await db
      .select({
        id: reservations.id,
        reservationCode: reservations.reservationCode,
        customerId: reservations.customerId,
        customerName: reservations.customerName,
        customerPhone: reservations.customerPhone,
        restaurantId: reservations.restaurantId,
        reservationDate: reservations.reservationDate,
        reservationTime: reservations.reservationTime,
        partySize: reservations.partySize,
        tableIds: reservations.tableIds,
        status: reservations.status,
        source: reservations.source,
        serviceId: reservations.serviceId,
        estimatedDurationMinutes: reservations.estimatedDurationMinutes,
        actualEndTime: reservations.actualEndTime,
        specialRequests: reservations.specialRequests,
        isComplexCase: reservations.isComplexCase,
        createdAt: reservations.createdAt,
        confirmedAt: reservations.confirmedAt,
        cancelledAt: reservations.cancelledAt,
        updatedAt: reservations.updatedAt,
      })
      .from(reservations)
      .where(
        and(
          eq(reservations.status, "PENDIENTE"),
          sql`${reservations.createdAt} < ${cutoffISO}`
        )
      )

    if (expiredReservations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay reservas pendientes expiradas para archivar",
        archived: 0,
      })
    }

    console.log(`[Archive] Found ${expiredReservations.length} expired pending reservations`)

    // 2. Insertar en tabla de archivo
    const archiveData = expiredReservations.map((r) => {
      const daysSinceCreation = Math.floor(
        (now.getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )

      return {
        id: r.id,
        reservationCode: r.reservationCode,
        customerId: r.customerId,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        restaurantId: r.restaurantId,
        reservationDate: r.reservationDate,
        reservationTime: r.reservationTime,
        partySize: r.partySize,
        tableIds: r.tableIds,
        status: "EXPIRADA",
        source: r.source,
        serviceId: r.serviceId,
        estimatedDurationMinutes: r.estimatedDurationMinutes,
        actualEndTime: r.actualEndTime,
        specialRequests: r.specialRequests,
        isComplexCase: r.isComplexCase,
        createdAt: r.createdAt,
        confirmedAt: r.confirmedAt,
        cancelledAt: r.cancelledAt,
        updatedAt: r.updatedAt,
        archivedAt: now,
        archiveReason: "expired_pending",
        daysSinceCreation,
      }
    })

    await db.insert(reservationsArchive).values(archiveData)

    // 3. Actualizar estado original a EXPIRADA
    for (const res of expiredReservations) {
      await db
        .update(reservations)
        .set({
          status: "EXPIRADA",
          updatedAt: now,
        })
        .where(eq(reservations.id, res.id))
    }

    return NextResponse.json({
      success: true,
      message: `Archivadas ${expiredReservations.length} reservas pendientes expiradas`,
      archived: expiredReservations.length,
    })
  } catch (error) {
    console.error("[Archive] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al archivar",
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/migrations/archive-expired
 *
 * Retorna estadísticas de reservas que podrían ser archivadas
 */
export async function GET() {
  try {
    const now = new Date()
    const cutoffDate = new Date(Date.now() - 48 * 60 * 60 * 1000)
    const cutoffISO = cutoffDate.toISOString()

    // Contar reservas pendientes expiradas
    const expiredCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(reservations)
      .where(
        and(
          eq(reservations.status, "PENDIENTE"),
          sql`${reservations.createdAt} < ${cutoffISO}`
        )
      )

    // Contar total de pendientes
    const totalPending = await db
      .select({ count: sql<number>`count(*)` })
      .from(reservations)
      .where(eq(reservations.status, "PENDIENTE"))

    // Contar ya expiradas
    const totalExpired = await db
      .select({ count: sql<number>`count(*)` })
      .from(reservations)
      .where(eq(reservations.status, "EXPIRADA"))

    // Contar archivadas
    const archivedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(reservationsArchive)

    return NextResponse.json({
      pending: {
        total: Number(totalPending[0]?.count || 0),
        expired: Number(expiredCount[0]?.count || 0),
      },
      expired: {
        total: Number(totalExpired[0]?.count || 0),
      },
      archived: {
        total: Number(archivedCount[0]?.count || 0),
      },
      recommendation: {
        action: Number(expiredCount[0]?.count || 0) > 0 ? "ARCHIVE_NOW" : "NONE",
        count: Number(expiredCount[0]?.count || 0),
      },
    })
  } catch (error) {
    console.error("[Archive Stats] Error:", error)
    return NextResponse.json(
      {
        error: "Error al obtener estadísticas",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
