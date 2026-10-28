import { UserRepository } from "../../Repository/User.repository";
import { SessionRepository } from "../../Repository/Session.repository";
import { AppError } from "../../utils/AppError";
import { IUser } from "../../model/User.model";
import { ISession } from "../../model/Session.model";
import {
  isLoginBlocked,
  getLockMinutesRemaining,
  recordFailedLogin,
  clearFailedLogins,
} from "../../utils/loginLimiter";

const INVALID_LOGIN_MESSAGE = "Invalid email or password";

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
 */
export const AuthService = {
  async signup(data: SignupData): Promise<IUser> {
    const existing = await UserRepository.findByEmail(data.email);

    if (existing) {
      throw new AppError("Email is already registered", 409);
    }

    const user = await UserRepository.create(data);
    return user;
  },

  async login(
    email: string,
    password: string,
    userAgent: string
  ): Promise<LoginResult> {
    // Too many failed attempts?
    if (isLoginBlocked(email)) {
      const minutes = getLockMinutesRemaining(email);
      throw new AppError(
        `Too many failed login attempts. Try again in ${minutes} minute(s).`,
        429
      );
    }

    const user = await UserRepository.findByEmailWithPassword(email);

    if (!user) {
      recordFailedLogin(email);
      throw new AppError(INVALID_LOGIN_MESSAGE, 401);
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      recordFailedLogin(email);
      throw new AppError(INVALID_LOGIN_MESSAGE, 401);
    }

    // Success → reset the counter
    clearFailedLogins(email);

    const userId = String(user._id);
    const session = await SessionRepository.create(userId, userAgent);
    const safeUser = await UserRepository.findById(userId);

    if (!safeUser) {
      throw new AppError(INVALID_LOGIN_MESSAGE, 401);
    }

    return { user: safeUser, session };
  },

  async logout(token: string): Promise<void> {
    await SessionRepository.deleteByToken(token);
  },

  /** Log out from every device — delete all sessions for this user */
  async logoutAll(userId: string): Promise<number> {
    return SessionRepository.deleteAllByUserId(userId);
  },
};
