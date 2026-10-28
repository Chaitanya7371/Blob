import { Router } from "express";
import { postController } from "../Modules/Post/post.controller";
import { commentController } from "../Modules/Comment/comment.controller";
import { AuthMiddleware } from "../middlewares/auth";
import { ValidateMiddleware } from "../middlewares/validate";
import { Validators } from "../middlewares/validators";

export class PostRoutes {
  static create(): Router {
    const router = Router();

    router.get("/", postController.list.bind(postController));
    router.post(
      "/",
      AuthMiddleware.handle,
      ValidateMiddleware.body(Validators.createPostSchema),
      postController.create.bind(postController)
    );

    router.get(
      "/:id/comments",
      commentController.list.bind(commentController)
    );
    router.post(
      "/:id/comments",
      AuthMiddleware.handle,
      ValidateMiddleware.body(Validators.createCommentSchema),
      commentController.create.bind(commentController)
    );

    router.get("/:id", postController.getById.bind(postController));
    router.patch(
      "/:id",
      AuthMiddleware.handle,
      ValidateMiddleware.body(Validators.updatePostSchema),
      postController.update.bind(postController)
    );
    router.delete(
      "/:id",
      AuthMiddleware.handle,
      postController.remove.bind(postController)
    );

    return router;
  }
}

export default PostRoutes.create();
