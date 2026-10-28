# Blog Assignment API

Blog REST API with **Node.js + Express + TypeScript + MongoDB (Mongoose) + Redis (ioredis)**.

Controllers, services, and repositories are **class-based**. Redis caches sessions, profiles, posts, post lists, and stats, and rate-limits login — without changing endpoint paths or response bodies.

## Folder structure

```
Request → routes → middlewares → controller → service → repository → model → MongoDB
                                              ↘ Redis cache helpers (ioredis)
```

```
src/
  constants/            # Config, auth, messages, Redis keys + TTLs
  providers/database/   # MongoDB connection
  providers/redis/      # Shared ioredis client
  model/                # Mongoose schemas
  Repository/           # Class-based DB queries
  Modules/              # Class-based controllers + services
  routes/
  middlewares/          # Auth (Bearer), Zod validation, error handler
  utils/                # ApiResponse, AppError, cache helpers
  app.ts
  server.ts             # Connects Mongo + Redis, then listens
```

## Setup

1. Install packages:

```bash
npm install
```

2. Copy env and fill in values:

```bash
cp .env.example .env
```

```
PORT=3000
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/blog_chaitanya?retryWrites=true&w=majority
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=blog_chaitanya
NODE_ENV=development
```

3. Start Redis (Docker example):

```bash
docker run -d --name blog-redis -p 6379:6379 redis:7
```

4. Run:

```bash
npm run dev
```

The server starts only after **MongoDB and Redis** are connected.

## Auth (Bearer token)

Login returns a `token`. Send it on protected routes:

```
Authorization: Bearer <token>
```

```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex","email":"alex@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"password123"}'

# Profile (use token from login)
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Redis keys

All keys are prefixed with `blog_chaitanya:` (same as the MongoDB database name).

| Key name | Redis type | TTL | When it is set | When it is deleted |
|----------|------------|-----|----------------|--------------------|
| `session:<token>` | String | until `expiresAt` | login (also re-hydrated on auth miss) | logout, logout-all |
| `user:<userId>:sessions` | Set | until latest session `expiresAt` | login (SADD token) | logout (SREM), logout-all (DEL set) |
| `user:<userId>` | String (JSON) | 1 hour | GET `/users/me` cache miss | PATCH `/users/me` |
| `login:fail:<email>` | String (counter) | 15 minutes (set on first INCR) | failed login (INCR) | successful login |
| `post:<id>` | String (JSON) | 10 minutes | GET `/posts/:id` miss (published only) | PATCH/DELETE post, comment add/delete |
| `posts:list:version` | String (counter) | none (only key without expiry) | INCR on post/comment mutations | never (old list keys expire on their own) |
| `posts:list:v…:p…:l…:s…:t…:o…` | String (JSON) | 60 seconds | GET `/posts` cache miss | not deleted by hand; ignored after version INCR |
| `stats` | String (JSON) | 5 minutes | GET `/stats` cache miss | expires after TTL (not hand-updated) |

### Redis rules

- MongoDB is always written first; related Redis keys are then **deleted** (never patched by hand).
- Response bodies are identical for Redis HIT and MongoDB MISS.
- Cached GETs set header `X-Cache: HIT` or `X-Cache: MISS` on `/api/users/me`, `/api/posts`, `/api/posts/:id`, `/api/stats`.
- If Redis is down or a command fails: log the error and continue with MongoDB. Login rate limiting may be skipped.
- The `KEYS` command is never used.

### Why stats can be up to 5 minutes old

`GET /api/stats` runs a heavy `$facet` aggregation over published posts. Caching for 5 minutes means that work runs at most once every 5 minutes no matter how many clients hit the endpoint. Public dashboard numbers do not need second-level freshness; a short delay is a fair trade for lower DB load.

## Indexes

| Collection | Index |
|------------|--------|
| users | unique on `email` |
| sessions | unique on `token`; TTL on `expiresAt` |
| posts | on `tags`; compound `{ status: 1, createdAt: -1 }` |
| comments | compound `{ postId: 1, createdAt: -1 }` |

## API endpoints

Base URL: `http://localhost:3000/api`

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/health` | No | `{ status: "ok" }` |
| POST | `/auth/signup` | No | Create user (**201**) |
| POST | `/auth/login` | No | Login + session token (**200**) |
| POST | `/auth/logout` | Bearer | Logout current session |
| POST | `/auth/logout-all` | Bearer | Logout every device |
| GET | `/users/me` | Bearer | Current user profile |
| PATCH | `/users/me` | Bearer | Update name |
| GET | `/users/me/posts` | Bearer | My posts (incl. drafts) |
| GET | `/posts` | No | Published posts (paginated) |
| GET | `/posts/:id` | No | One published post |
| POST | `/posts` | Bearer | Create post (**201**) |
| PATCH | `/posts/:id` | Bearer | Update own post |
| DELETE | `/posts/:id` | Bearer | Delete own post (+ comments) |
| POST | `/posts/:id/comments` | Bearer | Add comment (**201**) |
| GET | `/posts/:id/comments` | No | List comments |
| DELETE | `/comments/:id` | Bearer | Delete comment |
| GET | `/stats` | No | Public stats (`$facet`) |

Errors always: `{ "success": false, "message": "..." }`  
Status codes: **200, 201, 400, 401, 403, 404, 409, 429, 500**.

## Scripts

| Script | What it does |
|--------|----------------|
| `npm run dev` | TypeScript + auto-restart |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run compiled `dist/server.js` |
