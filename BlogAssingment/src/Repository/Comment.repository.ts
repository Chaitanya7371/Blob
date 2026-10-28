import Comment, { IComment } from "../model/Comment.model";
import { Types } from "mongoose";

export type CreateCommentData = {
  postId: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  userName: string;
  text: string;
};

export type ListCommentsQuery = {
  postId: string;
  page: number;
  limit: number;
};

export type ListCommentsResult = {
  data: IComment[];
  total: number;
};

export type CursorListResult = {
  data: IComment[];
  nextCursor: string | null;
  hasMore: boolean;
};

export const CommentRepository = {
  async create(data: CreateCommentData): Promise<IComment> {
    return Comment.create(data);
  },

  async findById(id: string): Promise<IComment | null> {
    return Comment.findById(id);
  },

  async deleteById(id: string): Promise<IComment | null> {
    return Comment.findByIdAndDelete(id);
  },

  async deleteByPostId(postId: string): Promise<void> {
    await Comment.deleteMany({ postId });
  },

  /**
   * Page-based list (Part 4). Newest first. Uses $facet.
   */
  async listByPostId(query: ListCommentsQuery): Promise<ListCommentsResult> {
    const { postId, page, limit } = query;
    const skip = (page - 1) * limit;

    const result = await Comment.aggregate([
      { $match: { postId: new Types.ObjectId(postId) } },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1, _id: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const facet = result[0] as {
      data: IComment[];
      totalCount: Array<{ count: number }>;
    };

    return {
      data: facet.data,
      total: facet.totalCount[0]?.count ?? 0,
    };
  },

  /**
   * Cursor-based list (Part 7 bonus).
   * Pass after=<lastCommentId> to get the next page (older comments).
   * Newest first.
   */
  async listByPostIdCursor(
    postId: string,
    limit: number,
    afterCommentId?: string
  ): Promise<CursorListResult> {
    const match: Record<string, unknown> = {
      postId: new Types.ObjectId(postId),
    };

    if (afterCommentId) {
      const cursorComment = await Comment.findById(afterCommentId);

      if (!cursorComment) {
        return { data: [], nextCursor: null, hasMore: false };
      }

      // Comments older than the cursor (because we sort newest → oldest)
      match.$or = [
        { createdAt: { $lt: cursorComment.createdAt } },
        {
          createdAt: cursorComment.createdAt,
          _id: { $lt: cursorComment._id },
        },
      ];
    }

    // Fetch one extra row to know if there is a next page
    const rows = await Comment.find(match)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const last = data[data.length - 1];
    const nextCursor = hasMore && last ? String(last._id) : null;

    return { data, nextCursor, hasMore };
  },
};
