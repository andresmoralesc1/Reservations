/**
 * Table Service (Legacy Layer)
 *
 * Este archivo proporciona una capa de compatibilidad con el código existente.
 * La lógica de disponibilidad está centralizada en @/lib/availability/services-availability.ts
 */

import { db } from "@/lib/db"
import { tables, tableBlocks, services, reservations } from "@/drizzle/schema"
import { eq, and, isNull, sql, inArray } from "drizzle-orm"
import type { Table, NewTable, TableBlock } from "@/drizzle/schema"
import { servicesAvailability } from "@/lib/availability/services-availability"

// ==================== DTOs ====================

export interface GetAvailableTablesDto {
  restaurantId: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  partySize: number
  serviceId?: string
  location?: string // 'interior', 'patio', 'terraza'
}

export interface BlockTableDto {
  tableId: string
  restaurantId: string
  blockDate: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  reason: "mantenimiento" | "evento_privado" | "reservado" | "otro"
  notes?: string
  createdBy: string
}

export interface UnblockTableDto {
  blockId: string
}

export interface AssignTableDto {
  reservationId: string
  tableIds: string[]
}

// ==================== Service ====================

export const tableService = {
  /**
   * Obtiene todas las mesas de un restaurante
   */
  async findByRestaurant(restaurantId: string): Promise<Table[]> {
    const allTables = await db.query.tables.findMany({
      where: and(
        eq(tables.restaurantId, restaurantId),
        isNull(tables.deletedAt)
      ),
      orderBy: [tables.tableNumber],
    })

    return allTables
  },

  /**
   * Obtiene una mesa por ID
   */
  async findById(id: string): Promise<Table | null> {
    const [table] = await db
      .select()
      .from(tables)
      .where(and(eq(tables.id, id), isNull(tables.deletedAt)))
      .limit(1)

    return table || null
  },

  /**
   * Obtiene una mesa por código
   */
  async findByCode(tableCode: string, restaurantId: string): Promise<Table | null> {
    const [table] = await db
      .select()
      .from(tables)
      .where(
        and(
          eq(tables.tableCode, tableCode),
          eq(tables.restaurantId, restaurantId),
          isNull(tables.deletedAt)
        )
      )
      .limit(1)

    return table || null
  },

  /**
   * Obtiene mesas disponibles para una fecha/hora y tamaño de grupo.
   *
   * DELEGADO a services-availability.ts para mantener un único
   * algoritmo de disponibilidad que considera:
   * - Servicios activos (comida/cena)
   * - Temporadas y días
   * - Scoring de mesas (perfect fit, overcapacity)
   */
  async getAvailable(dto: GetAvailableTablesDto): Promise<Table[]> {
    const result = await servicesAvailability.checkAvailabilityWithServices({
      restaurantId: dto.restaurantId,
      date: dto.date,
      time: dto.time,
      partySize: dto.partySize,
    })

    if (!result.available) {
      return []
    }

    // Filtrar por ubicación si se especifica
    let availableTables = result.availableTables
    if (dto.location) {
      availableTables = availableTables.filter((t) => t.location === dto.location)
    }

    // Obtener las mesas completas del schema para retornar todos los campos
    const tableIds = availableTables.map((t) => t.id)
    if (tableIds.length === 0) {
      return []
    }

    const fullTables = await db.query.tables.findMany({
      where: and(
        inArray(tables.id, tableIds),
        isNull(tables.deletedAt)
      ),
    })

    return fullTables
  },

  /**
   * Busca la mejor mesa para un grupo (algoritmo de asignación).
   *
   * DELEGADO a services-availability.ts que implementa
   * el algoritmo de scoring (perfect fit, overcapacity).
   */
  async findBestTable(dto: GetAvailableTablesDto): Promise<Table | null> {
    const result = await servicesAvailability.checkAvailabilityWithServices({
      restaurantId: dto.restaurantId,
      date: dto.date,
      time: dto.time,
      partySize: dto.partySize,
    })

    if (!result.available || result.suggestedTables.length === 0) {
      return null
    }

    // Filtrar por ubicación si se especifica
    let availableTables = result.availableTables
    if (dto.location) {
      availableTables = availableTables.filter((t) => t.location === dto.location)
    }

    // suggestedTables contiene los IDs ordenados por mejor ajuste
    const bestTableId = result.suggestedTables[0]

    // Obtener la mesa completa del schema
    const bestTable = await db.query.tables.findFirst({
      where: and(
        inArray(tables.id, [bestTableId]),
        isNull(tables.deletedAt)
      ),
    })

    return bestTable || null
  },

  /**
   * Obtiene IDs de mesas bloqueadas en una fecha/hora
   */
  async getBlockedTableIds(opts: {
    restaurantId: string
    date: string
    time: string
  }): Promise<Set<string>> {
    const blocks = await db
      .select({ tableId: tableBlocks.tableId })
      .from(tableBlocks)
      .where(
        and(
          eq(tableBlocks.restaurantId, opts.restaurantId),
          eq(tableBlocks.blockDate, opts.date),
          sql`${tableBlocks.startTime} <= ${opts.time}`,
          sql`${tableBlocks.endTime} > ${opts.time}`
        )
      )

    return new Set(blocks.map((b) => b.tableId))
  },

  /**
   * Obtiene IDs de mesas reservadas en una fecha/hora.
   *
   * NOTA: Este método ya no se usa para calcular disponibilidad.
   * La lógica de solapamiento está en services-availability.ts
   */
  async getReservedTableIds(opts: {
    restaurantId: string
    date: string
    time: string
  }): Promise<Set<string>> {
    const service = await db.query.services.findFirst({
      where: eq(services.id, opts.restaurantId),
    })

    const duration = service?.defaultDurationMinutes || 90

    const reserved = await db
      .select({ tableIds: reservations.tableIds })
      .from(reservations)
      .where(
        and(
          eq(reservations.restaurantId, opts.restaurantId),
          eq(reservations.reservationDate, opts.date),
          eq(reservations.status, "CONFIRMADO"),
          isNull(reservations.deletedAt)
        )
      )

    const reservedIds = new Set<string>()
    for (const r of reserved) {
      if (r.tableIds && Array.isArray(r.tableIds)) {
        r.tableIds.forEach((id) => reservedIds.add(id))
      }
    }

    return reservedIds
  },

  /**
   * Bloquea una mesa para un rango de fecha/hora
   */
  async block(dto: BlockTableDto): Promise<TableBlock> {
    const [block] = await db
      .insert(tableBlocks)
      .values({
        tableId: dto.tableId,
        restaurantId: dto.restaurantId,
        blockDate: dto.blockDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
        reason: dto.reason,
        notes: dto.notes,
        createdBy: dto.createdBy,
      })
      .returning()

    return block
  },

  /**
   * Desbloquea una mesa
   */
  async unblock(dto: UnblockTableDto): Promise<void> {
    await db.delete(tableBlocks).where(eq(tableBlocks.id, dto.blockId))
  },

  /**
   * Obtiene todos los bloques de un restaurante en una fecha
   */
  async getBlocksForDate(restaurantId: string, date: string): Promise<TableBlock[]> {
    const blocks = await db.query.tableBlocks.findMany({
      where: and(
        eq(tableBlocks.restaurantId, restaurantId),
        eq(tableBlocks.blockDate, date)
      ),
      with: {
        table: true,
      },
    })

    return blocks
  },

  /**
   * Asigna mesas a una reserva
   */
  async assignToReservation(dto: AssignTableDto): Promise<void> {
    await db
      .update(reservations)
      .set({ tableIds: dto.tableIds })
      .where(eq(reservations.id, dto.reservationId))
  },

  /**
   * Combina mesas para grupos grandes.
   *
   * DELEGADO a services-availability.ts que implementa
   * la lógica de combinación de mesas.
   */
  async findCombinedTables(
    dto: GetAvailableTablesDto
  ): Promise<Table[] | null> {
    const result = await servicesAvailability.checkAvailabilityWithServices({
      restaurantId: dto.restaurantId,
      date: dto.date,
      time: dto.time,
      partySize: dto.partySize,
    })

    if (!result.available) {
      return null
    }

    // Filtrar por ubicación si se especifica
    let availableTableIds = result.availableTableIds || []
    if (dto.location) {
      // Filtrar por ubicación
      const filteredTables = result.availableTables.filter((t) => t.location === dto.location)
      availableTableIds = filteredTables.map((t) => t.id)
    }

    if (availableTableIds.length === 0) {
      return null
    }

    // Buscar mesa individual que quepa
    const fullTables = await db.query.tables.findMany({
      where: and(
        inArray(tables.id, availableTableIds),
        isNull(tables.deletedAt)
      ),
    })

    const singleTable = fullTables.find((t) => t.capacity >= dto.partySize)
    if (singleTable) {
      return [singleTable]
    }

    // Si no hay mesa individual, usar suggestedTables que ya contiene
    // la combinación óptima calculada por services-availability
    const suggestedIds = result.suggestedTables.filter((id) => availableTableIds.includes(id))

    const selected: Table[] = []
    let totalCapacity = 0

    for (const tableId of suggestedIds) {
      const table = fullTables.find((t) => t.id === tableId)
      if (table) {
        selected.push(table)
        totalCapacity += table.capacity

        if (totalCapacity >= dto.partySize) {
          return selected
        }

        // Limitar a 3 mesas combinadas máximo
        if (selected.length >= 3) {
          break
        }
      }
    }

    return totalCapacity >= dto.partySize ? selected : null
  },

  /**
   * Obtiene el estado de ocupación de todas las mesas para una fecha
   */
  async getStatusForDate(
    restaurantId: string,
    date: string
  ): Promise<Array<Table & { status: "available" | "occupied" | "blocked" }>> {
    const allTables = await this.findByRestaurant(restaurantId)

    const blocks = await this.getBlocksForDate(restaurantId, date)
    const blockedIds = new Set(blocks.map((b) => b.tableId))

    // Obtener reservas del día
    const dayReservations = await db.query.reservations.findMany({
      where: and(
        eq(reservations.restaurantId, restaurantId),
        eq(reservations.reservationDate, date),
        eq(reservations.status, "CONFIRMADO"),
        isNull(reservations.deletedAt)
      ),
    })

    const reservedTableIds = new Set<string>()
    for (const r of dayReservations) {
      if (r.tableIds && Array.isArray(r.tableIds)) {
        r.tableIds.forEach((id) => reservedTableIds.add(id))
      }
    }

    return allTables.map((table) => {
      if (blockedIds.has(table.id)) {
        return { ...table, status: "blocked" as const }
      }
      if (reservedTableIds.has(table.id)) {
        return { ...table, status: "occupied" as const }
      }
      return { ...table, status: "available" as const }
    })
  },
}

// Types re-export
export type { Table, NewTable, TableBlock }
