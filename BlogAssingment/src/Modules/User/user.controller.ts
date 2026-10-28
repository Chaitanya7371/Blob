import { Request, Response, NextFunction } from "express";
import { userService } from "./user.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AppError } from "../../utils/AppError";

/**
 * User controller — current user profile endpoints.
 */
export class UserController {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      const { data, cache } = await userService.getProfile(
        String(req.user._id)
      );

      res.setHeader("X-Cache", cache);
      res
        .status(200)
        .json(ApiResponse.success("Profile fetched successfully", data));
    } catch (error) {
      next(error);
    }
  }

  async updateMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      const { name } = req.body;
      const user = await userService.updateName(String(req.user._id), name);

      res
        .status(200)
        .json(ApiResponse.success("Profile updated successfully", user));
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
