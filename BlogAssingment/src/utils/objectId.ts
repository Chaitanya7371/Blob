import mongoose from "mongoose";

/**
 * Check if a string is a valid MongoDB ObjectId.
 * Returns false for values like "abc" so we can send 400.
 */
export const isValidObjectId = (id: string): boolean => {
  return (
    mongoose.Types.ObjectId.isValid(id) &&
    String(new mongoose.Types.ObjectId(id)) === id
  );
};
