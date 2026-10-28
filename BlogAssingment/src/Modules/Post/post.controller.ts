import { Request, Response, NextFunction } from "express";
import { postService } from "./post.service";
import { ApiResponse } from "../../utils/ApiResponse";
import { AppError } from "../../utils/AppError";

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

export class PostController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      const { title, body, tags, status } = req.body;

      const post = await postService.createPost(
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
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { data, cache } = await postService.getPublishedPostById(
        req.params.id
      );

      res.setHeader("X-Cache", cache);
      res
        .status(200)
        .json(ApiResponse.success("Post fetched successfully", data));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      const { title, body, tags, status } = req.body;

      const post = await postService.updatePost(
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
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      await postService.deletePost(req.params.id, String(req.user._id));

      res.status(200).json(ApiResponse.success("Post deleted successfully"));
    } catch (error) {
      next(error);
    }
  }

  async getMyPosts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", 401);
      }

      const posts = await postService.getMyPosts(String(req.user._id));

      res
        .status(200)
        .json(ApiResponse.success("Your posts fetched successfully", posts));
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = parseListQuery(req);
      const { data, total, cache } =
        await postService.listPublishedPosts(query);
      const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

      res.setHeader("X-Cache", cache);
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
  }
}

export const postController = new PostController();
