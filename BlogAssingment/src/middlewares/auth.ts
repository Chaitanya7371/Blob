import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { AUTH } from "../constants/auth";
import { SessionRepository } from "../Repository/Session.repository";
import { UserRepository } from "../Repository/User.repository";

/**
 * Auth middleware (session cookie):
 * 1) Read token from cookie
 * 2) Find session in DB
 * 3) Check it has not expired
 * 4) Load the user and attach to req.user
 *
 * Missing / invalid / expired token → 401
 */
export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.[AUTH.COOKIE_NAME] as string | undefined;

    if (!token) {
      throw new AppError("Unauthorized", 401);
    }

    const session = await SessionRepository.findByToken(token);

    if (!session) {
      throw new AppError("Unauthorized", 401);
    }

    // Extra safety check (TTL index also removes expired docs)
    if (session.expiresAt.getTime() < Date.now()) {
      await SessionRepository.deleteByToken(token);
      throw new AppError("Unauthorized", 401);
    }

    const user = await UserRepository.findById(String(session.userId));

    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    // Attach user so controllers can use req.user
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
