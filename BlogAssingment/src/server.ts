import app from "./app";
import config from "./constants/config";
import { connectDatabase } from "./providers/database/connection";
import { MESSAGES } from "./constants/messages";

/**
 * Entry point of the application.
 * Start HTTP first (so Swagger docs work), then connect MongoDB.
 */
const startServer = async (): Promise<void> => {
  app.listen(config.port, () => {
    console.log(`${MESSAGES.SERVER_RUNNING} on http://localhost:${config.port}`);
    console.log(`Swagger docs: http://localhost:${config.port}/api/docs`);
  });

  try {
    await connectDatabase();
  } catch (error) {
    console.error(MESSAGES.DB_CONNECTION_ERROR, error);
    console.error(
      "Fix MONGODB_URI in .env with your real Atlas connection string."
    );
    console.error("Swagger still works at /api/docs — DB routes will fail until connected.");
  }
};

startServer();
