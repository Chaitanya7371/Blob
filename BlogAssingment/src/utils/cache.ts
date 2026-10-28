import { getRedis } from "../providers/redis/connection";

/**
 * Hand-rolled Redis helpers.
 * If Redis is down or a command fails: log and continue (API still works via MongoDB).
 * Never use the KEYS command — use SCAN only if key search is needed.
 */
export class CacheHelper {
  private static logRedisError(action: string, err: unknown): void {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Redis ${action} failed:`, message);
  }

  static async getJSON<T>(key: string): Promise<T | null> {
    try {
      const raw = await getRedis().get(key);
      if (raw === null) {
        return null;
      }
      try {
        console.log(`Redis HIT: ${key}`);
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    } catch (err) {
      CacheHelper.logRedisError("getJSON", err);
      return null;
    }
  }

  static async setJSON(
    key: string,
    value: unknown,
    ttlSeconds: number
  ): Promise<void> {
    if (ttlSeconds <= 0) {
      return;
    }
    try {
      await getRedis().set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (err) {
      CacheHelper.logRedisError("setJSON", err);
    }
  }

  static async delKeys(...keys: string[]): Promise<void> {
    const filtered = keys.filter(Boolean);
    if (filtered.length === 0) {
      return;
    }
    try {
      await getRedis().del(...filtered);
    } catch (err) {
      CacheHelper.logRedisError("del", err);
    }
  }

  static async get(key: string): Promise<string | null> {
    try {
      return await getRedis().get(key);
    } catch (err) {
      CacheHelper.logRedisError("get", err);
      return null;
    }
  }

  static async set(
    key: string,
    value: string,
    ttlSeconds: number
  ): Promise<void> {
    if (ttlSeconds <= 0) {
      return;
    }
    try {
      await getRedis().set(key, value, "EX", ttlSeconds);
    } catch (err) {
      CacheHelper.logRedisError("set", err);
    }
  }

  /**
   * INCR. Returns null if Redis fails (caller may skip rate-limit / version bump).
   * posts:list:version is the only key allowed without EXPIRE.
   */
  static async incr(key: string): Promise<number | null> {
    try {
      return await getRedis().incr(key);
    } catch (err) {
      CacheHelper.logRedisError("incr", err);
      return null;
    }
  }

  static async expire(key: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) {
      return;
    }
    try {
      await getRedis().expire(key, ttlSeconds);
    } catch (err) {
      CacheHelper.logRedisError("expire", err);
    }
  }

  static async ttl(key: string): Promise<number> {
    try {
      return await getRedis().ttl(key);
    } catch (err) {
      CacheHelper.logRedisError("ttl", err);
      return -1;
    }
  }

  static async sadd(key: string, member: string): Promise<void> {
    try {
      await getRedis().sadd(key, member);
    } catch (err) {
      CacheHelper.logRedisError("sadd", err);
    }
  }

  /**
   * SADD then ensure the Set has a TTL (required — only list:version may omit expiry).
   * Extends TTL if the new value is longer than the remaining TTL.
   */
  static async saddWithExpire(
    key: string,
    member: string,
    ttlSeconds: number
  ): Promise<void> {
    try {
      await getRedis().sadd(key, member);
      const currentTtl = await getRedis().ttl(key);
      if (currentTtl < 0 || ttlSeconds > currentTtl) {
        await getRedis().expire(key, Math.max(1, ttlSeconds));
      }
    } catch (err) {
      CacheHelper.logRedisError("saddWithExpire", err);
    }
  }

  static async srem(key: string, member: string): Promise<void> {
    try {
      await getRedis().srem(key, member);
    } catch (err) {
      CacheHelper.logRedisError("srem", err);
    }
  }

  static async smembers(key: string): Promise<string[]> {
    try {
      return await getRedis().smembers(key);
    } catch (err) {
      CacheHelper.logRedisError("smembers", err);
      return [];
    }
  }
}

export type CacheStatus = "HIT" | "MISS";
