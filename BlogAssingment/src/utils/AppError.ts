/**
 * Custom error class so we can attach an HTTP status code.
 * Example: throw new AppError("Blog not found", 404)
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    // Marks errors we expect (validation, not found) vs unexpected crashes
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
