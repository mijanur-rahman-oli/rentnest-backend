/**
 * Custom error class used across the app so every thrown error
 * carries an HTTP status code and optional structured error details.
 */
export class ApiError extends Error {
  statusCode: number;
  success: boolean;
  errorDetails: unknown;

  constructor(statusCode: number, message: string, errorDetails: unknown = null) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errorDetails = errorDetails;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad Request", errorDetails: unknown = null) {
    return new ApiError(400, message, errorDetails);
  }

  static unauthorized(message = "Unauthorized", errorDetails: unknown = null) {
    return new ApiError(401, message, errorDetails);
  }

  static forbidden(message = "Forbidden", errorDetails: unknown = null) {
    return new ApiError(403, message, errorDetails);
  }

  static notFound(message = "Resource not found", errorDetails: unknown = null) {
    return new ApiError(404, message, errorDetails);
  }

  static conflict(message = "Conflict", errorDetails: unknown = null) {
    return new ApiError(409, message, errorDetails);
  }

  static internal(message = "Internal Server Error", errorDetails: unknown = null) {
    return new ApiError(500, message, errorDetails);
  }
}
