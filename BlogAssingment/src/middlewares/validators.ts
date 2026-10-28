import { z } from "zod";

/**
 * Zod schemas — validate request bodies before we touch the database.
 * (Uses Zod v4 API)
 */

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot be longer than 50 characters"),
  email: z
    .email("Email must be a valid email address")
    .transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z
    .email("Email must be a valid email address")
    .transform((value) => value.toLowerCase().trim()),
  password: z.string().min(1, "Password is required"),
});

export const updateNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot be longer than 50 characters"),
});

export const createPostSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(120, "Title cannot be longer than 120 characters"),
  body: z.string().trim().min(20, "Body must be at least 20 characters"),
  tags: z
    .array(z.string().trim().min(1))
    .max(5, "A post can have at most 5 tags")
    .optional()
    .default([]),
  status: z.enum(["draft", "published"]).optional().default("draft"),
});

export const updatePostSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "Title must be at least 5 characters")
      .max(120, "Title cannot be longer than 120 characters")
      .optional(),
    body: z
      .string()
      .trim()
      .min(20, "Body must be at least 20 characters")
      .optional(),
    tags: z
      .array(z.string().trim().min(1))
      .max(5, "A post can have at most 5 tags")
      .optional(),
    status: z.enum(["draft", "published"]).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.body !== undefined ||
      data.tags !== undefined ||
      data.status !== undefined,
    { message: "Please provide at least one field to update" }
  );

export const createCommentSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Comment text must be at least 1 character")
    .max(500, "Comment text cannot be longer than 500 characters"),
});
