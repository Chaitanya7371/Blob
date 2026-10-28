import dotenv from "dotenv";

dotenv.config();

/**
 * App config — secrets stay in .env, never hardcode them.
 */
export class AppConfig {
  static readonly port = Number(process.env.PORT) || 3000;
  static readonly mongodbUri = process.env.MONGODB_URI || "";
  static readonly redisUrl =
    process.env.REDIS_URL || "redis://localhost:6379";
  static readonly redisKeyPrefix =
    process.env.REDIS_KEY_PREFIX || "blog_chaitanya";
  static readonly nodeEnv = process.env.NODE_ENV || "development";
}

const config = {
  port: AppConfig.port,
  mongodbUri: AppConfig.mongodbUri,
  redisUrl: AppConfig.redisUrl,
  redisKeyPrefix: AppConfig.redisKeyPrefix,
  nodeEnv: AppConfig.nodeEnv,
};

export default config;
