import mongoose, { Document, Schema, Types } from "mongoose";

export type PostStatus = "draft" | "published";

/**
 * TypeScript shape of a Post document.
 */
export interface IPost extends Document {
  title: string;
  body: string;
  tags: string[];
  author: Types.ObjectId;
  authorName: string;
  status: PostStatus;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [120, "Title cannot be longer than 120 characters"],
    },
    body: {
      type: String,
      required: [true, "Body is required"],
      trim: true,
      minlength: [20, "Body must be at least 20 characters"],
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator(value: string[]) {
          return value.length <= 5;
        },
        message: "A post can have at most 5 tags",
      },
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Always store tags in lowercase before saving
postSchema.pre("save", function () {
  if (this.isModified("tags") && Array.isArray(this.tags)) {
    this.tags = this.tags
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);
  }
});

// posts: index on tags
postSchema.index({ tags: 1 });

// posts: compound index on { status, createdAt } — helps public list queries
postSchema.index({ status: 1, createdAt: -1 });

const Post = mongoose.model<IPost>("Post", postSchema);

export default Post;
