import { Router } from "express";
import { authController } from "../Modules/Auth/auth.controller";
import { ValidateMiddleware } from "../middlewares/validate";
import { Validators } from "../middlewares/validators";
import { AuthMiddleware } from "../middlewares/auth";

export class AuthRoutes {
  static create(): Router {
    const router = Router();

    router.post(
      "/signup",
      ValidateMiddleware.body(Validators.signupSchema),
      authController.signup.bind(authController)
    );
    router.post(
      "/login",
      ValidateMiddleware.body(Validators.loginSchema),
      authController.login.bind(authController)
    );
    router.post("/logout", authController.logout.bind(authController));
    router.post(
      "/logout-all",
      AuthMiddleware.handle,
      authController.logoutAll.bind(authController)
    );

    return router;
  }
}

export default AuthRoutes.create();
