import { Request, Response, NextFunction } from "express";
import { StatsService } from "./stats.service";
import { ApiResponse } from "../../utils/ApiResponse";

/**
 * GET /api/stats — public statistics.
 */
export const StatsController = {
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await StatsService.getPublicStats();

      res
        .status(200)
        .json(ApiResponse.success("Stats fetched successfully", stats));
    } catch (error) {
      next(error);
    }
  },
};
