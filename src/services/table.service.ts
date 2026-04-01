import { db } from "@/lib/db"
import { tables, tableBlocks, reservations, services } from "@/drizzle/schema"
import { eq, and, gte, lte, or, inArray, isNull, sql } from "drizzle-orm"
import type { Table, NewTable, TableBlock } from "@/drizzle/schema"

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
   * Obtiene mesas disponibles para una fecha/hora y tamaño de grupo
   */
  async getAvailable(dto: GetAvailableTablesDto): Promise<Table[]> {
    // 1. Obtener todas las mesas del restaurante con capacidad suficiente
    let allTables = await db.query.tables.findMany({
      where: and(
        eq(tables.restaurantId, dto.restaurantId),
        gte(tables.capacity, dto.partySize),
        isNull(tables.deletedAt)
      ),
    })

    // 2. Filtrar por ubicación si se especifica
    if (dto.location) {
      allTables = allTables.filter((t) => t.location === dto.location)
    }

    // 3. Filtrar por mesas bloqueadas en la fecha/hora
    const blockedTableIds = await this.getBlockedTableIds({
      restaurantId: dto.restaurantId,
      date: dto.date,
      time: dto.time,
    })

    const availableTables = allTables.filter((t) => !blockedTableIds.has(t.id))

    // 4. Filtrar por mesas ya reservadas en ese slot
    const reservedTableIds = await this.getReservedTableIds({
      restaurantId: dto.restaurantId,
      date: dto.date,
      time: dto.time,
    })

    const finalTables = availableTables.filter((t) => !reservedTableIds.has(t.id))

    return finalTables
  },

  /**
   * Busca la mejor mesa para un grupo (algoritmo de asignación)
   */
  async findBestTable(dto: GetAvailableTablesDto): Promise<Table | null> {
    const available = await this.getAvailable(dto)

    if (available.length === 0) {
      return null
    }

    // Algoritmo: asignar la mesa más pequeña que quepa el grupo
    // (optimizar ocupación del restaurante)
    const sorted = [...available].sort((a, b) => a.capacity - b.capacity)

    // Priorizar mesas sin exceso de capacidad
    const bestFit = sorted.find((t) => t.capacity <= dto.partySize + 2)

    return bestFit || sorted[0]
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
   * Obtiene IDs de mesas reservadas en una fecha/hora
   */
  async getReservedTableIds(opts: {
    restaurantId: string
    date: string
    time: string
  }): Promise<Set<string>> {
    // Obtener servicio para calcular duración
    const service = await db.query.services.findFirst({
      where: eq(services.id, opts.restaurantId),
    })

    const duration = service?.defaultDurationMinutes || 90

    // Buscar reservas confirmadas que se solapan
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

    // Calcular solapamiento de tiempo
    const reservedIds = new Set<string>()
    for (const r of reserved) {
      if (r.tableIds && Array.isArray(r.tableIds)) {
        // Aquí deberíamos verificar solapamiento de tiempo real
        // Por ahora, añadimos todos los IDs
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
   * Combina mesas para grupos grandes
   */
  async findCombinedTables(
    dto: GetAvailableTablesDto
  ): Promise<Table[] | null> {
    const available = await this.getAvailable(dto)

    // Buscar mesa individual que quepa
    const singleTable = available.find((t) => t.capacity >= dto.partySize)
    if (singleTable) {
      return [singleTable]
    }

    // Si no hay mesa individual, buscar combinación
    // Algoritmo greedy: tomar las más pequeñas hasta completar capacidad
    const sorted = [...available].sort((a, b) => a.capacity - b.capacity)

    const selected: Table[] = []
    let totalCapacity = 0

    for (const table of sorted) {
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

    // Si no alcanzamos la capacidad, retornar null
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
