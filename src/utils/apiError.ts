export class ApiError extends Error {
  statusCode: number;
  success: boolean;
  errorDetails: unknown;
  isOperational: boolean;

  constructor(statusCode: number, message: string, errorDetails: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.success = false;
    this.errorDetails = errorDetails;
    this.isOperational = true;
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

  static unprocessable(message = "Unprocessable Entity", errorDetails: unknown = null) {
    return new ApiError(422, message, errorDetails);
  }

  static tooManyRequests(message = "Too Many Requests", errorDetails: unknown = null) {
    return new ApiError(429, message, errorDetails);
  }

  static internal(message = "Internal Server Error", errorDetails: unknown = null) {
    return new ApiError(500, message, errorDetails);
  }
}