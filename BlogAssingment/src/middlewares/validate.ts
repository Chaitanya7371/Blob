import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";
import { AppError } from "../utils/AppError";

/**
 * Reusable middleware: validate req.body with a Zod schema BEFORE saving.
 * On success, replaces req.body with the cleaned/parsed data.
 */
export const validateBody = (schema: ZodType) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Join all field errors into one clear message (no stack traces)
        const message = error.issues.map((issue) => issue.message).join("; ");
        next(new AppError(message || "Validation error", 400));
        return;
      }
      next(error);
    }
  };
};
