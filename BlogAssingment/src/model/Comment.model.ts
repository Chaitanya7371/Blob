import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * Comment is a SEPARATE collection (not embedded inside Post).
 */
export interface IComment extends Document {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      minlength: [1, "Comment text must be at least 1 character"],
      maxlength: [500, "Comment text cannot be longer than 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// comments: compound index on { postId, createdAt } — helps list-by-post (newest first)
commentSchema.index({ postId: 1, createdAt: -1 });

const Comment = mongoose.model<IComment>("Comment", commentSchema);

export default Comment;
