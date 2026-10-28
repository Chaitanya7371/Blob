import { Router } from "express";
import { PostController } from "../Modules/Post/post.controller";
import { CommentController } from "../Modules/Comment/comment.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import {
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
} from "../middlewares/validators";

const router = Router();

/**
 * Post + nested comment routes
 */
router.get("/", PostController.list);
router.post(
  "/",
  authMiddleware,
  validateBody(createPostSchema),
  PostController.create
);

router.get("/:id/comments", CommentController.list);
router.post(
  "/:id/comments",
  authMiddleware,
  validateBody(createCommentSchema),
  CommentController.create
);

router.get("/:id", PostController.getById);
router.patch(
  "/:id",
  authMiddleware,
  validateBody(updatePostSchema),
  PostController.update
);
router.delete("/:id", authMiddleware, PostController.remove);

export default router;
