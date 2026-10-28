/**
 * OpenAPI 3 spec for Swagger UI at /api/docs
 */
const openApiSpecData = {
  openapi: "3.0.3",
  info: {
    title: "Blog API",
    version: "1.0.0",
    description:
      "Node.js + Express + TypeScript + MongoDB + Redis blog API with auth, posts, comments, and stats.",
  },
  servers: [{ url: "/api", description: "API base" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "SessionToken",
        description: "Token returned by POST /auth/login",
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
        summary: "Login and create a session",
        description:
          "Returns a bearer token. After 5 failed attempts (per email or per IP) in 15 minutes → 429.",
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
          "200": { description: "Logged in (returns token)" },
          "401": { description: "Invalid email or password" },
          "429": { description: "Too many login attempts" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout current session",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Logged out" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/auth/logout-all": {
      post: {
        tags: ["Auth"],
        summary: "Logout all sessions (every device)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Logged out from all devices" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Current user profile",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Profile (no password). Header X-Cache HIT|MISS" },
          "401": { description: "Unauthorized" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update name only",
        security: [{ bearerAuth: [] }],
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
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/users/me/posts": {
      get: {
        tags: ["Users"],
        summary: "My posts including drafts (not cached)",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "List of own posts" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/posts": {
      get: {
        tags: ["Posts"],
        summary: "List published posts",
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
          "200": {
            description: "Paginated list (no body). Header X-Cache HIT|MISS",
          },
        },
      },
      post: {
        tags: ["Posts"],
        summary: "Create a post",
        security: [{ bearerAuth: [] }],
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
                    items: { type: "string" },
                    maxItems: 5,
                  },
                  status: { type: "string", enum: ["draft", "published"] },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
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
          "200": { description: "Post. Header X-Cache HIT|MISS" },
          "400": { description: "Invalid id" },
          "404": { description: "Not found" },
        },
      },
      patch: {
        tags: ["Posts"],
        summary: "Update own post",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Updated" },
          "403": { description: "Not the author" },
          "404": { description: "Not found" },
        },
      },
      delete: {
        tags: ["Posts"],
        summary: "Delete own post and its comments",
        security: [{ bearerAuth: [] }],
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
        summary: "List comments (page or cursor)",
        description:
          "Page: ?page=1&limit=10 (first page cached). Cursor: ?after=<lastCommentId>&limit=10",
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
            schema: { type: "string" },
            description: "Cursor: last comment id from previous page",
          },
          {
            name: "mode",
            in: "query",
            schema: { type: "string", enum: ["cursor"] },
          },
        ],
        responses: {
          "200": { description: "Comments list" },
          "404": { description: "Post not found" },
        },
      },
      post: {
        tags: ["Comments"],
        summary: "Add a comment (published posts only)",
        security: [{ bearerAuth: [] }],
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
          "201": { description: "Created" },
          "401": { description: "Unauthorized" },
          "404": { description: "Post not found" },
        },
      },
    },
    "/comments/{id}": {
      delete: {
        tags: ["Comments"],
        summary: "Delete a comment (comment author or post author)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Deleted" },
          "403": { description: "Forbidden" },
          "404": { description: "Not found" },
        },
      },
    },
    "/stats": {
      get: {
        tags: ["Stats"],
        summary: "Public statistics ($facet aggregation)",
        responses: {
          "200": { description: "Stats. Header X-Cache HIT|MISS" },
        },
      },
    },
  },
} as const;

export class OpenApiDocs {
  static readonly spec = openApiSpecData;
}

export const openApiSpec = OpenApiDocs.spec;
