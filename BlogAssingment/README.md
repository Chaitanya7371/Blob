# Blog Assignment API

Beginner-friendly Blog API using **Node.js + Express + TypeScript + MongoDB (Mongoose)**.

## Folder structure (how data flows)

```
Request → routes → middlewares (auth + zod) → controller → service → repository → model → MongoDB
```

```
src/
  constants/           # Config + shared messages
  providers/database/  # MongoDB connection
  model/               # Mongoose schemas + indexes
  Repository/          # Database queries only
  Modules/             # Controller + service (Auth, User, Post, Comment, Stats)
  routes/              # URL → controller mapping
  middlewares/         # Auth, Zod validation, error handler
  utils/               # Helpers (ApiResponse, AppError, cookies)
  app.ts               # Express setup
  server.ts            # Start DB + listen on a port
```

## Setup

1. Install packages:

```bash
npm install
```

2. Create your `.env` file (copy from example):

```bash
cp .env.example .env
```

3. Put your **MongoDB Atlas** connection string in `.env`.
   Use database name `blog_<yourname>` (example: `blog_alex`):

```
PORT=3000
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/blog_yourname?retryWrites=true&w=majority
```

4. Run in development (auto-restart on file changes):

```bash
npm run dev
```

5. Build and run production:

```bash
npm run build
npm start
```

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
| POST | `/auth/login` | No | Login + session cookie (**200**) |
| POST | `/auth/logout` | Cookie | Logout current session |
| POST | `/auth/logout-all` | Cookie | Logout every device |
| GET | `/users/me` | Cookie | Current user profile |
| PATCH | `/users/me` | Cookie | Update name |
| GET | `/users/me/posts` | Cookie | My posts (incl. drafts) |
| GET | `/posts` | No | Published posts (paginated) |
| GET | `/posts/:id` | No | One published post |
| POST | `/posts` | Cookie | Create post (**201**) |
| PATCH | `/posts/:id` | Cookie | Update own post |
| DELETE | `/posts/:id` | Cookie | Delete own post (+ comments) |
| POST | `/posts/:id/comments` | Cookie | Add comment (**201**) |
| GET | `/posts/:id/comments` | No | List comments (page or cursor) |
| DELETE | `/comments/:id` | Cookie | Delete comment |
| GET | `/stats` | No | Public stats (`$facet`) |
| GET | `/docs` | No | **Swagger UI** |

Status codes used: **200, 201, 400, 401, 403, 404, 409, 429, 500**.  
Errors never include password or stack traces.

### Bonus notes
- **Logout all:** `POST /api/auth/logout-all` (must be logged in)
- **Cursor comments:** `GET /api/posts/:id/comments?mode=cursor&limit=10` then `?after=<nextCursor>`
- **Login lock:** 5 failed attempts / 15 minutes → **429**
- **Swagger:** open [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### Auth example (signup → login → me)

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex","email":"alex@example.com","password":"password123"}'

curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"password123"}'

curl -b cookies.txt http://localhost:3000/api/users/me
```

## Scripts

| Script | What it does |
|--------|----------------|
| `npm run dev` | Run with TypeScript + auto-restart |
| `npm run build` | Compile TypeScript → JavaScript (`dist/`) |
| `npm start` | Run the compiled code from `dist/` |
