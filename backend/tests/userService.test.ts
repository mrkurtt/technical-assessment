import { User, UserModel } from "../src/models/user.model";
import { UserService } from "../src/services/user.services";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Mock the bcrypt and jwt modules
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

// Mock the UserModel
jest.mock("../src/models/user.model", () => ({
  UserModel: {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  User: {},
}));

describe("UserService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    it("should register a new user with hashed password", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      const hashedPassword = "hashedpassword123";
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce(hashedPassword);

      (UserModel.findByEmail as jest.Mock).mockResolvedValueOnce(null);

      const createdUser = {
        id: 1,
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date(),
      };
      (UserModel.create as jest.Mock).mockResolvedValueOnce(createdUser);

      const result = await UserService.registerUser(userData);

      expect(UserModel.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(UserModel.create).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword,
      });

      expect(result).not.toHaveProperty("password");
      expect(result).toEqual(
        expect.objectContaining({
          id: createdUser.id,
          username: createdUser.username,
          email: createdUser.email,
        })
      );
    });

    it("should throw error if user with email already exists", async () => {
      const userData = {
        username: "testuser",
        email: "existing@example.com",
        password: "password123",
      };

      const existingUser = {
        id: 1,
        username: "existinguser",
        email: userData.email,
        password: "hashedpassword",
        created_at: new Date(),
        updated_at: new Date(),
      };
      (UserModel.findByEmail as jest.Mock).mockResolvedValueOnce(existingUser);

      await expect(UserService.registerUser(userData)).rejects.toThrow(
        "User with this email already exists"
      );

      expect(UserModel.create).not.toHaveBeenCalled();
    });

    it("should handle database errors during registration", async () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      (UserModel.findByEmail as jest.Mock).mockResolvedValueOnce(null);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce("hashedpassword");
      (UserModel.create as jest.Mock).mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(UserService.registerUser(userData)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("authenticateUser", () => {
    it("should authenticate user and return token", async () => {
      const email = "test@example.com";
      const password = "password123";

      const mockUser = {
        id: 1,
        username: "testuser",
        email,
        password: "hashedpassword",
        created_at: new Date(),
        updated_at: new Date(),
      };
      (UserModel.findByEmail as jest.Mock).mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const mockToken = "jwt-token";
      (jwt.sign as jest.Mock).mockReturnValueOnce(mockToken);

      const result = await UserService.authenticateUser(email, password);

      expect(UserModel.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, email: mockUser.email },
        expect.any(String),
        { expiresIn: expect.any(String) }
      );

      expect(result).toEqual({
        user: expect.objectContaining({
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        }),
        token: mockToken,
      });
      expect(result.user).not.toHaveProperty("password");
    });

    it("should throw error for non-existent user", async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        UserService.authenticateUser("nonexistent@example.com", "password")
      ).rejects.toThrow("Invalid credentials");

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it("should throw error for incorrect password", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword",
        created_at: new Date(),
        updated_at: new Date(),
      };
      (UserModel.findByEmail as jest.Mock).mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        UserService.authenticateUser("test@example.com", "wrongpassword")
      ).rejects.toThrow("Invalid credentials");

      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it("should handle database errors during authentication", async () => {
      (UserModel.findByEmail as jest.Mock).mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(
        UserService.authenticateUser("test@example.com", "password")
      ).rejects.toThrow("Database error");
    });

    it("should handle bcrypt comparison errors", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword",
        created_at: new Date(),
        updated_at: new Date(),
      };
      (UserModel.findByEmail as jest.Mock).mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockRejectedValueOnce(
        new Error("Bcrypt error")
      );

      await expect(
        UserService.authenticateUser("test@example.com", "password")
      ).rejects.toThrow("Bcrypt error");
    });
  });

  describe("getUserById", () => {
    it("should return user without password", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword",
        created_at: new Date(),
        updated_at: new Date(),
      };
      (UserModel.findById as jest.Mock).mockResolvedValueOnce(mockUser);

      const result = await UserService.getUserById(1);

      expect(UserModel.findById).toHaveBeenCalledWith(1);
      expect(result).not.toHaveProperty("password");
      expect(result).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        })
      );
    });

    it("should return null if user not found", async () => {
      (UserModel.findById as jest.Mock).mockResolvedValueOnce(null);

      const result = await UserService.getUserById(999);

      expect(UserModel.findById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });

    it("should handle database errors when fetching user", async () => {
      (UserModel.findById as jest.Mock).mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(UserService.getUserById(1)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("getAllUsers", () => {
    it("should return all users without passwords", async () => {
      const mockUsers = [
        {
          id: 1,
          username: "user1",
          email: "user1@example.com",
          password: "hashedpassword1",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          username: "user2",
          email: "user2@example.com",
          password: "hashedpassword2",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      (UserModel.findAll as jest.Mock).mockResolvedValueOnce(mockUsers);

      const result = await UserService.getAllUsers();

      expect(UserModel.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(2);

      result.forEach((user, index) => {
        expect(user).not.toHaveProperty("password");
        expect(user).toEqual(
          expect.objectContaining({
            id: mockUsers[index].id,
            username: mockUsers[index].username,
            email: mockUsers[index].email,
          })
        );
      });
    });

    it("should return empty array if no users found", async () => {
      (UserModel.findAll as jest.Mock).mockResolvedValueOnce([]);

      const result = await UserService.getAllUsers();

      expect(UserModel.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("should handle database errors when fetching all users", async () => {
      (UserModel.findAll as jest.Mock).mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(UserService.getAllUsers()).rejects.toThrow("Database error");
    });
  });

  describe("updateUser", () => {
    it("should update user and return without password", async () => {
      const userId = 1;
      const updateData = {
        username: "updateduser",
        email: "updated@example.com",
      };

      const mockUpdatedUser = {
        id: userId,
        username: updateData.username,
        email: updateData.email,
        password: "hashedpassword",
        created_at: new Date(),
        updated_at: new Date(),
      };
      (UserModel.update as jest.Mock).mockResolvedValueOnce(mockUpdatedUser);

      const result = await UserService.updateUser(userId, updateData);

      expect(UserModel.update).toHaveBeenCalledWith(userId, updateData);
      expect(result).not.toHaveProperty("password");
      expect(result).toEqual(
        expect.objectContaining({
          id: mockUpdatedUser.id,
          username: mockUpdatedUser.username,
          email: mockUpdatedUser.email,
        })
      );
    });

    it("should hash password if it is being updated", async () => {
      const userId = 1;
      const newPassword = "newpassword";
      const updateData = {
        password: newPassword,
      };

      const hashedPassword = "hashedpassword123";
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce(hashedPassword);

      const mockUpdatedUser = {
        id: userId,
        username: "existinguser",
        email: "existing@example.com",
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date(),
      };
      (UserModel.update as jest.Mock).mockResolvedValueOnce(mockUpdatedUser);

      const result = await UserService.updateUser(userId, updateData);

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(UserModel.update).toHaveBeenCalledWith(userId, {
        password: hashedPassword,
      });
      expect(result).not.toHaveProperty("password");
    });

    it("should update multiple fields correctly", async () => {
      const userId = 1;
      const newPassword = "newpassword";
      const updateData = {
        username: "updateduser",
        email: "updated@example.com",
        password: newPassword,
      };

      const hashedPassword = "hashedpassword123";
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce(hashedPassword);

      const mockUpdatedUser = {
        id: userId,
        username: updateData.username,
        email: updateData.email,
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date(),
      };
      (UserModel.update as jest.Mock).mockResolvedValueOnce(mockUpdatedUser);

      await UserService.updateUser(userId, updateData);

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(UserModel.update).toHaveBeenCalledWith(userId, {
        username: updateData.username,
        email: updateData.email,
        password: hashedPassword,
      });
    });

    it("should return null if user not found", async () => {
      const userId = 999;
      const updateData = { username: "newname" };

      (UserModel.update as jest.Mock).mockResolvedValueOnce(null);

      const result = await UserService.updateUser(userId, updateData);

      expect(UserModel.update).toHaveBeenCalledWith(userId, updateData);
      expect(result).toBeNull();
    });

    it("should handle database errors during update", async () => {
      const userId = 1;
      const updateData = { username: "newname" };

      (UserModel.update as jest.Mock).mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(UserService.updateUser(userId, updateData)).rejects.toThrow(
        "Database error"
      );
    });

    it("should handle bcrypt errors when updating password", async () => {
      const userId = 1;
      const updateData = { password: "newpassword" };

      (bcrypt.hash as jest.Mock).mockRejectedValueOnce(
        new Error("Bcrypt error")
      );

      await expect(UserService.updateUser(userId, updateData)).rejects.toThrow(
        "Bcrypt error"
      );
      expect(UserModel.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      const userId = 1;
      (UserModel.delete as jest.Mock).mockResolvedValueOnce(true);

      const result = await UserService.deleteUser(userId);

      expect(UserModel.delete).toHaveBeenCalledWith(userId);
      expect(result).toBe(true);
    });

    it("should return false if user not found", async () => {
      const userId = 999;
      (UserModel.delete as jest.Mock).mockResolvedValueOnce(false);

      const result = await UserService.deleteUser(userId);

      expect(UserModel.delete).toHaveBeenCalledWith(userId);
      expect(result).toBe(false);
    });

    it("should handle database errors during deletion", async () => {
      const userId = 1;
      (UserModel.delete as jest.Mock).mockRejectedValueOnce(
        new Error("Database error")
      );

      await expect(UserService.deleteUser(userId)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("Error handling", () => {
    it("should propagate errors from the database layer", async () => {
      (UserModel.findById as jest.Mock).mockRejectedValueOnce(
        new Error("Database connection error")
      );

      await expect(UserService.getUserById(1)).rejects.toThrow(
        "Database connection error"
      );
    });

    it("should handle invalid user data gracefully", async () => {
      const invalidUserData = {
        // Missing required fields
      };

      // @ts-ignore - Testing with invalid data
      await expect(UserService.registerUser(invalidUserData)).rejects.toThrow();
    });
  });

  describe("updateUser with edge cases", () => {
    it("should handle updateUser with undefined fields", async () => {
      const userId = 1;
      const updateData = {
        username: undefined,
        email: "updated@example.com",
        password: undefined,
      };

      const mockUpdatedUser = {
        id: userId,
        username: "existinguser",
        email: updateData.email as string,
        password: "hashedpassword",
        created_at: new Date(),
        updated_at: new Date(),
      };

      (UserModel.update as jest.Mock).mockResolvedValueOnce(mockUpdatedUser);

      const result = await UserService.updateUser(userId, updateData);

      // Should only pass the defined fields to update
      expect(UserModel.update).toHaveBeenCalledWith(userId, {
        email: "updated@example.com",
      });

      expect(result).not.toHaveProperty("password");
      expect(result).toEqual(
        expect.objectContaining({
          id: mockUpdatedUser.id,
          email: mockUpdatedUser.email,
        })
      );
    });
  });
});
