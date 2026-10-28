import { Request, Response, NextFunction } from "express";
import { CommentService } from "./comment.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AppError } from "../../utils/AppError";

const parseLimit = (req: Request): number => {
  let limit = Number(req.query.limit) || 10;
  if (limit < 1) {
    limit = 10;
  }
  if (limit > 50) {
    limit = 50;
  }
  return limit;
};

export const CommentController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      const { text } = req.body;
      const comment = await CommentService.createComment(
        req.params.id,
        String(req.user._id),
        req.user.name,
        text
      );

      res
        .status(201)
        .json(ApiResponse.success("Comment created successfully", comment, 201));
    } catch (error) {
      next(error);
    }
  },

  /**
   * List comments.
   *
   * Page mode (default): ?page=1&limit=10
   * Cursor mode (bonus):  ?after=<lastCommentId>&limit=10
   *   - First cursor page: ?mode=cursor&limit=10  (or ?after= with empty value)
   */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseLimit(req);
      const hasAfterKey = Object.prototype.hasOwnProperty.call(req.query, "after");
      const useCursor = hasAfterKey || req.query.mode === "cursor";

      if (useCursor) {
        const afterRaw =
          typeof req.query.after === "string" ? req.query.after.trim() : "";
        const after = afterRaw.length > 0 ? afterRaw : undefined;

        const { data, nextCursor, hasMore } =
          await CommentService.listCommentsCursor(req.params.id, limit, after);

        res.status(200).json({
          success: true,
          data,
          pagination: {
            limit,
            nextCursor,
            hasMore,
          },
        });
        return;
      }

      // Page-based (Part 4 format)
      const page = Math.max(1, Number(req.query.page) || 1);
      const { data, total } = await CommentService.listCommentsPage(
        req.params.id,
        page,
        limit
      );
      const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      await CommentService.deleteComment(req.params.id, String(req.user._id));

      res
        .status(200)
        .json(ApiResponse.success("Comment deleted successfully"));
    } catch (error) {
      next(error);
    }
  },
};
