import {
  User,
  CreateUserInput,
  UpdateUserInput,
  UserModel,
} from "../models/user.model";
import { hash, compare } from "bcrypt";
import jwt from "jsonwebtoken";

export class UserService {
  // Register a new user
  static async registerUser(userData: CreateUserInput): Promise<User> {
    try {
      // Check if user with this email already exists
      const existingUser = await UserModel.findByEmail(userData.email);
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await hash(userData.password, saltRounds);

      // Create user with hashed password
      const user = await UserModel.create({
        ...userData,
        password: hashedPassword,
      });

      // Remove password from returned object
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      throw error;
    }
  }

  // Authenticate user (login)
  static async authenticateUser(
    email: string,
    password: string
  ): Promise<{ user: Omit<User, "password">; token: string }> {
    try {
      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        throw new Error("Invalid credentials");
      }

      // Compare passwords
      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error("Invalid credentials");
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || "aB3k9XmP0rTfV6QdZyJwNeLs1UhC7GxY",
        { expiresIn: "24h" }
      );

      // Remove password from returned object
      const { password: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword as User,
        token,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(id: number): Promise<Omit<User, "password"> | null> {
    try {
      const user = await UserModel.findById(id);

      if (!user) {
        return null;
      }

      // Remove password from returned object
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as Omit<User, "password">;
    } catch (error) {
      throw error;
    }
  }

  // Get all users
  static async getAllUsers(): Promise<Omit<User, "password">[]> {
    try {
      const users = await UserModel.findAll();

      // Remove passwords from all users
      return users.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword as Omit<User, "password">;
      });
    } catch (error) {
      throw error;
    }
  }

  // Update user
  static async updateUser(
    id: number,
    userData: UpdateUserInput
  ): Promise<Omit<User, "password"> | null> {
    try {
      // If password is being updated, hash it
      if (userData.password) {
        const saltRounds = 10;
        userData.password = await hash(userData.password, saltRounds);
      }

      const user = await UserModel.update(id, userData);

      if (!user) {
        return null;
      }

      // Remove password from returned object
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as Omit<User, "password">;
    } catch (error) {
      throw error;
    }
  }

  // Delete user
  static async deleteUser(id: number): Promise<boolean> {
    try {
      return await UserModel.delete(id);
    } catch (error) {
      throw error;
    }
  }
}
