import { db } from "@/lib/db"
import {
  reservations,
  reservationHistory,
  tables,
  services,
} from "@/drizzle/schema"
import {
  eq,
  and,
  or,
  gte,
  lte,
  desc,
  inArray,
  isNull,
  sql,
} from "drizzle-orm"
import { nanoid } from "nanoid"
import type { Reservation, NewReservation } from "@/drizzle/schema"
import { customerService } from "./customer.service"
import { tableService } from "./table.service"

// ==================== DTOs ====================

export type ReservationStatus = "PENDIENTE" | "CONFIRMADO" | "CANCELADO" | "NO_SHOW"
export type ReservationSource = "IVR" | "WHATSAPP" | "MANUAL" | "WEB" | "VOICE"

export interface CreateReservationDto {
  customerName: string
  customerPhone: string
  restaurantId: string
  reservationDate: string // YYYY-MM-DD
  reservationTime: string // HH:MM
  partySize: number
  preferredLocation?: string
  specialRequests?: string
  source?: ReservationSource
  confirmImmediately?: boolean
  assignTables?: boolean
}

export interface ConfirmReservationDto {
  reservationId: string
  changedBy?: string
}

export interface CancelReservationDto {
  reservationId: string
  reason?: string
  changedBy?: string
}

export interface MarkNoShowDto {
  reservationId: string
  changedBy?: string
}

export interface UpdateReservationDto {
  reservationId: string
  partySize?: number
  reservationDate?: string
  reservationTime?: string
  specialRequests?: string
  tableIds?: string[]
}

export interface FindByCodeDto {
  code: string
  restaurantId?: string
}

export interface FindByPhoneDto {
  customerPhone: string
  restaurantId: string
  date?: string
}

export interface ListReservationsDto {
  restaurantId: string
  date?: string
  status?: ReservationStatus
  limit?: number
  offset?: number
}

// ==================== Service ====================

export const reservationService = {
  /**
   * Crea una nueva reserva
   */
  async create(dto: CreateReservationDto): Promise<Reservation> {
    // 1. Buscar o crear cliente
    const customer = await customerService.findOrCreate({
      phoneNumber: dto.customerPhone,
      name: dto.customerName,
    })

    // 2. Buscar servicio activo para la fecha/hora
    const service = await this.findActiveService({
      restaurantId: dto.restaurantId,
      date: dto.reservationDate,
      time: dto.reservationTime,
    })

    // 3. Buscar mesas disponibles
    let assignedTables: string[] = []
    if (dto.assignTables !== false) {
      const tables = await tableService.findBestTable({
        restaurantId: dto.restaurantId,
        date: dto.reservationDate,
        time: dto.reservationTime,
        partySize: dto.partySize,
        location: dto.preferredLocation,
      })

      if (tables) {
        assignedTables = [tables.id]
      }
    }

    // 4. Generar código único
    const code = await this.generateUniqueCode()

    // 5. Determinar estado
    const status: ReservationStatus = dto.confirmImmediately
      ? "CONFIRMADO"
      : "PENDIENTE"

    // 6. Crear reserva
    const [reservation] = await db
      .insert(reservations)
      .values({
        reservationCode: code,
        customerId: customer.id,
        customerName: dto.customerName,
        customerPhone: customer.phoneNumber,
        restaurantId: dto.restaurantId,
        reservationDate: dto.reservationDate,
        reservationTime: dto.reservationTime,
        partySize: dto.partySize,
        tableIds: assignedTables,
        status,
        source: dto.source || "MANUAL",
        serviceId: service?.id,
        estimatedDurationMinutes: service?.defaultDurationMinutes || 90,
        specialRequests: dto.specialRequests,
        confirmedAt: dto.confirmImmediately ? new Date() : undefined,
      })
      .returning()

    // 7. Registrar historial si se confirmó inmediatamente
    if (dto.confirmImmediately) {
      await this.addHistory({
        reservationId: reservation.id,
        oldStatus: null,
        newStatus: "CONFIRMADO",
        changedBy: dto.customerPhone, // Usar phone como changedBy para auto-confirmaciones
        metadata: { method: "create_immediate" },
      })
    }

    return reservation
  },

  /**
   * Busca una reserva por código
   */
  async findByCode(dto: FindByCodeDto): Promise<Reservation | null> {
    const conditions = [
      eq(reservations.reservationCode, dto.code),
      isNull(reservations.deletedAt),
    ]

    if (dto.restaurantId) {
      conditions.push(eq(reservations.restaurantId, dto.restaurantId))
    }

    const [reservation] = await db
      .select()
      .from(reservations)
      .where(and(...conditions))
      .limit(1)

    return reservation || null
  },

  /**
   * Busca reservas por teléfono
   */
  async findByPhone(dto: FindByPhoneDto): Promise<Reservation[]> {
    const conditions = [
      eq(reservations.restaurantId, dto.restaurantId),
      eq(reservations.customerPhone, dto.customerPhone),
      isNull(reservations.deletedAt),
    ]

    if (dto.date) {
      conditions.push(eq(reservations.reservationDate, dto.date))
    }

    const results = await db.query.reservations.findMany({
      where: and(...conditions),
      with: {
        restaurant: true,
        tables: true,
      },
      orderBy: [desc(reservations.reservationDate), desc(reservations.reservationTime)],
      limit: 50,
    })

    return results
  },

  /**
   * Lista reservas con filtros
   */
  async list(dto: ListReservationsDto) {
    const conditions = [
      eq(reservations.restaurantId, dto.restaurantId),
      isNull(reservations.deletedAt),
    ]

    if (dto.date) {
      conditions.push(eq(reservations.reservationDate, dto.date))
    }

    if (dto.status) {
      conditions.push(eq(reservations.status, dto.status))
    }

    const results = await db.query.reservations.findMany({
      where: and(...conditions),
      with: {
        restaurant: true,
        customer: true,
        tables: true,
        service: true,
      },
      orderBy: [desc(reservations.reservationDate), desc(reservations.reservationTime)],
      limit: dto.limit || 100,
      offset: dto.offset || 0,
    })

    // Obtener conteo de pendientes
    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reservations)
      .where(
        and(
          eq(reservations.restaurantId, dto.restaurantId),
          eq(reservations.status, "PENDIENTE"),
          isNull(reservations.deletedAt)
        )
      )

    return {
      reservations: results,
      meta: {
        limit: dto.limit || 100,
        offset: dto.offset || 0,
        count: results.length,
        pendingCount: pendingCount?.count || 0,
      },
    }
  },

  /**
   * Obtiene una reserva por ID
   */
  async findById(id: string): Promise<Reservation | null> {
    const [reservation] = await db
      .select()
      .from(reservations)
      .where(and(eq(reservations.id, id), isNull(reservations.deletedAt)))
      .limit(1)

    return reservation || null
  },

  /**
   * Confirma una reserva pendiente
   */
  async confirm(dto: ConfirmReservationDto): Promise<Reservation> {
    const reservation = await this.findById(dto.reservationId)

    if (!reservation) {
      throw new Error("Reservation not found")
    }

    if (reservation.status !== "PENDIENTE") {
      throw new Error("Only PENDIENTE reservations can be confirmed")
    }

    const [updated] = await db
      .update(reservations)
      .set({
        status: "CONFIRMADO",
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, dto.reservationId))
      .returning()

    // Registrar historial
    await this.addHistory({
      reservationId: dto.reservationId,
      oldStatus: "PENDIENTE",
      newStatus: "CONFIRMADO",
      changedBy: dto.changedBy || "system",
      metadata: { method: "confirm" },
    })

    return updated
  },

  /**
   * Cancela una reserva
   */
  async cancel(dto: CancelReservationDto): Promise<Reservation> {
    const reservation = await this.findById(dto.reservationId)

    if (!reservation) {
      throw new Error("Reservation not found")
    }

    if (reservation.status === "CANCELADO") {
      return reservation // Ya está cancelada
    }

    const [updated] = await db
      .update(reservations)
      .set({
        status: "CANCELADO",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, dto.reservationId))
      .returning()

    // Registrar historial
    await this.addHistory({
      reservationId: dto.reservationId,
      oldStatus: reservation.status,
      newStatus: "CANCELADO",
      changedBy: dto.changedBy || "system",
      metadata: {
        method: "cancel",
        reason: dto.reason,
      },
    })

    return updated
  },

  /**
   * Marca una reserva como no-show
   */
  async markNoShow(dto: MarkNoShowDto): Promise<Reservation> {
    const reservation = await this.findById(dto.reservationId)

    if (!reservation) {
      throw new Error("Reservation not found")
    }

    if (reservation.status === "NO_SHOW") {
      return reservation // Ya está marcada
    }

    const [updated] = await db
      .update(reservations)
      .set({
        status: "NO_SHOW",
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, dto.reservationId))
      .returning()

    // Incrementar contador de no-show del cliente
    if (reservation.customerId) {
      await customerService.incrementNoShow(reservation.customerId)
    }

    // Registrar historial
    await this.addHistory({
      reservationId: dto.reservationId,
      oldStatus: reservation.status,
      newStatus: "NO_SHOW",
      changedBy: dto.changedBy || "system",
      metadata: { method: "mark_no_show" },
    })

    return updated
  },

  /**
   * Actualiza información de una reserva
   */
  async update(dto: UpdateReservationDto): Promise<Reservation> {
    const reservation = await this.findById(dto.reservationId)

    if (!reservation) {
      throw new Error("Reservation not found")
    }

    const updateData: Partial<NewReservation> = {
      updatedAt: new Date(),
    }

    if (dto.partySize) updateData.partySize = dto.partySize
    if (dto.reservationDate) updateData.reservationDate = dto.reservationDate
    if (dto.reservationTime) updateData.reservationTime = dto.reservationTime
    if (dto.specialRequests !== undefined)
      updateData.specialRequests = dto.specialRequests
    if (dto.tableIds) updateData.tableIds = dto.tableIds

    const [updated] = await db
      .update(reservations)
      .set(updateData)
      .where(eq(reservations.id, dto.reservationId))
      .returning()

    return updated
  },

  /**
   * Busca servicio activo para una fecha/hora
   */
  async findActiveService(opts: {
    restaurantId: string
    date: string
    time: string
  }) {
    const dayOfWeek = new Date(opts.date).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    const [service] = await db
      .select()
      .from(services)
      .where(
        and(
          eq(services.restaurantId, opts.restaurantId),
          eq(services.isActive, true),
          or(
            eq(services.dayType, "all"),
            eq(services.dayType, isWeekend ? "weekend" : "weekday")
          ),
          sql`${services.startTime}::time <= ${opts.time}::time`,
          sql`${services.endTime}::time > ${opts.time}::time`,
          isNull(services.deletedAt)
        )
      )
      .limit(1)

    return service || null
  },

  /**
   * Genera código de reserva único
   */
  async generateUniqueCode(): Promise<string> {
    let code: string
    let exists = true

    // Intentar hasta encontrar un código único
    let attempts = 0
    do {
      code = `RES-${nanoid(5).toUpperCase()}`
      const [existing] = await db
        .select()
        .from(reservations)
        .where(eq(reservations.reservationCode, code))
        .limit(1)

      exists = !!existing
      attempts++
    } while (exists && attempts < 10)

    return code!
  },

  /**
   * Agrega entrada al historial de cambios
   */
  async addHistory(dto: {
    reservationId: string
    oldStatus: string | null
    newStatus: string
    changedBy: string
    metadata?: Record<string, unknown>
  }) {
    await db.insert(reservationHistory).values({
      reservationId: dto.reservationId,
      oldStatus: dto.oldStatus,
      newStatus: dto.newStatus,
      changedBy: dto.changedBy,
      metadata: dto.metadata,
    })
  },

  /**
   * Obtiene el historial de una reserva
   */
  async getHistory(reservationId: string) {
    const history = await db.query.reservationHistory.findMany({
      where: eq(reservationHistory.reservationId, reservationId),
      orderBy: (history, { desc }) => [desc(history.createdAt)],
    })

    return history
  },

  /**
   * Obtiene reservas que necesitan seguimiento (pendientes viejas, etc)
   */
  async getActionRequired(restaurantId: string) {
    const now = new Date()
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

    // Reservas pendientes de más de 2 horas
    const oldPending = await db.query.reservations.findMany({
      where: and(
        eq(reservations.restaurantId, restaurantId),
        eq(reservations.status, "PENDIENTE"),
        sql`${reservations.createdAt} >= ${twoHoursAgo}`,
        isNull(reservations.deletedAt)
      ),
      with: {
        customer: true,
      },
      orderBy: [desc(reservations.createdAt)],
      limit: 20,
    })

    return {
      oldPending,
    }
  },

  /**
   * Soft delete de una reserva
   */
  async softDelete(reservationId: string, deletedBy: string): Promise<void> {
    await db
      .update(reservations)
      .set({
        deletedAt: new Date(),
        deletedBy,
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, reservationId))
  },
}

// Types re-export
export type { Reservation, NewReservation }
export { customerService, tableService }
