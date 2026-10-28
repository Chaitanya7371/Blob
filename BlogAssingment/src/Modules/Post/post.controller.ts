import { Request, Response, NextFunction } from "express";
import { PostService } from "./post.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AppError } from "../../utils/AppError";

/**
 * Helper to parse list query params with safe defaults.
 */
const parseListQuery = (req: Request) => {
  const page = Math.max(1, Number(req.query.page) || 1);

  let limit = Number(req.query.limit) || 10;
  if (limit < 1) {
    limit = 10;
  }
  if (limit > 50) {
    limit = 50;
  }

  const search =
    typeof req.query.search === "string" ? req.query.search : undefined;
  const tag = typeof req.query.tag === "string" ? req.query.tag : undefined;

  const sortParam =
    typeof req.query.sort === "string" ? req.query.sort : "newest";
  const allowedSorts = ["newest", "oldest", "mostCommented"] as const;
  const sort = allowedSorts.includes(
    sortParam as (typeof allowedSorts)[number]
  )
    ? (sortParam as (typeof allowedSorts)[number])
    : "newest";

  return { page, limit, search, tag, sort };
};

export const PostController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      // Body already validated by Zod
      const { title, body, tags, status } = req.body;

      const post = await PostService.createPost(
        { title, body, tags, status },
        String(req.user._id),
        req.user.name
      );

      res
        .status(201)
        .json(ApiResponse.success("Post created successfully", post, 201));
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await PostService.getPublishedPostById(req.params.id);

      res
        .status(200)
        .json(ApiResponse.success("Post fetched successfully", post));
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      const { title, body, tags, status } = req.body;

      const post = await PostService.updatePost(
        req.params.id,
        String(req.user._id),
        { title, body, tags, status }
      );

      res
        .status(200)
        .json(ApiResponse.success("Post updated successfully", post));
    } catch (error) {
      next(error);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      await PostService.deletePost(req.params.id, String(req.user._id));

      res.status(200).json(ApiResponse.success("Post deleted successfully"));
    } catch (error) {
      next(error);
    }
  },

  async getMyPosts(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      const posts = await PostService.getMyPosts(String(req.user._id));

      res
        .status(200)
        .json(ApiResponse.success("Your posts fetched successfully", posts));
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = parseListQuery(req);
      const { data, total } = await PostService.listPublishedPosts(query);
      const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

      res.status(200).json({
        success: true,
        data,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
