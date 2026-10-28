import { userRepository } from "../../Repository/User.repository";
import { sessionRepository } from "../../Repository/Session.repository";
import { AppError } from "../../utils/AppError";
import { CacheHelper } from "../../utils/cache";
import { RedisKeys, RedisTtl } from "../../constants/redis";
import { Messages } from "../../constants/messages";
import { IUser } from "../../model/User.model";
import { ISession } from "../../model/Session.model";

export type SignupData = {
  name: string;
  email: string;
  password: string;
};

export type LoginResult = {
  user: IUser;
  session: ISession;
};

/**
 * Auth business logic: signup, login, logout, logout-all.
 * Login failures counted per email AND per IP.
 */
export class AuthService {
  async signup(data: SignupData): Promise<IUser> {
    const existing = await userRepository.findByEmail(data.email);

    if (existing) {
      throw new AppError(Messages.EMAIL_EXISTS, 409);
    }

    return userRepository.create(data);
  }

  async login(
    email: string,
    password: string,
    userAgent: string,
    ip: string
  ): Promise<LoginResult> {
    const emailFailKey = RedisKeys.loginFail(email);
    const ipFailKey = RedisKeys.loginFailIp(ip || "unknown");

    await this.assertNotRateLimited(emailFailKey);
    await this.assertNotRateLimited(ipFailKey);

    const user = await userRepository.findByEmailWithPassword(email);

    if (!user) {
      await this.recordFailedLogin(emailFailKey);
      await this.recordFailedLogin(ipFailKey);
      throw new AppError(Messages.INVALID_LOGIN, 401);
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      await this.recordFailedLogin(emailFailKey);
      await this.recordFailedLogin(ipFailKey);
      throw new AppError(Messages.INVALID_LOGIN, 401);
    }

    await CacheHelper.delKeys(emailFailKey, ipFailKey);

    const userId = String(user._id);
    const session = await sessionRepository.create(userId, userAgent);

    const remainingSeconds = Math.max(
      1,
      Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
    );
    await CacheHelper.set(
      RedisKeys.session(session.token),
      userId,
      remainingSeconds
    );
    await CacheHelper.saddWithExpire(
      RedisKeys.userSessions(userId),
      session.token,
      remainingSeconds
    );

    const safeUser = await userRepository.findById(userId);

    if (!safeUser) {
      throw new AppError(Messages.INVALID_LOGIN, 401);
    }

    return { user: safeUser, session };
  }

  async logout(token: string): Promise<void> {
    const session = await sessionRepository.findByToken(token);
    const userIdFromRedis = await CacheHelper.get(RedisKeys.session(token));

    await sessionRepository.deleteByToken(token);
    await CacheHelper.delKeys(RedisKeys.session(token));

    const userId = session
      ? String(session.userId)
      : userIdFromRedis ?? null;

    if (userId) {
      await CacheHelper.srem(RedisKeys.userSessions(userId), token);
    }
  }

  async logoutAll(userId: string): Promise<number> {
    const setKey = RedisKeys.userSessions(userId);
    const tokens = await CacheHelper.smembers(setKey);

    const deletedCount = await sessionRepository.deleteAllByUserId(userId);

    for (const token of tokens) {
      await CacheHelper.delKeys(RedisKeys.session(token));
    }
    await CacheHelper.delKeys(setKey);

    return deletedCount;
  }

  private async assertNotRateLimited(failKey: string): Promise<void> {
    const failCountRaw = await CacheHelper.get(failKey);
    const failCount = failCountRaw ? Number(failCountRaw) : 0;

    if (failCount >= RedisTtl.LOGIN_FAIL_MAX) {
      const ttl = await CacheHelper.ttl(failKey);
      const minutes = Math.max(1, Math.ceil(Math.max(ttl, 0) / 60));
      throw new AppError(
        `Too many login attempts. Try again in ${minutes} minutes`,
        429
      );
    }
  }

  private async recordFailedLogin(failKey: string): Promise<void> {
    const count = await CacheHelper.incr(failKey);
    if (count === 1) {
      await CacheHelper.expire(failKey, RedisTtl.LOGIN_FAIL_SECONDS);
    }
  }
}

export const authService = new AuthService();
