/**
 * Errores de API - para errores HTTP y respuestas de servicios externos
 */

import { AppError } from "./AppError"

export class ApiError extends AppError {
  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    context?: Record<string, unknown>
  ) {
    const errorCode = code || statusCodeToCode(statusCode)
    super(message, errorCode, statusCode, true, context)
    this.name = "ApiError"
  }
}

/**
 * Errores de cliente (4xx)
 */
export class ClientError extends ApiError {
  constructor(
    message: string,
    statusCode: number = 400,
    context?: Record<string, unknown>
  ) {
    super(message, statusCode, undefined, context)
    this.name = "ClientError"
  }
}

export class BadRequestError extends ClientError {
  constructor(message: string = "Bad Request", context?: Record<string, unknown>) {
    super(message, 400, context)
    this.name = "BadRequestError"
  }
}

export class UnauthorizedError extends ClientError {
  constructor(message: string = "Unauthorized", context?: Record<string, unknown>) {
    super(message, 401, context)
    this.name = "UnauthorizedError"
  }
}

export class ForbiddenError extends ClientError {
  constructor(message: string = "Forbidden", context?: Record<string, unknown>) {
    super(message, 403, context)
    this.name = "ForbiddenError"
  }
}

export class NotFoundError extends ClientError {
  constructor(message: string = "Resource not found", context?: Record<string, unknown>) {
    super(message, 404, context)
    this.name = "NotFoundError"
  }
}

export class ConflictError extends ClientError {
  constructor(message: string = "Conflict", context?: Record<string, unknown>) {
    super(message, 409, context)
    this.name = "ConflictError"
  }
}

export class ValidationError extends ClientError {
  constructor(
    message: string = "Validation failed",
    public readonly fields?: Record<string, string[]>
  ) {
    super(message, 422, { fields })
    this.name = "ValidationError"
  }
}

/**
 * Errores de servidor (5xx)
 */
export class ServerError extends ApiError {
  constructor(
    message: string = "Internal Server Error",
    statusCode: number = 500,
    context?: Record<string, unknown>
  ) {
    super(message, statusCode, undefined, context)
    this.name = "ServerError"
  }
}

export class DatabaseError extends ServerError {
  constructor(message: string = "Database error", context?: Record<string, unknown>) {
    super(message, 500, context)
    this.name = "DatabaseError"
  }
}

export class ExternalServiceError extends ServerError {
  constructor(
    service: string,
    message?: string,
    context?: Record<string, unknown>
  ) {
    const fullMessage = message || `Error communicating with ${service}`
    super(fullMessage, 502, { service, ...context })
    this.name = "ExternalServiceError"
  }
}

/**
 * Helper function to convert HTTP status codes to error codes
 */
function statusCodeToCode(statusCode: number): string {
  const codeMap: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMIT_EXCEEDED",
    500: "INTERNAL_SERVER_ERROR",
    502: "BAD_GATEWAY",
    503: "SERVICE_UNAVAILABLE",
    504: "GATEWAY_TIMEOUT",
  }
  return codeMap[statusCode] || "UNKNOWN_ERROR"
}

/**
 * Helper function to create an ApiError from a fetch Response
 */
export async function createFromResponse(
  response: Response,
  defaultMessage: string = "Request failed"
): Promise<ApiError> {
  let message = defaultMessage
  let context: Record<string, unknown> = {}

  try {
    const contentType = response.headers.get("content-type")
    if (contentType?.includes("application/json")) {
      const data = await response.json()
      message = data.message || data.error || message
      context = { ...data, message: undefined }
    } else {
      message = await response.text()
    }
  } catch {
    // If parsing fails, use default message
  }

  return new ApiError(message, response.status, undefined, {
    url: response.url,
    status: response.status,
    ...context,
  })
}
