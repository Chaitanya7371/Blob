import { Router } from "express";
import { StatsController } from "../Modules/Stats/stats.controller";

const router = Router();

/**
 * GET /api/stats -> public blog statistics (one $facet aggregation)
 */
router.get("/", StatsController.getStats);

export default router;
