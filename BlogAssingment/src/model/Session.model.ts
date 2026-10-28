import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * TypeScript shape of a Session document.
 * One session = one login on one browser/device.
 */
export interface ISession extends Document {
  userId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// sessions: unique index on token
sessionSchema.index({ token: 1 }, { unique: true });

// sessions: TTL index on expiresAt (MongoDB auto-deletes expired sessions)
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model<ISession>("Session", sessionSchema);

export default Session;
