import { CacheHelper } from "./cache";
import { RedisKeys, RedisTtl } from "../constants/redis";
import { ListPostsQuery } from "../Repository/Post.repository";

/**
 * Post / comments list cache invalidation and key builders.
 */
export class PostCacheHelper {
  /**
   * Invalidate single-post cache and bump list (+ comments) versions.
   */
  static async invalidate(postId?: string): Promise<void> {
    if (postId) {
      await CacheHelper.delKeys(RedisKeys.post(postId));
      await CacheHelper.incr(RedisKeys.commentsVersion(postId));
    }
    await CacheHelper.incr(RedisKeys.postsListVersion());
  }

  static async getListVersion(): Promise<number> {
    const raw = await CacheHelper.get(RedisKeys.postsListVersion());
    return raw ? Number(raw) : 0;
  }

  static async getCommentsVersion(postId: string): Promise<number> {
    const raw = await CacheHelper.get(RedisKeys.commentsVersion(postId));
    return raw ? Number(raw) : 0;
  }

  static normalizeListQuery(query: ListPostsQuery): {
    page: number;
    limit: number;
    search: string;
    tag: string;
    sort: string;
  } {
    return {
      page: query.page,
      limit: query.limit,
      search: (query.search ?? "").trim().toLowerCase(),
      tag: (query.tag ?? "").trim().toLowerCase(),
      sort: query.sort,
    };
  }

  static async buildPostsListKey(query: ListPostsQuery): Promise<string> {
    const version = await PostCacheHelper.getListVersion();
    const normalized = PostCacheHelper.normalizeListQuery(query);
    return RedisKeys.postsList({ version, ...normalized });
  }

  static async buildCommentsListKey(
    postId: string,
    limit: number
  ): Promise<string> {
    const version = await PostCacheHelper.getCommentsVersion(postId);
    return RedisKeys.commentsList(postId, version, limit);
  }
}

export const invalidatePostCaches = PostCacheHelper.invalidate;
export const getListVersion = PostCacheHelper.getListVersion;
export const getCommentsVersion = PostCacheHelper.getCommentsVersion;
export const normalizeListQuery = PostCacheHelper.normalizeListQuery;
export const buildPostsListCacheKey = PostCacheHelper.buildPostsListKey;
export const buildCommentsListCacheKey = PostCacheHelper.buildCommentsListKey;
export const REDIS_TTL = RedisTtl;
