import { Response } from "express";
import { AUTH } from "../constants/auth";
import config from "../constants/config";

/**
 * Helpers to set / clear the session cookie on the browser.
 */
export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(AUTH.COOKIE_NAME, token, {
    httpOnly: true, // JavaScript in the browser cannot read this cookie
    secure: config.nodeEnv === "production", // HTTPS only in production
    sameSite: "lax",
    maxAge: AUTH.SESSION_MS,
  });
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(AUTH.COOKIE_NAME, {
    httpOnly: true,
    secure: config.nodeEnv === "production",
    sameSite: "lax",
  });
};
