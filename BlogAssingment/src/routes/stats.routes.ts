import { Router } from "express";
import { statsController } from "../Modules/Stats/stats.controller";

export class StatsRoutes {
  static create(): Router {
    const router = Router();
    router.get("/", statsController.getStats.bind(statsController));
    return router;
  }
}

export default StatsRoutes.create();
