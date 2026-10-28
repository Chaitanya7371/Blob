import User, { IUser } from "../model/User.model";

export type CreateUserData = {
  name: string;
  email: string;
  password: string;
};

export class UserRepository {
  /** Create a new user (password hashed by User model pre-save hook) */
  async create(data: CreateUserData): Promise<IUser> {
    const user = await User.create(data);
    return user;
  }

  /** Find by email (signup duplicate check) */
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase().trim() });
  }

  /**
   * Find by email AND include the password field.
   * Needed for login (password has select: false by default).
   */
  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase().trim() }).select(
      "+password"
    );
  }

  /** Find user by id (no password) */
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  /** Update only the user's name */
  async updateName(id: string, name: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );
  }
}

export const userRepository = new UserRepository();
