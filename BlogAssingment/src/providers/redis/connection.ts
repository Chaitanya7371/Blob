import Redis from "ioredis";
import { AppConfig } from "../../constants/config";

/**
 * One shared ioredis connection for the whole app.
 * Listen for "error" so a Redis problem never crashes the process.
 */
export class RedisProvider {
  private static client: Redis | null = null;

  static async connect(): Promise<Redis> {
    if (RedisProvider.client) {
      return RedisProvider.client;
    }

    const client = new Redis(AppConfig.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    client.on("error", (err: Error) => {
      console.error("Redis error:", err.message);
    });

    await new Promise<void>((resolve, reject) => {
      if (client.status === "ready") {
        resolve();
        return;
      }
      const onReady = () => {
        cleanup();
        resolve();
      };
      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };
      const cleanup = () => {
        client.off("ready", onReady);
        client.off("error", onError);
      };
      client.once("ready", onReady);
      client.once("error", onError);
    });

    console.log("Redis connected");
    RedisProvider.client = client;
    return client;
  }

  static getClient(): Redis {
    if (!RedisProvider.client) {
      throw new Error(
        "Redis is not connected. Call RedisProvider.connect() at startup."
      );
    }
    return RedisProvider.client;
  }
}

export const connectRedis = RedisProvider.connect;
export const getRedis = RedisProvider.getClient;
