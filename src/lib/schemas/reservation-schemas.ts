/**
 * Schemas Zod para validación de Reservas
 *
 * Proporciona validación runtime para inputs de API.
 * Complementa los tipos TypeScript con validación en tiempo de ejecución.
 */

import { z } from "zod"
import type { ReservationStatusEnum, ReservationSource } from "@/types/reservation"

// ============ Helpers ============

/**
 * Validador de teléfono español
 * Acepta: +34 6XX XXX XXX, 6XXXXXXXX, 34 6XX XXX XXX
 */
export const spanishPhoneSchema = z
  .string()
  .min(9, "Teléfono muy corto")
  .max(15, "Teléfono muy largo")
  .refine(
    (phone) => {
      const digits = phone.replace(/\D/g, "")
      const cleaned = digits.startsWith("34") && digits.length === 11
        ? digits.slice(2)
        : digits
      return /^[6789]\d{8}$/.test(cleaned)
    },
    "Teléfono español inválido. Formato: +34 6XX XXX XXX o 6XXXXXXXX"
  )

/**
 * Validador de fecha en formato YYYY-MM-DD
 */
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido. Use YYYY-MM-DD")
  .refine(
    (date) => {
      const parsed = new Date(date)
      return !isNaN(parsed.getTime())
    },
    "Fecha inválida"
  )
  .refine(
    (date) => {
      const parsed = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return parsed >= today
    },
    "La fecha no puede ser anterior a hoy"
  )

/**
 * Validador de hora en formato HH:MM
 */
const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Formato de hora inválido. Use HH:MM")
  .refine(
    (time) => {
      const [hours, minutes] = time.split(":").map(Number)
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
    },
    "Hora inválida"
  )

/**
 * Estados válidos de reserva
 */
const reservationStatusSchema = z.enum([
  "PENDIENTE",
  "CONFIRMADO",
  "CANCELADO",
  "NO_SHOW",
  "COMPLETED",
] as const)

/**
 * Fuentes válidas de reserva
 */
const reservationSourceSchema = z.enum([
  "WEB",
  "WHATSAPP",
  "IVR",
  "ADMIN",
  "API",
] as const)

// ============ Schemas Principales ============

/**
 * Schema para crear una nueva reserva
 *
 * @example
 * const result = CreateReservationSchema.safeParse({
 *   customerName: "Carlos García",
 *   customerPhone: "+34 612 345 678",
 *   date: "2026-04-01",
 *   time: "20:00",
 *   partySize: 4,
 * })
 */
export const CreateReservationSchema = z.object({
  // Cliente
  customerName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  customerPhone: spanishPhoneSchema,
  customerEmail: z
    .string()
    .email("Email inválido")
    .optional()
    .nullable(),

  // Reserva
  restaurantId: z
    .string()
    .uuid("ID de restaurante inválido")
    .optional(),
  date: dateSchema,
  time: timeSchema,
  partySize: z
    .number()
    .int("El número de personas debe ser un entero")
    .min(1, "Mínimo 1 persona")
    .max(50, "Máximo 50 personas (para grupos mayores contacte directamente)"),
  tableIds: z
    .array(z.string().uuid())
    .optional(),

  // Opciones
  specialRequests: z
    .string()
    .max(500, "Las solicitudes especiales no pueden exceder 500 caracteres")
    .optional()
    .nullable(),
  source: reservationSourceSchema.optional().default("WEB"),
  estimatedDurationMinutes: z
    .number()
    .int()
    .min(30)
    .max(240)
    .optional(),
})

export type CreateReservationInput = z.infer<typeof CreateReservationSchema>

/**
 * Schema para actualizar una reserva existente
 *
 * Todos los campos son opcionales, solo se actualizan los proporcionados
 */
export const UpdateReservationSchema = z.object({
  status: reservationStatusSchema.optional(),
  date: dateSchema.optional(),
  time: timeSchema.optional(),
  partySize: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional(),
  tableIds: z.array(z.string().uuid()).optional(),
  specialRequests: z.string().max(500).optional().nullable(),
  estimatedDurationMinutes: z.number().int().min(30).max(240).optional(),
})

export type UpdateReservationInput = z.infer<typeof UpdateReservationSchema>

/**
 * Schema para verificar disponibilidad
 */
export const CheckAvailabilitySchema = z.object({
  date: dateSchema,
  time: timeSchema,
  partySize: z
    .number()
    .int()
    .min(1, "Mínimo 1 persona")
    .max(50, "Máximo 50 personas"),
  restaurantId: z.string().uuid().optional(),
})

export type CheckAvailabilityInput = z.infer<typeof CheckAvailabilitySchema>

/**
 * Schema para cancelar una reserva
 *
 * Requiere código de reserva y teléfono para verificación
 */
export const CancelReservationSchema = z.object({
  code: z
    .string()
    .regex(/^RES-[A-Z0-9]{5}$/i, "Código de reserva inválido. Formato: RES-XXXXX")
    .transform((val) => val.toUpperCase()),
  phone: spanishPhoneSchema,
})

export type CancelReservationInput = z.infer<typeof CancelReservationSchema>

/**
 * Schema para buscar reserva por código
 */
export const GetReservationSchema = z.object({
  code: z
    .string()
    .regex(/^RES-[A-Z0-9]{5}$/i, "Código de reserva inválido")
    .transform((val) => val.toUpperCase()),
})

export type GetReservationInput = z.infer<typeof GetReservationSchema>

/**
 * Schema para filtros de búsqueda
 */
export const ReservationFiltersSchema = z.object({
  status: reservationStatusSchema.optional(),
  date: dateSchema.optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  customerId: z.string().uuid().optional(),
  restaurantId: z.string().uuid().optional(),
  partySize: z.number().int().positive().optional(),
  tableId: z.string().uuid().optional(),
  searchQuery: z.string().max(100).optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
})

export type ReservationFiltersInput = z.infer<typeof ReservationFiltersSchema>

/**
 * Schema para aprobación masiva de reservas
 */
export const BulkActionSchema = z.object({
  action: z.enum(["approve", "reject", "cancel"]),
  reservationIds: z
    .array(z.string().uuid())
    .min(1, "Debe seleccionar al menos una reserva")
    .max(50, "No puede procesar más de 50 reservas a la vez"),
  reason: z.string().max(500).optional(),
})

export type BulkActionInput = z.infer<typeof BulkActionSchema>

// ============ Voice API Schemas ============

/**
 * Schema para acciones del bot de voz
 */
export const VoiceActionSchema = z.enum([
  "checkAvailability",
  "createReservation",
  "getReservation",
  "cancelReservation",
  "modifyReservation",
])

export const VoiceCheckAvailabilitySchema = z.object({
  date: dateSchema,
  time: timeSchema,
  partySize: z.number().int().min(1).max(50),
  restaurantId: z.string().uuid().optional(),
})

export const VoiceCreateReservationSchema = z.object({
  customerName: z.string().min(2).max(100),
  customerPhone: spanishPhoneSchema,
  date: dateSchema,
  time: timeSchema,
  partySize: z.number().int().min(1).max(50),
  restaurantId: z.string().uuid().optional(),
  specialRequests: z.string().max(500).optional(),
})

export const VoiceGetReservationSchema = z.object({
  code: z.string().regex(/^RES-[A-Z0-9]{5}$/i).transform((val) => val.toUpperCase()),
})

export const VoiceCancelReservationSchema = z.object({
  code: z.string().regex(/^RES-[A-Z0-9]{5}$/i).transform((val) => val.toUpperCase()),
  phone: spanishPhoneSchema,
})

/**
 * Schema para modificar reserva - acepta dos formatos:
 * Formato plano (Pipecat): { code, phone, newDate?, newTime?, newPartySize? }
 * Formato anidado: { code, phone, changes: { newDate?, newTime?, newPartySize? } }
 */
export const VoiceModifyReservationSchema = z.object({
  code: z.string().regex(/^RES-[A-Z0-9]{5}$/i).transform((val) => val.toUpperCase()),
  phone: spanishPhoneSchema,
  // Accept both flat format (newDate, newTime, newPartySize at root) and nested format (changes.{...})
  newDate: dateSchema.optional(),
  newTime: timeSchema.optional(),
  newPartySize: z.number().int().min(1).max(50).optional(),
  changes: z.object({
    newDate: dateSchema.optional(),
    newTime: timeSchema.optional(),
    newPartySize: z.number().int().min(1).max(50).optional(),
    newSpecialRequests: z.string().max(500).optional(),
  }).optional(),
}).refine(
  // Check if at least one change is provided (either in flat format or nested format)
  (data) => {
    const hasFlatChanges = data.newDate || data.newTime || data.newPartySize || data.newSpecialRequests
    const hasNestedChanges = data.changes?.newDate || data.changes?.newTime || data.changes?.newPartySize || data.changes?.newSpecialRequests
    return hasFlatChanges || hasNestedChanges
  },
  "Debe proporcionar al menos un cambio: newDate, newTime o newPartySize"
)

// ============ Error Formatting ============

/**
 * Formatea errores de Zod para respuestas de API
 *
 * @example
 * try {
 *   CreateReservationSchema.parse(data)
 * } catch (error) {
 *   const formatted = formatZodError(error)
 *   return NextResponse.json(formatted, { status: 400 })
 * }
 */
export function formatZodError(error: unknown): {
  error: string
  details: Record<string, string[]>
  message: string
} {
  if (error instanceof z.ZodError) {
    const details: Record<string, string[]> = {}
    error.errors.forEach((err) => {
      const path = err.path.join(".") || "general"
      if (!details[path]) {
        details[path] = []
      }
      details[path].push(err.message)
    })

    return {
      error: "Validation failed",
      details,
      message: `Se encontraron ${error.errors.length} error(es) de validación`,
    }
  }

  return {
    error: "Unknown error",
    details: {},
    message: "Error desconocido al procesar la solicitud",
  }
}

/**
 * Wrapper para validación de request body
 *
 * @example
 * export async function POST(request: NextRequest) {
 *   const body = await request.json()
 *   const validated = validateRequestBody(body, CreateReservationSchema)
 *   if (!validated.success) {
 *     return NextResponse.json(validated.error, { status: 400 })
 *   }
 *   // Usar validated.data
 * }
 */
export function validateRequestBody<T extends z.ZodType>(
  data: unknown,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: ReturnType<typeof formatZodError> } {
  const result = schema.safeParse(data)

  if (!result.success) {
    return {
      success: false,
      error: formatZodError(result.error),
    }
  }

  return {
    success: true,
    data: result.data,
  }
}

// ============ Re-exports ============

export const reservationSchemas = {
  create: CreateReservationSchema,
  update: UpdateReservationSchema,
  checkAvailability: CheckAvailabilitySchema,
  cancel: CancelReservationSchema,
  get: GetReservationSchema,
  filters: ReservationFiltersSchema,
  bulkAction: BulkActionSchema,
  voice: {
    action: VoiceActionSchema,
    checkAvailability: VoiceCheckAvailabilitySchema,
    create: VoiceCreateReservationSchema,
    get: VoiceGetReservationSchema,
    cancel: VoiceCancelReservationSchema,
    modify: VoiceModifyReservationSchema,
  },
}
