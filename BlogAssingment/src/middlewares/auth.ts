import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { TokenHelper } from "../utils/token";
import { sessionRepository } from "../Repository/Session.repository";
import { userRepository } from "../Repository/User.repository";
import { CacheHelper } from "../utils/cache";
import { RedisKeys } from "../constants/redis";

/**
 * Auth middleware (Bearer token in Authorization header):
 * 1) Check Redis session:<token> first (on Redis failure → treat as miss)
 * 2) On miss, check MongoDB; if valid, re-hydrate Redis with remaining TTL
 * 3) Load user and attach to req.user
 */
export class AuthMiddleware {
  static async handle(
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = TokenHelper.extractBearer(req);

      if (!token) {
        throw new AppError("Unauthorized", 401);
      }

      let userId = await CacheHelper.get(RedisKeys.session(token));

      if (!userId) {
        const session = await sessionRepository.findByToken(token);

        if (!session) {
          throw new AppError("Unauthorized", 401);
        }

        if (session.expiresAt.getTime() < Date.now()) {
          await sessionRepository.deleteByToken(token);
          throw new AppError("Unauthorized", 401);
        }

        userId = String(session.userId);
        const remainingSeconds = Math.max(
          1,
          Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
        );
        await CacheHelper.set(
          RedisKeys.session(token),
          userId,
          remainingSeconds
        );
        await CacheHelper.saddWithExpire(
          RedisKeys.userSessions(userId),
          token,
          remainingSeconds
        );
      }

      const user = await userRepository.findById(userId);

      if (!user) {
        throw new AppError("Unauthorized", 401);
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  }
}

export const authMiddleware = AuthMiddleware.handle;
