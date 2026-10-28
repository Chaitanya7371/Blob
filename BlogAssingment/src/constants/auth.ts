/**
 * Auth-related constants (session length, header name).
 */
export class AuthConstants {
  /** Header: Authorization: Bearer <token> */
  static readonly HEADER_SCHEME = "Bearer";
  static readonly SESSION_DAYS = 7;
  static readonly SESSION_MS = 7 * 24 * 60 * 60 * 1000;
}

export const AUTH = {
  HEADER_SCHEME: AuthConstants.HEADER_SCHEME,
  SESSION_DAYS: AuthConstants.SESSION_DAYS,
  SESSION_MS: AuthConstants.SESSION_MS,
} as const;
