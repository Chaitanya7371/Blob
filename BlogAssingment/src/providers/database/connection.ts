import mongoose from "mongoose";
import config from "../../constants/config";
import { MESSAGES } from "../../constants/messages";

/**
 * Connect to MongoDB Atlas using Mongoose.
 * Call this once when the server starts.
 *
 * The database name comes from the URI path, e.g.:
 * ...mongodb.net/blog_yourname?...
 */
export const connectDatabase = async (): Promise<void> => {
  if (!config.mongodbUri) {
    throw new Error(
      "MONGODB_URI is missing. Copy .env.example to .env and add your Atlas connection string."
    );
  }

  await mongoose.connect(config.mongodbUri);
  console.log(MESSAGES.DB_CONNECTED);
  console.log(`Database: ${mongoose.connection.name}`);
};
