import { db } from "@/lib/db"
import { customers, reservations } from "@/drizzle/schema"
import { eq, desc, and, isNull } from "drizzle-orm"
import type { Customer, NewCustomer } from "@/drizzle/schema"

// ==================== DTOs ====================

export interface FindOrCreateCustomerDto {
  phoneNumber: string
  name?: string
}

export interface CustomerHistoryDto {
  customerId: string
  limit?: number
}

export interface UpdateCustomerDto {
  id: string
  name?: string
  tags?: string[]
  noShowCount?: number
}

// ==================== Service ====================

export const customerService = {
  /**
   * Busca un cliente por teléfono
   */
  async findByPhone(phoneNumber: string): Promise<Customer | null> {
    const normalizedPhone = normalizePhone(phoneNumber)

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.phoneNumber, normalizedPhone))
      .limit(1)

    return customer || null
  },

  /**
   * Busca un cliente por ID
   */
  async findById(id: string): Promise<Customer | null> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1)

    return customer || null
  },

  /**
   * Busca un cliente existente o crea uno nuevo
   */
  async findOrCreate(dto: FindOrCreateCustomerDto): Promise<Customer> {
    const normalizedPhone = normalizePhone(dto.phoneNumber)

    // Buscar cliente existente
    const existing = await this.findByPhone(normalizedPhone)
    if (existing) {
      // Actualizar nombre si se proporciona y es diferente
      if (dto.name && dto.name !== existing.name) {
        const [updated] = await db
          .update(customers)
          .set({ name: dto.name, updatedAt: new Date() })
          .where(eq(customers.id, existing.id))
          .returning()
        return updated
      }
      return existing
    }

    // Crear nuevo cliente
    const [newCustomer] = await db
      .insert(customers)
      .values({
        phoneNumber: normalizedPhone,
        name: dto.name || "Cliente",
      })
      .returning()

    return newCustomer
  },

  /**
   * Obtiene el historial de reservas de un cliente
   */
  async getHistory(dto: CustomerHistoryDto) {
    const customerReservations = await db.query.reservations.findMany({
      where: and(
        eq(reservations.customerId, dto.customerId),
        isNull(reservations.deletedAt)
      ),
      with: {
        restaurant: true,
        tables: true,
      },
      orderBy: [desc(reservations.reservationDate), desc(reservations.reservationTime)],
      limit: dto.limit || 20,
    })

    return customerReservations
  },

  /**
   * Obtiene las estadísticas de no-show de un cliente
   */
  async getNoShowStats(customerId: string) {
    const customer = await this.findById(customerId)

    if (!customer) {
      return {
        noShowCount: 0,
        totalReservations: 0,
        noShowRate: 0,
      }
    }

    const [stats] = await db
      .select({
        total: {
          count: reservations.id,
        } as any,
        noShows: {
          count: reservations.id,
        } as any,
      })
      .from(reservations)
      .where(eq(reservations.customerId, customerId))

    // Obtener conteos reales
    const allReservations = await db.query.reservations.findMany({
      where: eq(reservations.customerId, customerId),
      columns: { status: true },
    })

    const total = allReservations.length
    const noShows = allReservations.filter((r) => r.status === "NO_SHOW").length

    return {
      noShowCount: customer.noShowCount || 0,
      total,
      noShowRate: total > 0 ? Math.round((noShows / total) * 100) : 0,
    }
  },

  /**
   * Incrementa el contador de no-show de un cliente
   */
  async incrementNoShow(customerId: string): Promise<Customer> {
    const customer = await this.findById(customerId)
    if (!customer) {
      throw new Error("Customer not found")
    }

    const [updated] = await db
      .update(customers)
      .set({
        noShowCount: (customer.noShowCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId))
      .returning()

    return updated
  },

  /**
   * Actualiza información del cliente
   */
  async update(dto: UpdateCustomerDto): Promise<Customer> {
    const [updated] = await db
      .update(customers)
      .set({
        ...(dto.name && { name: dto.name }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.noShowCount !== undefined && { noShowCount: dto.noShowCount }),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, dto.id))
      .returning()

    return updated
  },

  /**
   * Busca clientes por nombre o teléfono (búsqueda fuzzy)
   */
  async search(query: string, limit = 10): Promise<Customer[]> {
    const normalizedQuery = query.toLowerCase().replace(/\D/g, "")

    // Buscar por teléfono (coincidencia parcial) o nombre
    const results = await db
      .select()
      .from(customers)
      .where((customers) => {
        // Esto es una simplificación - en producción usar pg_trgm
        return sql`${customers.phoneNumber} ILIKE ${`%${normalizedQuery}%`} OR ${customers.name} ILIKE ${`%${query}%`}`
      })
      .limit(limit)

    return results
  },
}

// ==================== Helpers ====================

import { sql } from "drizzle-orm"

/**
 * Normaliza número de teléfono español
 * - Elimina espacios, guiones, paréntesis
 * - Elimina prefijo +34 si está presente
 * - Deja 9 dígitos
 */
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "") // Solo dígitos

  // Si empieza con 34 (prefijo España), quitarlo
  if (cleaned.startsWith("34") && cleaned.length === 11) {
    return cleaned.slice(2)
  }

  return cleaned
}

/**
 * Formatea teléfono para mostrar
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")

  if (cleaned.length === 9) {
    // Formato: 612 345 678
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }

  return phone
}

// Types re-export
export type { Customer, NewCustomer }
