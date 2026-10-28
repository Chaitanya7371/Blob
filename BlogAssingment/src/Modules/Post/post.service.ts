import {
  postRepository,
  CreatePostData,
  UpdatePostData,
  ListPostsQuery,
  ListPostsResult,
} from "../../Repository/Post.repository";
import { commentRepository } from "../../Repository/Comment.repository";
import { AppError } from "../../utils/AppError";
import { ObjectIdHelper } from "../../utils/objectId";
import { CacheHelper, CacheStatus } from "../../utils/cache";
import { RedisKeys, RedisTtl } from "../../constants/redis";
import { PostCacheHelper } from "../../utils/postCache";
import { IPost, PostStatus } from "../../model/Post.model";

export type CreatePostInput = {
  title: string;
  body: string;
  tags?: string[];
  status?: PostStatus;
};

export type PostResult = {
  data: unknown;
  cache: CacheStatus;
};

export type ListPostsCachedResult = ListPostsResult & {
  cache: CacheStatus;
};

export class PostService {
  async createPost(
    input: CreatePostInput,
    authorId: string,
    authorName: string
  ): Promise<IPost> {
    if (input.tags && input.tags.length > 5) {
      throw new AppError("A post can have at most 5 tags", 400);
    }

    if (
      input.status &&
      input.status !== "draft" &&
      input.status !== "published"
    ) {
      throw new AppError('Status must be "draft" or "published"', 400);
    }

    const data: CreatePostData = {
      title: input.title,
      body: input.body,
      tags: input.tags,
      status: input.status,
      author: authorId,
      authorName,
    };

    // MongoDB first, then invalidate Redis
    const post = await postRepository.create(data);
    await PostCacheHelper.invalidate(String(post._id));
    return post;
  }

  /** Public: one published post (cache-aside). Body identical for HIT/MISS. */
  async getPublishedPostById(id: string): Promise<PostResult> {
    if (!ObjectIdHelper.isValid(id)) {
      throw new AppError("Invalid id format", 400);
    }

    const cacheKey = RedisKeys.post(id);
    const cached = await CacheHelper.getJSON<unknown>(cacheKey);
    if (cached) {
      return { data: cached, cache: "HIT" };
    }

    const post = await postRepository.findById(id);

    if (!post || post.status !== "published") {
      throw new AppError("Post not found", 404);
    }

    // Cache published posts only — never drafts or 404s
    const plain = post.toJSON();
    await CacheHelper.setJSON(cacheKey, plain, RedisTtl.POST_SECONDS);

    return { data: plain, cache: "MISS" };
  }

  async updatePost(
    id: string,
    userId: string,
    data: UpdatePostData
  ): Promise<IPost> {
    if (!ObjectIdHelper.isValid(id)) {
      throw new AppError("Invalid id format", 400);
    }

    const post = await postRepository.findById(id);

    if (!post) {
      throw new AppError("Post not found", 404);
    }

    if (String(post.author) !== userId) {
      throw new AppError("You are not allowed to update this post", 403);
    }

    if (data.tags && data.tags.length > 5) {
      throw new AppError("A post can have at most 5 tags", 400);
    }

    if (
      data.status !== undefined &&
      data.status !== "draft" &&
      data.status !== "published"
    ) {
      throw new AppError('Status must be "draft" or "published"', 400);
    }

    const updated = await postRepository.updateById(id, data);

    if (!updated) {
      throw new AppError("Post not found", 404);
    }

    // Mongo first, THEN delete related Redis keys
    await PostCacheHelper.invalidate(id);
    return updated;
  }

  async deletePost(id: string, userId: string): Promise<void> {
    if (!ObjectIdHelper.isValid(id)) {
      throw new AppError("Invalid id format", 400);
    }

    const post = await postRepository.findById(id);

    if (!post) {
      throw new AppError("Post not found", 404);
    }

    if (String(post.author) !== userId) {
      throw new AppError("You are not allowed to delete this post", 403);
    }

    await commentRepository.deleteByPostId(id);
    await postRepository.deleteById(id);
    await PostCacheHelper.invalidate(id);
  }

  /** Own posts including drafts — NOT cached */
  async getMyPosts(userId: string): Promise<IPost[]> {
    return postRepository.findByAuthor(userId);
  }

  /** Public list with versioned Redis cache (60s) */
  async listPublishedPosts(
    query: ListPostsQuery
  ): Promise<ListPostsCachedResult> {
    const cacheKey = await PostCacheHelper.buildPostsListKey(query);
    const cached = await CacheHelper.getJSON<ListPostsResult>(cacheKey);

    if (cached) {
      return { ...cached, cache: "HIT" };
    }

    const result = await postRepository.listPublished(query);
    await CacheHelper.setJSON(
      cacheKey,
      result,
      RedisTtl.POST_LIST_SECONDS
    );
    return { ...result, cache: "MISS" };
  }
}

export const postService = new PostService();
