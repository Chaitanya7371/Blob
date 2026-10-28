/**
 * Reusable response messages used across the app.
 */
export const MESSAGES = {
  SERVER_RUNNING: "Server is running",
  DB_CONNECTED: "MongoDB connected successfully",
  DB_CONNECTION_ERROR: "MongoDB connection failed",
  NOT_FOUND: "Resource not found",
  VALIDATION_ERROR: "Validation error",
  INTERNAL_ERROR: "Something went wrong",
  BLOG_CREATED: "Blog created successfully",
  BLOG_UPDATED: "Blog updated successfully",
  BLOG_DELETED: "Blog deleted successfully",
  BLOG_FETCHED: "Blog fetched successfully",
  BLOGS_FETCHED: "Blogs fetched successfully",
  BLOG_NOT_FOUND: "Blog not found",
  INVALID_LOGIN: "Invalid email or password",
  EMAIL_EXISTS: "Email is already registered",
  UNAUTHORIZED: "Unauthorized",
} as const;
