import { CommentRepository } from "../../Repository/Comment.repository";
import { PostRepository } from "../../Repository/Post.repository";
import { AppError } from "../../utils/AppError";
import { isValidObjectId } from "../../utils/objectId";
import { IComment } from "../../model/Comment.model";

async function assertPublishedPost(postId: string): Promise<void> {
  if (!isValidObjectId(postId)) {
    throw new AppError("Invalid id format", 400);
  }

  const post = await PostRepository.findById(postId);

  if (!post || post.status !== "published") {
    throw new AppError("Post not found", 404);
  }
}

/**
 * Comment business logic.
 */
export const CommentService = {
  async createComment(
    postId: string,
    userId: string,
    userName: string,
    text: string
  ): Promise<IComment> {
    await assertPublishedPost(postId);

    if (!text || typeof text !== "string" || text.trim() === "") {
      throw new AppError("Comment text is required", 400);
    }

    if (text.trim().length > 500) {
      throw new AppError("Comment text cannot be longer than 500 characters", 400);
    }

    const comment = await CommentRepository.create({
      postId,
      userId,
      userName,
      text: text.trim(),
    });

    await PostRepository.incrementCommentCount(postId);

    return comment;
  },

  /** Page-based list (Part 4) */
  async listCommentsPage(
    postId: string,
    page: number,
    limit: number
  ): Promise<{ data: IComment[]; total: number }> {
    await assertPublishedPost(postId);
    return CommentRepository.listByPostId({ postId, page, limit });
  },

  /**
   * Cursor-based list (Part 7).
   * after = id of the last comment from the previous page (optional on first page).
   */
  async listCommentsCursor(
    postId: string,
    limit: number,
    after?: string
  ): Promise<{
    data: IComment[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    await assertPublishedPost(postId);

    if (after && !isValidObjectId(after)) {
      throw new AppError("Invalid after cursor id", 400);
    }

    return CommentRepository.listByPostIdCursor(postId, limit, after);
  },

  async deleteComment(commentId: string, userId: string): Promise<void> {
    if (!isValidObjectId(commentId)) {
      throw new AppError("Invalid id format", 400);
    }

    const comment = await CommentRepository.findById(commentId);

    if (!comment) {
      throw new AppError("Comment not found", 404);
    }

    const post = await PostRepository.findById(String(comment.postId));

    if (!post) {
      throw new AppError("Post not found", 404);
    }

    const isCommentAuthor = String(comment.userId) === userId;
    const isPostAuthor = String(post.author) === userId;

    if (!isCommentAuthor && !isPostAuthor) {
      throw new AppError("You are not allowed to delete this comment", 403);
    }

    await CommentRepository.deleteById(commentId);
    await PostRepository.decrementCommentCount(String(comment.postId));
  },
};
