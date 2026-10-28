import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { ApiResponse } from "../utils/ApiResponse";
import { MESSAGES } from "../constants/messages";

/**
 * Global error handler.
 * Response shape: { success: false, message: "..." }
 * Never send password or a raw error stack to the client.
 */
export class ErrorHandler {
  private static sanitizeMessage(message: string): string {
    return message.replace(
      /password["']?\s*[:=]\s*["']?[^"',}\s]+/gi,
      "password=[REDACTED]"
    );
  }

  static handle(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void {
    console.error("Error:", err.message);
    if (err.stack) {
      console.error(err.stack);
    }

    if (err instanceof AppError) {
      res
        .status(err.statusCode)
        .json(ApiResponse.error(ErrorHandler.sanitizeMessage(err.message)));
      return;
    }

    if (err.name === "ValidationError") {
      res
        .status(400)
        .json(ApiResponse.error(ErrorHandler.sanitizeMessage(err.message)));
      return;
    }

    if (err.name === "CastError") {
      res.status(400).json(ApiResponse.error("Invalid id format"));
      return;
    }

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

    res.status(500).json(ApiResponse.error(MESSAGES.INTERNAL_ERROR));
  }
}

export const errorHandler = ErrorHandler.handle;
