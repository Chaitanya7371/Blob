import mongoose from "mongoose";

/**
 * Check if a string is a valid MongoDB ObjectId.
 */
export class ObjectIdHelper {
  static isValid(id: string): boolean {
    return (
      mongoose.Types.ObjectId.isValid(id) &&
      String(new mongoose.Types.ObjectId(id)) === id
    );
  }
}

export const isValidObjectId = ObjectIdHelper.isValid;
