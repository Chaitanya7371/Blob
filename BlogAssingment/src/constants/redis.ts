import { AppConfig } from "./config";
import { AuthConstants } from "./auth";

/**
 * Redis key builders and TTL values (seconds).
 * Never hard-code key strings inside services — use these helpers.
 */
export class RedisTtl {
  static readonly PROFILE_SECONDS = 60 * 60;
  static readonly POST_SECONDS = 10 * 60;
  static readonly POST_LIST_SECONDS = 60;
  static readonly COMMENTS_LIST_SECONDS = 60;
  static readonly STATS_SECONDS = 5 * 60;
  static readonly LOGIN_FAIL_SECONDS = 15 * 60;
  static readonly LOGIN_FAIL_MAX = 5;
  static readonly SESSION_SECONDS = Math.floor(AuthConstants.SESSION_MS / 1000);
}

export class RedisKeys {
  private static get prefix(): string {
    return AppConfig.redisKeyPrefix;
  }

  static session(token: string): string {
    return `${RedisKeys.prefix}:session:${token}`;
  }

  static userSessions(userId: string): string {
    return `${RedisKeys.prefix}:user:${userId}:sessions`;
  }

  static userProfile(userId: string): string {
    return `${RedisKeys.prefix}:user:${userId}`;
  }

  static loginFail(email: string): string {
    return `${RedisKeys.prefix}:login:fail:${email.toLowerCase().trim()}`;
  }

  static loginFailIp(ip: string): string {
    return `${RedisKeys.prefix}:login:fail:ip:${ip}`;
  }

  static post(id: string): string {
    return `${RedisKeys.prefix}:post:${id}`;
  }

  static postsListVersion(): string {
    return `${RedisKeys.prefix}:posts:list:version`;
  }

  static postsList(parts: {
    version: number;
    page: number;
    limit: number;
    search: string;
    tag: string;
    sort: string;
  }): string {
    return `${RedisKeys.prefix}:posts:list:v${parts.version}:p${parts.page}:l${parts.limit}:s${parts.search}:t${parts.tag}:o${parts.sort}`;
  }

  static commentsVersion(postId: string): string {
    return `${RedisKeys.prefix}:post:${postId}:comments:version`;
  }

  static commentsList(
    postId: string,
    version: number,
    limit: number
  ): string {
    return `${RedisKeys.prefix}:post:${postId}:comments:v${version}:l${limit}`;
  }

  static stats(): string {
    return `${RedisKeys.prefix}:stats`;
  }
}

/** Alias kept for existing imports */
export const REDIS_TTL = RedisTtl;
