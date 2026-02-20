/**
 * Voice Actions Service
 *
 * Define las acciones que el bot de voz puede ejecutar en el sistema de reservas.
 * Este servicio es el puente entre el bot y la API de Reservations.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ============ Tipos ============

export interface CreateReservationParams {
  customerName: string;
  customerPhone: string;
  restaurantId: string;
  reservationDate: string; // YYYY-MM-DD
  reservationTime: string; // HH:MM
  partySize: number;
  specialRequests?: string;
}

export interface ReservationResult {
  success: boolean;
  reservationCode?: string;
  message: string;
  data?: unknown;
  reservation?: ReservationDetails;
  availableSlots?: string[];
}

export interface ReservationDetails {
  reservationCode: string;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  partySize: number;
  status: string;
}

export interface ModifyReservationParams {
  code: string;
  phone: string;
  changes: {
    newDate?: string;
    newTime?: string;
    newPartySize?: number;
  };
}

// ============ Funciones de acción ============

/**
 * Crea una nueva reserva
 */
export async function createReservation(
  params: CreateReservationParams
): Promise<ReservationResult> {
  try {
    const response = await fetch(`${API_BASE}/api/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        reservationCode: data.reservationCode,
        message: `Reserva creada exitosamente. Tu código es ${data.reservationCode}.`,
        data,
      };
    }

    return {
      success: false,
      message: data.error || "No se pudo crear la reserva. Intenta con otra fecha u hora.",
    };
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Por favor intenta nuevamente.",
    };
  }
}

/**
 * Consulta una reserva por su código
 */
export async function getReservationByCode(
  code: string
): Promise<ReservationResult & { reservation?: ReservationDetails }> {
  try {
    // Normalizar código (quitar guiones si existen)
    const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "");

    const response = await fetch(
      `${API_BASE}/api/reservations?code=${normalizedCode}`
    );

    const data = await response.json();

    if (response.ok && data.reservations?.[0]) {
      const r = data.reservations[0];
      return {
        success: true,
        message: `Reserva encontrada a nombre de ${r.customerName} para el ${r.reservationDate} a las ${r.reservationTime}.`,
        reservation: {
          reservationCode: r.reservationCode,
          customerName: r.customerName,
          customerPhone: r.customerPhone,
          date: r.reservationDate,
          time: r.reservationTime,
          partySize: r.partySize,
          status: r.status,
        },
      };
    }

    return {
      success: false,
      message: "No encontré ninguna reserva con ese código. Verifica e intenta nuevamente.",
    };
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Por favor intenta nuevamente.",
    };
  }
}

/**
 * Cancela una reserva
 */
export async function cancelReservation(
  code: string,
  phone: string
): Promise<ReservationResult> {
  try {
    // Primero verificar que la reserva existe y coincide con el teléfono
    const checkResult = await getReservationByCode(code);

    if (!checkResult.success) {
      return {
        success: false,
        message: checkResult.message,
      };
    }

    // Verificar que el teléfono coincide
    const normalizedPhone = phone.replace(/\D/g, "").slice(-10);
    const reservationPhone = checkResult.reservation!.customerPhone.replace(
      /\D/g,
      ""
    ).slice(-10);

    if (normalizedPhone !== reservationPhone) {
      return {
        success: false,
        message: "El número de teléfono no coincide con el de la reserva.",
      };
    }

    // Cancelar la reserva
    const response = await fetch(`${API_BASE}/api/reservations/${code}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    if (response.ok) {
      return {
        success: true,
        message: `La reserva ${code.toUpperCase()} ha sido cancelada exitosamente.`,
      };
    }

    return {
      success: false,
      message: "No se pudo cancelar la reserva. Es posible que ya esté cancelada.",
    };
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Por favor intenta nuevamente.",
    };
  }
}

/**
 * Modifica una reserva existente
 */
export async function modifyReservation(
  params: ModifyReservationParams
): Promise<ReservationResult> {
  try {
    // Primero verificar que la reserva existe
    const checkResult = await getReservationByCode(params.code);

    if (!checkResult.success) {
      return {
        success: false,
        message: checkResult.message,
      };
    }

    // Verificar que el teléfono coincide
    const normalizedPhone = params.phone.replace(/\D/g, "").slice(-10);
    const reservationPhone = checkResult.reservation!.customerPhone.replace(
      /\D/g,
      ""
    ).slice(-10);

    if (normalizedPhone !== reservationPhone) {
      return {
        success: false,
        message: "El número de teléfono no coincide con el de la reserva.",
      };
    }

    // Modificar la reserva
    const response = await fetch(`${API_BASE}/api/reservations/${params.code}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: params.phone,
        ...params.changes,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      const changes: string[] = [];
      if (params.changes.newDate) changes.push(`fecha ${params.changes.newDate}`);
      if (params.changes.newTime) changes.push(`hora ${params.changes.newTime}`);
      if (params.changes.newPartySize)
        changes.push(`${params.changes.newPartySize} personas`);

      return {
        success: true,
        message: `Tu reserva ha sido modificada: ${changes.join(", ")}.`,
      };
    }

    return {
      success: false,
      message: data.error || "No se pudo modificar la reserva.",
    };
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Por favor intenta nuevamente.",
    };
  }
}

/**
 * Consulta disponibilidad
 */
export async function checkAvailability(
  date: string,
  time: string,
  partySize: number
): Promise<ReservationResult & { availableSlots?: string[] }> {
  try {
    const response = await fetch(
      `${API_BASE}/api/reservations/availability?date=${date}&time=${time}&partySize=${partySize}`
    );

    const data = await response.json();

    if (response.ok) {
      if (data.available) {
        return {
          success: true,
          message: `Sí, tenemos disponibilidad para ${partySize} personas el ${date} a las ${time}.`,
        };
      }

      return {
        success: true,
        message: `No tengo disponibilidad para ${partySize} personas el ${date} a las ${time}.`,
        availableSlots: data.alternativeTimes || [],
      };
    }

    return {
      success: false,
      message: "No pude verificar la disponibilidad. Intenta nuevamente.",
    };
  } catch (error) {
    return {
      success: false,
      message: "Error de conexión. Por favor intenta nuevamente.",
    };
  }
}

/**
 * Procesa una intención del bot y ejecuta la acción correspondiente
 *
 * Esta función es llamada por el endpoint /api/voice-bridge
 * cuando el bot quiere ejecutar una acción.
 */
export async function processVoiceAction(
  action: string,
  params: Record<string, unknown>
): Promise<ReservationResult> {
  switch (action) {
    case "createReservation":
      return createReservation(params as unknown as CreateReservationParams);

    case "getReservation":
      return getReservationByCode(params.code as string);

    case "cancelReservation":
      return cancelReservation(
        params.code as string,
        params.phone as string
      );

    case "modifyReservation":
      return modifyReservation(params as unknown as ModifyReservationParams);

    case "checkAvailability":
      return checkAvailability(
        params.date as string,
        params.time as string,
        params.partySize as number
      );

    default:
      return {
        success: false,
        message: `Acción no reconocida: ${action}`,
      };
  }
}

/**
 * Formatea el resultado de una acción para que el bot lo pueda decir en voz
 */
export function formatResultForVoice(result: ReservationResult): string {
  if (result.success) {
    return result.message;
  }

  // Mensajes de error más amigables para voz
  const errorMap: Record<string, string> = {
    "No encontré ninguna reserva con ese código":
      "Lo siento, no encontré ninguna reserva con ese código.",
    "El número de teléfono no coincide con el de la reserva":
      "El número de teléfono no coincide. Por favor verifícalo.",
    "No se pudo crear la reserva. Intenta con otra fecha u hora":
      "Lo siento, no tengo disponibilidad en ese horario. ¿Quieres que te ofrezca otra hora?",
  };

  return errorMap[result.message] || result.message;
}
