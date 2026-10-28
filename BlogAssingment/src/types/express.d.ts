import { IUser } from "../model/User.model";

/**
 * Extend Express Request so TypeScript knows about req.user
 * after the auth middleware runs.
 */
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export {};
