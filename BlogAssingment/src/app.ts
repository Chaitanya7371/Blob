import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { MESSAGES } from "./constants/messages";
import { openApiSpec } from "./docs/openapi";

/**
 * Create and configure the Express app.
 * This file does NOT start listening — server.ts does that.
 */
const app: Application = express();

// Allow front-end apps to send cookies (credentials)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Parse JSON bodies
app.use(express.json());

// Parse cookies so we can read req.cookies.token
app.use(cookieParser());

// Swagger UI docs — open http://localhost:3000/api/docs
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: "Blog API Docs",
  })
);

// Simple root check
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: MESSAGES.SERVER_RUNNING,
    docs: "/api/docs",
  });
});

// All API routes start with /api
app.use("/api", routes);

// Catch-all for unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: MESSAGES.NOT_FOUND,
  });
});

// Error middleware must be last
app.use(errorHandler);

export default app;
