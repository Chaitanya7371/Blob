import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AppError } from "../../utils/AppError";
import { TokenHelper } from "../../utils/token";

/**
 * Auth controller — signup, login, logout, logout-all.
 * Body fields are already validated by Zod middleware.
 */
export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const user = await authService.signup({ name, email, password });

      res
        .status(201)
        .json(ApiResponse.success("User created successfully", user, 201));
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const userAgent = req.headers["user-agent"] || "";
      const ip = this.clientIp(req);
      const { user, session } = await authService.login(
        email,
        password,
        userAgent,
        ip
      );

      res.status(200).json(
        ApiResponse.success("Logged in successfully", {
          user,
          token: session.token,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = TokenHelper.extractBearer(req);

      if (!token) {
        throw new AppError("Unauthorized", 401);
      }

      await authService.logout(token);

      res.status(200).json(ApiResponse.success("Logged out successfully"));
    } catch (error) {
      next(error);
    }
  }

  async logoutAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      const deletedCount = await authService.logoutAll(String(req.user._id));

      res.status(200).json(
        ApiResponse.success("Logged out from all devices", {
          deletedSessions: deletedCount,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  private clientIp(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) {
      return forwarded.split(",")[0].trim();
    }
    return req.ip || req.socket.remoteAddress || "unknown";
  }
}

export const authController = new AuthController();
