import { Router } from "express";
import { UserController } from "../Modules/User/user.controller";
import { PostController } from "../Modules/Post/post.controller";
import { authMiddleware } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { updateNameSchema } from "../middlewares/validators";

const router = Router();

/**
 * User routes (all require login)
 *
 * GET   /api/users/me       -> current user profile
 * PATCH /api/users/me       -> update name only
 * GET   /api/users/me/posts -> my posts (including drafts)
 */
router.get("/me", authMiddleware, UserController.getMe);
router.patch(
  "/me",
  authMiddleware,
  validateBody(updateNameSchema),
  UserController.updateMe
);
router.get("/me/posts", authMiddleware, PostController.getMyPosts);

export default router;
