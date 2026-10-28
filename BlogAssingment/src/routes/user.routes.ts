import { Router } from "express";
import { userController } from "../Modules/User/user.controller";
import { postController } from "../Modules/Post/post.controller";
import { AuthMiddleware } from "../middlewares/auth";
import { ValidateMiddleware } from "../middlewares/validate";
import { Validators } from "../middlewares/validators";

export class UserRoutes {
  static create(): Router {
    const router = Router();

    router.get(
      "/me",
      AuthMiddleware.handle,
      userController.getMe.bind(userController)
    );
    router.patch(
      "/me",
      AuthMiddleware.handle,
      ValidateMiddleware.body(Validators.updateNameSchema),
      userController.updateMe.bind(userController)
    );
    router.get(
      "/me/posts",
      AuthMiddleware.handle,
      postController.getMyPosts.bind(postController)
    );

    return router;
  }
}

export default UserRoutes.create();
