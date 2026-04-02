// Cargar variables de entorno ANTES de importar db
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { db } from "../src/lib/db"
import { reservations, reservationHistory } from "../drizzle/schema"
import { eq, and, sql } from "drizzle-orm"

// Configuración
const HOURS_OLD = 48
const STATUS_PENDING = "PENDIENTE"
const STATUS_EXPIRED = "EXPIRADO"
const CHANGED_BY = "system"
const ACTION = "auto_expired"
const NOTES = "Archivada automáticamente por expiración"

/**
 * Calcula la fecha límite (hace 48 horas)
 */
function getExpiredDate(): string {
  const now = new Date()
  now.setHours(now.getHours() - HOURS_OLD)
  return now.toISOString().split("T")[0] // YYYY-MM-DD
}

/**
 * Log con timestamp
 */
function log(message: string, data?: unknown) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : "")
}

/**
 * Busca y archiva reservas pendientes expiradas
 */
async function archiveExpiredReservations() {
  const startTime = Date.now()
  log("=== Iniciando archivado de reservas expiradas ===")
  log(`Buscando reservas con status "${STATUS_PENDING}" anteriores a ${getExpiredDate()}`)

  try {
    // Buscar reservas pendientes con fecha anterior a hace 48 horas
    const expiredDate = getExpiredDate()

    const expiredReservations = await db.query.reservations.findMany({
      where: and(
        eq(reservations.status, STATUS_PENDING),
        sql`${reservations.reservationDate} < ${expiredDate}`
      ),
      with: {
        restaurant: true,
        customer: true,
      },
    })

    if (expiredReservations.length === 0) {
      log("No se encontraron reservas expiradas para archivar")
      return
    }

    log(`Se encontraron ${expiredReservations.length} reservas expiradas`)

    // Procesar cada reserva
    let archivedCount = 0
    const errors: Array<{ reservationId: string; error: string }> = []

    for (const reservation of expiredReservations) {
      try {
        log(
          `Procesando reserva ${reservation.reservationCode} - ${reservation.reservationDate} ${reservation.reservationTime}`
        )

        // Actualizar estado de la reserva
        await db
          .update(reservations)
          .set({
            status: STATUS_EXPIRED,
            updatedAt: new Date(),
          })
          .where(eq(reservations.id, reservation.id))

        // Registrar en history
        await db.insert(reservationHistory).values({
          reservationId: reservation.id,
          oldStatus: reservation.status,
          newStatus: STATUS_EXPIRED,
          changedBy: CHANGED_BY,
          metadata: {
            action: ACTION,
            notes: NOTES,
            archivedAt: new Date().toISOString(),
            originalStatus: reservation.status,
            reservationDate: reservation.reservationDate,
          },
        })

        archivedCount++
        log(`✓ Reserva ${reservation.reservationCode} archivada correctamente`)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        log(`✗ Error archivando reserva ${reservation.reservationCode}: ${errorMsg}`)
        errors.push({
          reservationId: reservation.id,
          error: errorMsg,
        })
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    // Resumen final
    log("\n=== Resumen del archivado ===")
    log(`Tiempo de ejecución: ${duration}s`)
    log(`Reservas procesadas: ${expiredReservations.length}`)
    log(`Reservas archivadas: ${archivedCount}`)
    log(`Errores: ${errors.length}`)

    if (errors.length > 0) {
      log("\nErrores detallados:", errors)
    }

    if (archivedCount > 0) {
      log(`\n✅ Archivado completado: ${archivedCount} reservas actualizadas a "${STATUS_EXPIRED}"`)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    log(`❌ Error fatal en el proceso: ${errorMsg}`)
    throw error
  }
}

// Ejecutar el script
archiveExpiredReservations()
  .then(() => {
    log("=== Script finalizado ===")
    process.exit(0)
  })
  .catch((error) => {
    log("=== Script terminado con errores ===", error)
    process.exit(1)
  })
