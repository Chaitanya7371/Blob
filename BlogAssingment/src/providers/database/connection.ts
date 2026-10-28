import mongoose from "mongoose";
import { AppConfig } from "../../constants/config";
import { Messages } from "../../constants/messages";

/**
 * Connect to MongoDB Atlas using Mongoose.
 * Database name comes from the URI path (blog_chaitanya).
 */
export class DatabaseProvider {
  static async connect(): Promise<void> {
    if (!AppConfig.mongodbUri) {
      throw new Error(
        "MONGODB_URI is missing. Copy .env.example to .env and add your Atlas connection string."
      );
    }

    await mongoose.connect(AppConfig.mongodbUri);
    console.log(Messages.DB_CONNECTED);
    console.log(`Database: ${mongoose.connection.name}`);
  }
}

export const connectDatabase = DatabaseProvider.connect;
