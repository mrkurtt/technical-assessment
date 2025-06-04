import { Request, Response } from "express";
import { UserService } from "../services/user.services";
import { CreateUserInput, UpdateUserInput } from "../models/user.model";

export class UserController {
  // Register a new user
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserInput = req.body;

      // Validate required fields
      if (!userData.username || !userData.email || !userData.password) {
        res
          .status(400)
          .json({ message: "Username, email, and password are required" });
        return;
      }

      const user = await UserService.registerUser(userData);
      res.status(201).json(user);
    } catch (error: any) {
      if (error.message === "User with this email already exists") {
        res.status(409).json({ message: error.message });
      } else {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  // Login user
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
      }

      const { user, token } = await UserService.authenticateUser(
        email,
        password
      );
      res.status(200).json({ user, token });
    } catch (error: any) {
      if (error.message === "Invalid credentials") {
        res.status(401).json({ message: "Invalid email or password" });
      } else {
        console.error("Error logging in:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  // Get user profile
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // The user ID would typically come from the authenticated JWT token
      // For simplicity, we're assuming it's available in req.params
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      const user = await UserService.getUserById(userId);

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      console.error("Error getting user profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get all users
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      console.error("Error getting all users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Update user
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      const userData: UpdateUserInput = req.body;

      if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      // Check if user exists
      const existingUser = await UserService.getUserById(userId);
      if (!existingUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const updatedUser = await UserService.updateUser(userId, userData);
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Delete user
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      // Check if user exists
      const existingUser = await UserService.getUserById(userId);
      if (!existingUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const deleted = await UserService.deleteUser(userId);

      if (deleted) {
        res.status(200).json({ message: "User deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete user" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
