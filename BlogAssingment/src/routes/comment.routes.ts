import { Router } from "express";
import { commentController } from "../Modules/Comment/comment.controller";
import { AuthMiddleware } from "../middlewares/auth";

export class CommentRoutes {
  static create(): Router {
    const router = Router();

    router.delete(
      "/:id",
      AuthMiddleware.handle,
      commentController.remove.bind(commentController)
    );

    return router;
  }
}

export default CommentRoutes.create();
