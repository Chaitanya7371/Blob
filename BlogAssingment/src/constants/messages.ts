/**
 * Reusable response messages used across the app.
 */
export class Messages {
  static readonly SERVER_RUNNING = "Server is running";
  static readonly DB_CONNECTED = "MongoDB connected successfully";
  static readonly DB_CONNECTION_ERROR = "MongoDB connection failed";
  static readonly REDIS_CONNECTED = "Redis connected";
  static readonly NOT_FOUND = "Resource not found";
  static readonly VALIDATION_ERROR = "Validation error";
  static readonly INTERNAL_ERROR = "Something went wrong";
  static readonly INVALID_LOGIN = "Invalid email or password";
  static readonly EMAIL_EXISTS = "Email is already registered";
  static readonly UNAUTHORIZED = "Unauthorized";
}

export const MESSAGES = {
  SERVER_RUNNING: Messages.SERVER_RUNNING,
  DB_CONNECTED: Messages.DB_CONNECTED,
  DB_CONNECTION_ERROR: Messages.DB_CONNECTION_ERROR,
  REDIS_CONNECTED: Messages.REDIS_CONNECTED,
  NOT_FOUND: Messages.NOT_FOUND,
  VALIDATION_ERROR: Messages.VALIDATION_ERROR,
  INTERNAL_ERROR: Messages.INTERNAL_ERROR,
  INVALID_LOGIN: Messages.INVALID_LOGIN,
  EMAIL_EXISTS: Messages.EMAIL_EXISTS,
  UNAUTHORIZED: Messages.UNAUTHORIZED,
} as const;
