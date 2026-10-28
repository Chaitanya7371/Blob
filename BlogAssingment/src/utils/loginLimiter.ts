/**
 * Simple in-memory login rate limiter.
 * Blocks an email after 5 failed attempts within 15 minutes.
 *
 * Note: resets when the server restarts. Fine for learning;
 * in production you would use Redis.
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

type AttemptRecord = {
  count: number;
  windowStart: number;
};

const attempts = new Map<string, AttemptRecord>();

const normalizeKey = (email: string): string => email.toLowerCase().trim();

/**
 * Returns true if this email is currently locked out.
 */
export const isLoginBlocked = (email: string): boolean => {
  const key = normalizeKey(email);
  const record = attempts.get(key);

  if (!record) {
    return false;
  }

  const elapsed = Date.now() - record.windowStart;

  // Window expired → clear and allow
  if (elapsed > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }

  return record.count >= MAX_ATTEMPTS;
};

/**
 * How many minutes left until the lock expires (for error messages).
 */
export const getLockMinutesRemaining = (email: string): number => {
  const key = normalizeKey(email);
  const record = attempts.get(key);

  if (!record) {
    return 0;
  }

  const remainingMs = WINDOW_MS - (Date.now() - record.windowStart);
  return Math.max(1, Math.ceil(remainingMs / 60000));
};

/** Call after a failed login */
export const recordFailedLogin = (email: string): void => {
  const key = normalizeKey(email);
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now - record.windowStart > WINDOW_MS) {
    attempts.set(key, { count: 1, windowStart: now });
    return;
  }

  record.count += 1;
  attempts.set(key, record);
};

/** Call after a successful login */
export const clearFailedLogins = (email: string): void => {
  attempts.delete(normalizeKey(email));
};
