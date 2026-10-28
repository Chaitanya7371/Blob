/**
 * OpenAPI 3 specification for Swagger UI.
 * Keep this file updated when you add new endpoints.
 */
export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Blog Assignment API",
    version: "1.0.0",
    description:
      "Node.js + Express + TypeScript + MongoDB blog API with auth, posts, comments, and stats.",
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Local development",
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "token",
        description: "Session cookie set by POST /auth/login",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
        },
      },
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Post: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string" },
          body: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          author: { type: "string" },
          authorName: { type: "string" },
          status: { type: "string", enum: ["draft", "published"] },
          commentCount: { type: "number" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Comment: {
        type: "object",
        properties: {
          _id: { type: "string" },
          postId: { type: "string" },
          userId: { type: "string" },
          userName: { type: "string" },
          text: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", example: "ok" } },
                },
              },
            },
          },
        },
      },
    },
    "/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Create a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", minLength: 2, maxLength: 50 },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "User created" },
          "400": { description: "Validation error" },
          "409": { description: "Email already registered" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and create a session cookie",
        description:
          "After 5 failed attempts in 15 minutes the email is locked (429).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Logged in (sets cookie `token`)" },
          "401": { description: "Invalid email or password" },
          "429": { description: "Too many failed attempts" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout current session",
        responses: {
          "200": { description: "Logged out" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/auth/logout-all": {
      post: {
        tags: ["Auth"],
        summary: "Logout from every device (delete all sessions)",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "All sessions deleted" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get current user profile",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "Profile (no password)" },
          "401": { description: "Unauthorized" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update current user's name",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", minLength: 2, maxLength: 50 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/users/me/posts": {
      get: {
        tags: ["Users"],
        summary: "List my posts (including drafts)",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "List of posts" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/posts": {
      get: {
        tags: ["Posts"],
        summary: "List published posts (paginated)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10, maximum: 50 },
          },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "tag", in: "query", schema: { type: "string" } },
          {
            name: "sort",
            in: "query",
            schema: {
              type: "string",
              enum: ["newest", "oldest", "mostCommented"],
              default: "newest",
            },
          },
        ],
        responses: {
          "200": { description: "Paginated published posts (no body field)" },
        },
      },
      post: {
        tags: ["Posts"],
        summary: "Create a post",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "body"],
                properties: {
                  title: { type: "string", minLength: 5, maxLength: 120 },
                  body: { type: "string", minLength: 20 },
                  tags: {
                    type: "array",
                    maxItems: 5,
                    items: { type: "string" },
                  },
                  status: {
                    type: "string",
                    enum: ["draft", "published"],
                    default: "draft",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/posts/{id}": {
      get: {
        tags: ["Posts"],
        summary: "Get one published post",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Post" },
          "400": { description: "Invalid id" },
          "404": { description: "Not found" },
        },
      },
      patch: {
        tags: ["Posts"],
        summary: "Update own post",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  body: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  status: { type: "string", enum: ["draft", "published"] },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated" },
          "403": { description: "Not the author" },
          "404": { description: "Not found" },
        },
      },
      delete: {
        tags: ["Posts"],
        summary: "Delete own post (and its comments)",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Deleted" },
          "403": { description: "Not the author" },
          "404": { description: "Not found" },
        },
      },
    },
    "/posts/{id}/comments": {
      get: {
        tags: ["Comments"],
        summary: "List comments for a published post",
        description:
          "Page mode: `?page=1&limit=10`. Cursor mode: `?mode=cursor` or `?after=<lastCommentId>`.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 10, maximum: 50 },
          },
          {
            name: "after",
            in: "query",
            description: "Cursor = last comment id from previous page",
            schema: { type: "string" },
          },
          {
            name: "mode",
            in: "query",
            description: "Set to `cursor` for first cursor page",
            schema: { type: "string", enum: ["cursor"] },
          },
        ],
        responses: {
          "200": { description: "Comments with pagination" },
          "400": { description: "Invalid id" },
          "404": { description: "Post not found" },
        },
      },
      post: {
        tags: ["Comments"],
        summary: "Add a comment (published posts only)",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["text"],
                properties: {
                  text: { type: "string", minLength: 1, maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created (commentCount +1)" },
          "401": { description: "Unauthorized" },
          "404": { description: "Post not found" },
        },
      },
    },
    "/comments/{id}": {
      delete: {
        tags: ["Comments"],
        summary: "Delete a comment (comment author or post author)",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Deleted (commentCount -1)" },
          "403": { description: "Forbidden" },
          "404": { description: "Not found" },
        },
      },
    },
    "/stats": {
      get: {
        tags: ["Stats"],
        summary: "Public statistics (one $facet aggregation)",
        responses: {
          "200": {
            description:
              "totalPublishedPosts, topTags, topAuthors, topCommentedPosts",
          },
        },
      },
    },
  },
} as const;
