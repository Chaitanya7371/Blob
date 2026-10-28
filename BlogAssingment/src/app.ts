import express, { Application, Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { ApiRoutes } from "./routes";
import { ErrorHandler } from "./middlewares/errorHandler";
import { Messages } from "./constants/messages";
import { OpenApiDocs } from "./docs/openapi";

/**
 * Express application factory (class-based).
 */
export class App {
  readonly express: Application;

  constructor() {
    this.express = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.express.use(
      cors({
        origin: true,
        credentials: true,
      })
    );
    this.express.use(express.json());
    this.express.set("trust proxy", 1);

    this.express.use(
      "/api/docs",
      swaggerUi.serve,
      swaggerUi.setup(OpenApiDocs.spec, {
        customSiteTitle: "Blog API Docs",
      })
    );
  }

  private setupRoutes(): void {
    this.express.get("/", (_req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: Messages.SERVER_RUNNING,
        docs: "/api/docs",
      });
    });

    this.express.use("/api", ApiRoutes.create());
  }

  private setupErrorHandling(): void {
    this.express.use((_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: Messages.NOT_FOUND,
      });
    });

    this.express.use(ErrorHandler.handle);
  }
}

const app = new App().express;
export default app;
