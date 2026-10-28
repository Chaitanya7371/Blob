import crypto from "crypto";
import Session, { ISession } from "../model/Session.model";
import { AUTH } from "../constants/auth";
import { Types } from "mongoose";

export const SessionRepository = {
  /** Create a new session after a successful login */
  async create(userId: Types.ObjectId | string, userAgent: string): Promise<ISession> {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + AUTH.SESSION_MS);

    return Session.create({
      userId,
      token,
      expiresAt,
      userAgent,
    });
  },

  /** Find a session by its token string */
  async findByToken(token: string): Promise<ISession | null> {
    return Session.findOne({ token });
  },

  /** Delete one session (logout) */
  async deleteByToken(token: string): Promise<void> {
    await Session.deleteOne({ token });
  },

  /** Delete ALL sessions for a user (logout from every device) */
  async deleteAllByUserId(userId: string): Promise<number> {
    const result = await Session.deleteMany({ userId });
    return result.deletedCount ?? 0;
  },
};
