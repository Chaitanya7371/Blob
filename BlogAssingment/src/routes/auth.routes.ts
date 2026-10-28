import { Router } from "express";
import { AuthController } from "../Modules/Auth/auth.controller";
import { validateBody } from "../middlewares/validate";
import { signupSchema, loginSchema } from "../middlewares/validators";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

/**
 * Auth routes
 *
 * POST /api/auth/signup      -> create account
 * POST /api/auth/login       -> create session + cookie
 * POST /api/auth/logout      -> delete current session
 * POST /api/auth/logout-all  -> delete ALL sessions (every device)
 */
router.post("/signup", validateBody(signupSchema), AuthController.signup);
router.post("/login", validateBody(loginSchema), AuthController.login);
router.post("/logout", AuthController.logout);
router.post("/logout-all", authMiddleware, AuthController.logoutAll);

export default router;
