import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import postRoutes from "./post.routes";
import commentRoutes from "./comment.routes";
import statsRoutes from "./stats.routes";

const router = Router();

// Health check — used to verify the API is up
router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/posts", postRoutes);
router.use("/comments", commentRoutes);
router.use("/stats", statsRoutes);

export default router;
