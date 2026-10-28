import dotenv from "dotenv";

// Load variables from .env file into process.env
dotenv.config();

/**
 * App config — read from environment variables.
 * Keep secrets (like MongoDB URI) in .env, never hardcode them.
 */
const config = {
  // PORT and MONGODB_URI come from the .env file
  port: Number(process.env.PORT) || 3000,
  mongodbUri: process.env.MONGODB_URI || "",
  nodeEnv: process.env.NODE_ENV || "development",
};

export default config;
