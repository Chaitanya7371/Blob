import { UserRepository } from "../../Repository/User.repository";
import { AppError } from "../../utils/AppError";
import { IUser } from "../../model/User.model";

/**
 * User profile business logic.
 */
export const UserService = {
  async getProfile(userId: string): Promise<IUser> {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  },

  async updateName(userId: string, name: string): Promise<IUser> {
    if (!name || typeof name !== "string" || name.trim() === "") {
      throw new AppError("Name is required", 400);
    }

    const user = await UserRepository.updateName(userId, name.trim());

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  },
};
