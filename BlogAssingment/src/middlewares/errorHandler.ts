import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { ApiResponse } from "../utils/ApiResponse";
import { MESSAGES } from "../constants/messages";

/**
 * Remove anything that looks like a password from a message string.
 * Extra safety so we never leak secrets in responses.
 */
const sanitizeMessage = (message: string): string => {
  return message.replace(/password["']?\s*[:=]\s*["']?[^"',}\s]+/gi, "password=[REDACTED]");
};

/**
 * Global error handler.
 *
 * Rules:
 * - Response shape: { success: false, message: "..." }
 * - Correct status codes: 400, 401, 403, 404, 409, 500, ...
 * - NEVER send password or a raw error stack in the response
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log full error on the server only (including stack) — not sent to client
  console.error("Error:", err.message);
  if (err.stack) {
    console.error(err.stack);
  }

  // Our own AppError (expected errors)
  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json(ApiResponse.error(sanitizeMessage(err.message)));
    return;
  }

  // Mongoose validation error → 400
  if (err.name === "ValidationError") {
    res.status(400).json(ApiResponse.error(sanitizeMessage(err.message)));
    return;
  }

  // Invalid MongoDB ObjectId → 400
  if (err.name === "CastError") {
    res.status(400).json(ApiResponse.error("Invalid id format"));
    return;
  }

  // Duplicate key (unique email / token) → 409
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: number }).code === 11000
  ) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue;
    const field = keyValue ? Object.keys(keyValue)[0] : undefined;

    if (field === "email") {
      res.status(409).json(ApiResponse.error("Email is already registered"));
      return;
    }

    res.status(409).json(ApiResponse.error("Duplicate value"));
    return;
  }

  // Unexpected errors → 500 (safe message only, no stack)
  res.status(500).json(ApiResponse.error(MESSAGES.INTERNAL_ERROR));
};
