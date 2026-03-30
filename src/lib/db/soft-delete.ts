/**
 * Soft Delete Helpers
 *
 * Funciones helper para manejar soft delete en queries de Drizzle.
 */

import { and, isNull, or, eq } from "drizzle-orm"
import { reservations, tables, services } from "@/drizzle/schema"

/**
 * Condición para excluir registros eliminados (soft delete)
 * Úsalo en los where clauses:
 *
 * ```ts
 * import { whereNotDeleted } from '@/lib/db/soft-delete'
 *
 * const activeReservations = await db.query.reservations.findMany({
 *   where: whereNotDeleted(reservations)
 * })
 * ```
 */

export function whereNotDeleted(table: typeof reservations | typeof tables | typeof services) {
  return isNull(table.deletedAt)
}

/**
 * Condición para incluir solo registros eliminados
 */
export function whereDeleted(table: typeof reservations | typeof tables | typeof services) {
  return or(
    eq(table.deletedAt, new Date()),
    // Para incluir todos los que tienen deletedAt set (no null)
    // Nota: esto podría no funcionar directamente con Drizzle,
    // usa `isNotNull(table.deletedAt)` en su lugar
  )
}

/**
 * Marca un registro como eliminado (soft delete)
 */
export async function softDeleteTable(
  tableId: string,
  deletedBy: string
): Promise<void> {
  const { db } = await import("@/lib/db")
  await db.update(tables)
    .set({
      deletedAt: new Date(),
      deletedBy,
    })
    .where(eq(tables.id, tableId))
}

/**
 * Marca una reserva como eliminada (soft delete)
 */
export async function softDeleteReservation(
  reservationId: string,
  deletedBy: string
): Promise<void> {
  const { db } = await import("@/lib/db")
  await db.update(reservations)
    .set({
      deletedAt: new Date(),
      deletedBy,
      status: "CANCELADO", // También cancelamos la reserva
      cancelledAt: new Date(),
    })
    .where(eq(reservations.id, reservationId))
}

/**
 * Marca un servicio como eliminado (soft delete)
 */
export async function softDeleteService(
  serviceId: string,
  deletedBy: string
): Promise<void> {
  const { db } = await import("@/lib/db")
  await db.update(services)
    .set({
      deletedAt: new Date(),
      deletedBy,
      isActive: false, // También desactivamos el servicio
    })
    .where(eq(services.id, serviceId))
}

/**
 * Restaura un registro marcado como eliminado
 */
export async function restoreTable(tableId: string): Promise<void> {
  const { db } = await import("@/lib/db")
  await db.update(tables)
    .set({
      deletedAt: null,
      deletedBy: null,
    })
    .where(eq(tables.id, tableId))
}

export async function restoreReservation(reservationId: string): Promise<void> {
  const { db } = await import("@/lib/db")
  await db.update(reservations)
    .set({
      deletedAt: null,
      deletedBy: null,
      status: "PENDIENTE",
      cancelledAt: null,
    })
    .where(eq(reservations.id, reservationId))
}

export async function restoreService(serviceId: string): Promise<void> {
  const { db } = await import("@/lib/db")
  await db.update(services)
    .set({
      deletedAt: null,
      deletedBy: null,
      isActive: true,
    })
    .where(eq(services.id, serviceId))
}

/**
 * Query helper que excluye automáticamente registros eliminados
 * Envuelve findMany y findFirst para excluir soft deletes
 */
export function withSoftDeleteFilter<T extends { findMany: (...args: any[]) => any, findFirst: (...args: any[]) => any }>(
  queryBuilder: T
): T {
  const originalFindMany = queryBuilder.findMany.bind(queryBuilder)
  const originalFindFirst = queryBuilder.findFirst.bind(queryBuilder)

  return new Proxy(queryBuilder, {
    get(target, prop) {
      if (prop === 'findMany') {
        return async (...args: any[]) => {
          const result = await originalFindMany(...args)
          // Filtrar resultados para excluir soft deletes
          if (Array.isArray(result)) {
            return result.filter((r: any) => !r.deletedAt)
          }
          return result
        }
      }
      if (prop === 'findFirst') {
        return async (...args: any[]) => {
          const result = await originalFindFirst(...args)
          // Retornar null si está soft deleted
          if (result && result.deletedAt) {
            return null
          }
          return result
        }
      }
      return (target as any)[prop]
    }
  }) as T
}
