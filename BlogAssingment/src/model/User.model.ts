import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

/**
 * TypeScript shape of a User document.
 */
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot be longer than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      // Never include password in queries unless we ask for it
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// users: unique index on email
userSchema.index({ email: 1 }, { unique: true });

/**
 * Before saving, hash the password with bcrypt (if it was changed).
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * When we convert a user to JSON (res.json), strip the password.
 */
userSchema.set("toJSON", {
  transform(_doc, ret) {
    const user = ret as unknown as Record<string, unknown>;
    delete user.password;
    return user;
  },
});

const User = mongoose.model<IUser>("User", userSchema);

export default User;
