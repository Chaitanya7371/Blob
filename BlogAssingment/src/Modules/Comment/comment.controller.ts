import { Request, Response, NextFunction } from "express";
import { commentService } from "./comment.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AppError } from "../../utils/AppError";

export class CommentController {
  private parseLimit(req: Request): number {
    let limit = Number(req.query.limit) || 10;
    if (limit < 1) {
      limit = 10;
    }
    if (limit > 50) {
      limit = 50;
    }
    return limit;
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      const { text } = req.body;
      const comment = await commentService.createComment(
        req.params.id,
        String(req.user._id),
        req.user.name,
        text
      );

      res
        .status(201)
        .json(
          ApiResponse.success("Comment created successfully", comment, 201)
        );
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = this.parseLimit(req);
      const hasAfterKey = Object.prototype.hasOwnProperty.call(
        req.query,
        "after"
      );
      const useCursor = hasAfterKey || req.query.mode === "cursor";

      if (useCursor) {
        const afterRaw =
          typeof req.query.after === "string" ? req.query.after.trim() : "";
        const after = afterRaw.length > 0 ? afterRaw : undefined;

        const { data, nextCursor, hasMore } =
          await commentService.listCommentsCursor(req.params.id, limit, after);

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

      const page = Math.max(1, Number(req.query.page) || 1);
      const { data, total, cache } = await commentService.listCommentsPage(
        req.params.id,
        page,
        limit
      );
      const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

      if (page === 1) {
        res.setHeader("X-Cache", cache);
      }

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
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      await commentService.deleteComment(req.params.id, String(req.user._id));

      res
        .status(200)
        .json(ApiResponse.success("Comment deleted successfully"));
    } catch (error) {
      next(error);
    }
  }
}

export const commentController = new CommentController();
