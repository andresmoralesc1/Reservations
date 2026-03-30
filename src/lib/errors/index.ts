/**
 * Sistema de errores - Exportaciones principales
 */

export {
  AppError,
  type AppError as AppErrorType,
} from "./AppError"

export {
  ApiError,
  ClientError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  ServerError,
  DatabaseError,
  ExternalServiceError,
  createFromResponse,
} from "./ApiError"

export {
  handleError,
  handleApiError,
  handleAsync,
  isErrorOperational,
  logError,
  getUserMessage,
  errorResponse,
} from "./handlers"

export {
  withErrorLogging,
  withRetry,
  withTimeout,
} from "./decorators"

export {
  withApiHandler,
  withJsonHandler,
  getValidatedBody,
  getQueryParams,
  apiResponses,
  type ApiHandlerOptions,
} from "./api-handler"
