import { Request, Response, NextFunction } from "express";
import { UserService } from "./user.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AppError } from "../../utils/AppError";

/**
 * User controller — current user profile endpoints.
 * These routes always use auth middleware, so req.user exists.
 */
export const UserController = {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      const user = await UserService.getProfile(String(req.user._id));

      res
        .status(200)
        .json(ApiResponse.success("Profile fetched successfully", user));
    } catch (error) {
      next(error);
    }
  },

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      // Only name can be updated
      const { name } = req.body;
      const user = await UserService.updateName(String(req.user._id), name);

      res
        .status(200)
        .json(ApiResponse.success("Profile updated successfully", user));
    } catch (error) {
      next(error);
    }
  },
};
