import { Request, Response, NextFunction } from "express";
import { statsService } from "./stats.service";
import { ApiResponse } from "../../utils/ApiResponse";

/**
 * GET /api/stats — public statistics.
 */
export class StatsController {
  async getStats(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { data, cache } = await statsService.getPublicStats();

      res.setHeader("X-Cache", cache);
      res
        .status(200)
        .json(ApiResponse.success("Stats fetched successfully", data));
    } catch (error) {
      next(error);
    }
  }
}

export const statsController = new StatsController();
