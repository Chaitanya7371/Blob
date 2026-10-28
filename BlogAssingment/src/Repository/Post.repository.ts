import Post, { IPost, PostStatus } from "../model/Post.model";
import { Types } from "mongoose";

export type CreatePostData = {
  title: string;
  body: string;
  tags?: string[];
  author: Types.ObjectId | string;
  authorName: string;
  status?: PostStatus;
};

export type UpdatePostData = {
  title?: string;
  body?: string;
  tags?: string[];
  status?: PostStatus;
};

export type ListPostsQuery = {
  page: number;
  limit: number;
  search?: string;
  tag?: string;
  sort: "newest" | "oldest" | "mostCommented";
};

export type ListPostsResult = {
  data: IPost[];
  total: number;
};

/**
 * Normalize tags: trim, lowercase, max 5.
 */
const normalizeTags = (tags?: string[]): string[] | undefined => {
  if (tags === undefined) {
    return undefined;
  }

  return tags
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 5);
};

export const PostRepository = {
  async create(data: CreatePostData): Promise<IPost> {
    return Post.create({
      ...data,
      tags: normalizeTags(data.tags) ?? [],
    });
  },

  async findById(id: string): Promise<IPost | null> {
    return Post.findById(id);
  },

  async updateById(id: string, data: UpdatePostData): Promise<IPost | null> {
    const update: UpdatePostData = { ...data };

    if (data.tags !== undefined) {
      update.tags = normalizeTags(data.tags);
    }

    return Post.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
  },

  async deleteById(id: string): Promise<IPost | null> {
    return Post.findByIdAndDelete(id);
  },

  /** Increase commentCount by 1 when a comment is added */
  async incrementCommentCount(postId: string): Promise<void> {
    await Post.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });
  },

  /** Decrease commentCount by 1 when a comment is deleted */
  async decrementCommentCount(postId: string): Promise<void> {
    await Post.updateOne(
      { _id: postId, commentCount: { $gt: 0 } },
      { $inc: { commentCount: -1 } }
    );
  },

  /** All posts by one user (drafts + published) */
  async findByAuthor(authorId: string): Promise<IPost[]> {
    return Post.find({ author: authorId }).sort({ createdAt: -1 });
  },

  /**
   * Public list of PUBLISHED posts.
   * Uses $facet so we get the page of data AND the total count in ONE query.
   * Body is excluded via $project.
   */
  async listPublished(query: ListPostsQuery): Promise<ListPostsResult> {
    const { page, limit, search, tag, sort } = query;
    const skip = (page - 1) * limit;

    // Build the filter for published posts only
    const match: Record<string, unknown> = { status: "published" };

    if (search && search.trim() !== "") {
      match.title = { $regex: search.trim(), $options: "i" };
    }

    if (tag && tag.trim() !== "") {
      match.tags = tag.trim().toLowerCase();
    }

    // Sort rules
    let sortStage: Record<string, 1 | -1> = { createdAt: -1 }; // newest
    if (sort === "oldest") {
      sortStage = { createdAt: 1 };
    } else if (sort === "mostCommented") {
      sortStage = { commentCount: -1, createdAt: -1 };
    }

    const result = await Post.aggregate([
      { $match: match },
      {
        $facet: {
          data: [
            { $sort: sortStage },
            { $skip: skip },
            { $limit: limit },
            // Do NOT return the post body in the list
            {
              $project: {
                body: 0,
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const facet = result[0] as {
      data: IPost[];
      totalCount: Array<{ count: number }>;
    };

    const total = facet.totalCount[0]?.count ?? 0;

    return {
      data: facet.data,
      total,
    };
  },
};
