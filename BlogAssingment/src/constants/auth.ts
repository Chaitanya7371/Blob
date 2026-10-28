/**
 * Auth-related constants (cookie name, session length, etc.)
 */
export const AUTH = {
  COOKIE_NAME: "token",
  // Session / cookie lasts 7 days
  SESSION_DAYS: 7,
  SESSION_MS: 7 * 24 * 60 * 60 * 1000,
} as const;
