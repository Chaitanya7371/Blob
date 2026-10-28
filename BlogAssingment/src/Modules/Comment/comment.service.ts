import { commentRepository } from "../../Repository/Comment.repository";
import { postRepository } from "../../Repository/Post.repository";
import { AppError } from "../../utils/AppError";
import { ObjectIdHelper } from "../../utils/objectId";
import { CacheHelper, CacheStatus } from "../../utils/cache";
import { RedisTtl } from "../../constants/redis";
import { PostCacheHelper } from "../../utils/postCache";
import { IComment } from "../../model/Comment.model";

type PageListPayload = {
  data: unknown[];
  total: number;
};

export type CommentsPageResult = PageListPayload & {
  cache: CacheStatus;
};

export class CommentService {
  private async assertPublishedPost(postId: string): Promise<void> {
    if (!ObjectIdHelper.isValid(postId)) {
      throw new AppError("Invalid id format", 400);
    }

    const post = await postRepository.findById(postId);

    if (!post || post.status !== "published") {
      throw new AppError("Post not found", 404);
    }
  }

  async createComment(
    postId: string,
    userId: string,
    userName: string,
    text: string
  ): Promise<IComment> {
    await this.assertPublishedPost(postId);

    if (!text || typeof text !== "string" || text.trim() === "") {
      throw new AppError("Comment text is required", 400);
    }

    if (text.trim().length > 500) {
      throw new AppError(
        "Comment text cannot be longer than 500 characters",
        400
      );
    }

    const comment = await commentRepository.create({
      postId,
      userId,
      userName,
      text: text.trim(),
    });

    await postRepository.incrementCommentCount(postId);
    await PostCacheHelper.invalidate(postId);

    return comment;
  }

  async listCommentsPage(
    postId: string,
    page: number,
    limit: number
  ): Promise<CommentsPageResult> {
    await this.assertPublishedPost(postId);

    const useCache = page === 1;
    if (useCache) {
      const cacheKey = await PostCacheHelper.buildCommentsListKey(postId, limit);
      const cached = await CacheHelper.getJSON<PageListPayload>(cacheKey);
      if (cached) {
        return { ...cached, cache: "HIT" };
      }
    }

    const result = await commentRepository.listByPostId({
      postId,
      page,
      limit,
    });

    if (useCache) {
      const cacheKey = await PostCacheHelper.buildCommentsListKey(postId, limit);
      await CacheHelper.setJSON(
        cacheKey,
        result,
        RedisTtl.COMMENTS_LIST_SECONDS
      );
    }

    return { ...result, cache: "MISS" };
  }

  async listCommentsCursor(
    postId: string,
    limit: number,
    after?: string
  ): Promise<{
    data: IComment[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    await this.assertPublishedPost(postId);

    if (after && !ObjectIdHelper.isValid(after)) {
      throw new AppError("Invalid after cursor id", 400);
    }

    return commentRepository.listByPostIdCursor(postId, limit, after);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    if (!ObjectIdHelper.isValid(commentId)) {
      throw new AppError("Invalid id format", 400);
    }

    const comment = await commentRepository.findById(commentId);

    if (!comment) {
      throw new AppError("Comment not found", 404);
    }

    const postId = String(comment.postId);
    const post = await postRepository.findById(postId);

    if (!post) {
      throw new AppError("Post not found", 404);
    }

    const isCommentAuthor = String(comment.userId) === userId;
    const isPostAuthor = String(post.author) === userId;

    if (!isCommentAuthor && !isPostAuthor) {
      throw new AppError("You are not allowed to delete this comment", 403);
    }

    await commentRepository.deleteById(commentId);
    await postRepository.decrementCommentCount(postId);
    await PostCacheHelper.invalidate(postId);
  }
}

export const commentService = new CommentService();
