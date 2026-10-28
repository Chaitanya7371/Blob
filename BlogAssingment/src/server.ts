import app from "./app";
import { AppConfig } from "./constants/config";
import { DatabaseProvider } from "./providers/database/connection";
import { RedisProvider } from "./providers/redis/connection";
import { Messages } from "./constants/messages";

/**
 * Start HTTP only after MongoDB AND Redis are connected.
 */
export class Server {
  static async start(): Promise<void> {
    try {
      await DatabaseProvider.connect();
      await RedisProvider.connect();

      app.listen(AppConfig.port, () => {
        console.log(
          `${Messages.SERVER_RUNNING} on http://localhost:${AppConfig.port}`
        );
        console.log(
          `Swagger docs: http://localhost:${AppConfig.port}/api/docs`
        );
      });
    } catch (error) {
      console.error("Failed to start server:", error);
      process.exit(1);
    }
  }
}

Server.start();
