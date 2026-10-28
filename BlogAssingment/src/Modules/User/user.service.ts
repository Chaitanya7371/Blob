import { userRepository } from "../../Repository/User.repository";
import { AppError } from "../../utils/AppError";
import { CacheHelper, CacheStatus } from "../../utils/cache";
import { RedisKeys, RedisTtl } from "../../constants/redis";

/** Plain profile shape — identical whether from Redis or MongoDB */
export type ProfileDto = {
  _id: string;
  name: string;
  email: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type ProfileResult = {
  data: ProfileDto;
  cache: CacheStatus;
};

/**
 * User profile business logic with Redis cache-aside.
 * Always write MongoDB first, then delete Redis keys (never patch cache by hand).
 */
export class UserService {
  async getProfile(userId: string): Promise<ProfileResult> {
    const cacheKey = RedisKeys.userProfile(userId);
    const cached = await CacheHelper.getJSON<ProfileDto>(cacheKey);

    if (cached) {
      return { data: cached, cache: "HIT" };
    }

    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const profile = this.toProfileDto(user);
    await CacheHelper.setJSON(cacheKey, profile, RedisTtl.PROFILE_SECONDS);

    return { data: profile, cache: "MISS" };
  }

  async updateName(userId: string, name: string): Promise<ProfileDto> {
    if (!name || typeof name !== "string" || name.trim() === "") {
      throw new AppError("Name is required", 400);
    }

    const user = await userRepository.updateName(userId, name.trim());

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Mongo first, THEN delete cache key
    await CacheHelper.delKeys(RedisKeys.userProfile(userId));

    return this.toProfileDto(user);
  }

  private toProfileDto(user: {
    _id: unknown;
    name: string;
    email: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): ProfileDto {
    return {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export const userService = new UserService();
