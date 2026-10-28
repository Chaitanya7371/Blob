import { Router } from "express";
import { CommentController } from "../Modules/Comment/comment.controller";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

/**
 * DELETE /api/comments/:id
 * Allowed for comment author OR post author.
 */
router.delete("/:id", authMiddleware, CommentController.remove);

export default router;
