import {
  PostRepository,
  CreatePostData,
  UpdatePostData,
  ListPostsQuery,
  ListPostsResult,
} from "../../Repository/Post.repository";
import { CommentRepository } from "../../Repository/Comment.repository";
import { AppError } from "../../utils/AppError";
import { isValidObjectId } from "../../utils/objectId";
import { IPost, PostStatus } from "../../model/Post.model";

export type CreatePostInput = {
  title: string;
  body: string;
  tags?: string[];
  status?: PostStatus;
};

/**
 * Post business logic.
 */
export const PostService = {
  async createPost(
    input: CreatePostInput,
    authorId: string,
    authorName: string
  ): Promise<IPost> {
    if (input.tags && input.tags.length > 5) {
      throw new AppError("A post can have at most 5 tags", 400);
    }

    if (input.status && input.status !== "draft" && input.status !== "published") {
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

    return PostRepository.create(data);
  },

  /** Public: one published post */
  async getPublishedPostById(id: string): Promise<IPost> {
    if (!isValidObjectId(id)) {
      throw new AppError("Invalid id format", 400);
    }

    const post = await PostRepository.findById(id);

    if (!post || post.status !== "published") {
      throw new AppError("Post not found", 404);
    }

    return post;
  },

  async updatePost(
    id: string,
    userId: string,
    data: UpdatePostData
  ): Promise<IPost> {
    if (!isValidObjectId(id)) {
      throw new AppError("Invalid id format", 400);
    }

    const post = await PostRepository.findById(id);

    if (!post) {
      throw new AppError("Post not found", 404);
    }

    // Only the author can update
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

    const updated = await PostRepository.updateById(id, data);

    if (!updated) {
      throw new AppError("Post not found", 404);
    }

    return updated;
  },

  async deletePost(id: string, userId: string): Promise<void> {
    if (!isValidObjectId(id)) {
      throw new AppError("Invalid id format", 400);
    }

    const post = await PostRepository.findById(id);

    if (!post) {
      throw new AppError("Post not found", 404);
    }

    // Only the author can delete
    if (String(post.author) !== userId) {
      throw new AppError("You are not allowed to delete this post", 403);
    }

    // Delete all comments of this post, then the post itself
    await CommentRepository.deleteByPostId(id);
    await PostRepository.deleteById(id);
  },

  async getMyPosts(userId: string): Promise<IPost[]> {
    return PostRepository.findByAuthor(userId);
  },

  async listPublishedPosts(query: ListPostsQuery): Promise<ListPostsResult> {
    return PostRepository.listPublished(query);
  },
};
