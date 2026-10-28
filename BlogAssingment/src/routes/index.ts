import { Router, Request, Response } from "express";
import { AuthRoutes } from "./auth.routes";
import { UserRoutes } from "./user.routes";
import { PostRoutes } from "./post.routes";
import { CommentRoutes } from "./comment.routes";
import { StatsRoutes } from "./stats.routes";

export class ApiRoutes {
  static create(): Router {
    const router = Router();

    router.get("/health", (_req: Request, res: Response) => {
      res.status(200).json({ status: "ok" });
    });

    router.use("/auth", AuthRoutes.create());
    router.use("/users", UserRoutes.create());
    router.use("/posts", PostRoutes.create());
    router.use("/comments", CommentRoutes.create());
    router.use("/stats", StatsRoutes.create());

    return router;
  }
}

export default ApiRoutes.create();
