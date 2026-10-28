import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AppError } from "../../utils/AppError";
import { setAuthCookie, clearAuthCookie } from "../../utils/cookies";
import { AUTH } from "../../constants/auth";

/**
 * Auth controller — signup, login, logout, logout-all.
 * Body fields are already validated by Zod middleware.
 */
export const AuthController = {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;
      const user = await AuthService.signup({ name, email, password });

      res
        .status(201)
        .json(ApiResponse.success("User created successfully", user, 201));
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const userAgent = req.headers["user-agent"] || "";
      const { user, session } = await AuthService.login(
        email,
        password,
        userAgent
      );

      setAuthCookie(res, session.token);

      res.status(200).json(
        ApiResponse.success("Logged in successfully", {
          user,
          token: session.token,
        })
      );
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.[AUTH.COOKIE_NAME] as string | undefined;

      if (!token) {
        throw new AppError("Unauthorized", 401);
      }

      await AuthService.logout(token);
      clearAuthCookie(res);

      res.status(200).json(ApiResponse.success("Logged out successfully"));
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete ALL sessions for the logged-in user (every device),
   * then clear the current cookie.
   */
  async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      const deletedCount = await AuthService.logoutAll(String(req.user._id));
      clearAuthCookie(res);

      res.status(200).json(
        ApiResponse.success("Logged out from all devices", {
          deletedSessions: deletedCount,
        })
      );
    } catch (error) {
      next(error);
    }
  },
};
