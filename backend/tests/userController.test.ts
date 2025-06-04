import { Request, Response } from "express";
import { UserController } from "../src/controllers/user.controller";
import { UserService } from "../src/services/user.services";

// Mock UserService
jest.mock("../src/services/user.services");

describe("UserController", () => {
  // Mock request and response
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn().mockReturnValue({});
    responseStatus = jest.fn().mockReturnThis();

    mockRequest = {
      body: {},
      params: {},
    };

    mockResponse = {
      json: responseJson,
      status: responseStatus,
    };

    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      // Setup
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      const mockUser = {
        id: 1,
        username: userData.username,
        email: userData.email,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest.body = userData;
      jest
        .spyOn(UserService, "registerUser")
        .mockResolvedValueOnce(mockUser as any);

      // Execute
      await UserController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.registerUser).toHaveBeenCalledWith(userData);
      expect(responseStatus).toHaveBeenCalledWith(201);
      expect(responseJson).toHaveBeenCalledWith(mockUser);
    });

    it("should return 400 if required fields are missing", async () => {
      // Setup - missing password
      mockRequest.body = {
        username: "testuser",
        email: "test@example.com",
      };

      // Execute
      await UserController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.registerUser).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        message: expect.stringContaining("required"),
      });
    });

    it("should return 409 if user already exists", async () => {
      // Setup
      mockRequest.body = {
        username: "testuser",
        email: "existing@example.com",
        password: "password123",
      };

      jest
        .spyOn(UserService, "registerUser")
        .mockRejectedValueOnce(
          new Error("User with this email already exists")
        );

      // Execute
      await UserController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.registerUser).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(409);
      expect(responseJson).toHaveBeenCalledWith({
        message: "User with this email already exists",
      });
    });

    it("should return 500 for unexpected errors", async () => {
      // Setup
      mockRequest.body = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      jest
        .spyOn(UserService, "registerUser")
        .mockRejectedValueOnce(new Error("Database error"));

      // Execute
      await UserController.register(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.registerUser).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("login", () => {
    it("should login a user successfully", async () => {
      // Setup
      const credentials = {
        email: "test@example.com",
        password: "password123",
      };

      const mockAuthResult = {
        user: {
          id: 1,
          username: "testuser",
          email: credentials.email,
          created_at: new Date(),
          updated_at: new Date(),
        },
        token: "jwt-token-123",
      };

      mockRequest.body = credentials;
      jest
        .spyOn(UserService, "authenticateUser")
        .mockResolvedValueOnce(mockAuthResult as any);

      // Execute
      await UserController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.authenticateUser).toHaveBeenCalledWith(
        credentials.email,
        credentials.password
      );
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockAuthResult);
    });

    it("should return 400 if required fields are missing", async () => {
      // Setup - missing password
      mockRequest.body = {
        email: "test@example.com",
      };

      // Execute
      await UserController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.authenticateUser).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        message: expect.stringContaining("required"),
      });
    });

    it("should return 401 for invalid credentials", async () => {
      // Setup
      mockRequest.body = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      jest
        .spyOn(UserService, "authenticateUser")
        .mockRejectedValueOnce(new Error("Invalid credentials"));

      // Execute
      await UserController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.authenticateUser).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(401);
      expect(responseJson).toHaveBeenCalledWith({
        message: expect.stringContaining("Invalid"),
      });
    });

    it("should return 500 for unexpected errors", async () => {
      // Setup
      mockRequest.body = {
        email: "test@example.com",
        password: "password123",
      };

      jest
        .spyOn(UserService, "authenticateUser")
        .mockRejectedValueOnce(new Error("Database error"));

      // Execute
      await UserController.login(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.authenticateUser).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("getProfile", () => {
    it("should get user profile successfully", async () => {
      // Setup
      const userId = "1";
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest.params = { id: userId };
      jest
        .spyOn(UserService, "getUserById")
        .mockResolvedValueOnce(mockUser as any);

      // Execute
      await UserController.getProfile(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.getUserById).toHaveBeenCalledWith(1);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockUser);
    });

    it("should return 400 for invalid user ID", async () => {
      // Setup - invalid ID
      mockRequest.params = { id: "invalid" };

      // Execute
      await UserController.getProfile(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.getUserById).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        message: expect.stringContaining("Invalid"),
      });
    });

    it("should return 404 if user not found", async () => {
      // Setup
      mockRequest.params = { id: "999" };
      jest.spyOn(UserService, "getUserById").mockResolvedValueOnce(null);

      // Execute
      await UserController.getProfile(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.getUserById).toHaveBeenCalledWith(999);
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        message: expect.stringContaining("not found"),
      });
    });

    it("should return 500 for unexpected errors", async () => {
      // Setup
      mockRequest.params = { id: "1" };
      jest
        .spyOn(UserService, "getUserById")
        .mockRejectedValueOnce(new Error("Database error"));

      // Execute
      await UserController.getProfile(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.getUserById).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("getAllUsers", () => {
    it("should get all users successfully", async () => {
      // Mock users
      const mockUsers = [
        {
          id: 1,
          username: "user1",
          email: "user1@example.com",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          username: "user2",
          email: "user2@example.com",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      jest.spyOn(UserService, "getAllUsers").mockResolvedValueOnce(mockUsers);

      // Execute
      await UserController.getAllUsers(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.getAllUsers).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockUsers);
    });

    it("should return 500 for unexpected errors", async () => {
      jest
        .spyOn(UserService, "getAllUsers")
        .mockRejectedValueOnce(new Error("Database error"));

      // Execute
      await UserController.getAllUsers(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.getAllUsers).toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("updateUser", () => {
    it("should update user successfully", async () => {
      // Setup
      const userId = "1";
      const updateData = {
        username: "updateduser",
        email: "updated@example.com",
      };
      const mockUser = {
        id: 1,
        ...updateData,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRequest.params = { id: userId };
      mockRequest.body = updateData;

      jest.spyOn(UserService, "getUserById").mockResolvedValueOnce(mockUser);
      jest.spyOn(UserService, "updateUser").mockResolvedValueOnce(mockUser);

      // Execute
      await UserController.updateUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.getUserById).toHaveBeenCalledWith(1);
      expect(UserService.updateUser).toHaveBeenCalledWith(1, updateData);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith(mockUser);
    });

    it("should return 400 for invalid user ID", async () => {
      // Setup - invalid ID
      mockRequest.params = { id: "invalid" };
      mockRequest.body = { username: "updateduser" };

      // Execute
      await UserController.updateUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.getUserById).not.toHaveBeenCalled();
      expect(UserService.updateUser).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        message: expect.stringContaining("Invalid"),
      });
    });

    it("should return 404 if user not found", async () => {
      // Setup
      mockRequest.params = { id: "999" };
      mockRequest.body = { username: "updateduser" };

      jest.spyOn(UserService, "getUserById").mockResolvedValueOnce(null);

      // Execute
      await UserController.updateUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.getUserById).toHaveBeenCalledWith(999);
      expect(UserService.updateUser).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        message: expect.stringContaining("not found"),
      });
    });

    it("should return 500 for unexpected errors", async () => {
      // Setup
      mockRequest.params = { id: "1" };
      mockRequest.body = { username: "updateduser" };

      jest
        .spyOn(UserService, "getUserById")
        .mockResolvedValueOnce({ id: 1 } as any);
      jest
        .spyOn(UserService, "updateUser")
        .mockRejectedValueOnce(new Error("Database error"));

      // Execute
      await UserController.updateUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      // Setup
      const userId = "1";
      mockRequest.params = { id: userId };

      jest
        .spyOn(UserService, "getUserById")
        .mockResolvedValueOnce({ id: 1 } as any);
      jest.spyOn(UserService, "deleteUser").mockResolvedValueOnce(true);

      // Execute
      await UserController.deleteUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.getUserById).toHaveBeenCalledWith(1);
      expect(UserService.deleteUser).toHaveBeenCalledWith(1);
      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseJson).toHaveBeenCalledWith({
        message: expect.stringContaining("deleted successfully"),
      });
    });

    it("should return 400 for invalid user ID", async () => {
      // Setup
      mockRequest.params = { id: "invalid" };

      // Execute
      await UserController.deleteUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.getUserById).not.toHaveBeenCalled();
      expect(UserService.deleteUser).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        message: expect.stringContaining("Invalid"),
      });
    });

    it("should return 404 if user not found", async () => {
      // Setup
      mockRequest.params = { id: "999" };

      jest.spyOn(UserService, "getUserById").mockResolvedValueOnce(null);

      // Execute
      await UserController.deleteUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(UserService.getUserById).toHaveBeenCalledWith(999);
      expect(UserService.deleteUser).not.toHaveBeenCalled();
      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({
        message: expect.stringContaining("not found"),
      });
    });

    it("should return 500 if delete operation fails", async () => {
      // Setup
      mockRequest.params = { id: "1" };

      jest
        .spyOn(UserService, "getUserById")
        .mockResolvedValueOnce({ id: 1 } as any);
      jest.spyOn(UserService, "deleteUser").mockResolvedValueOnce(false);

      // Execute
      await UserController.deleteUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        message: expect.stringContaining("Failed to delete"),
      });
    });

    it("should return 500 for unexpected errors", async () => {
      // Setup
      mockRequest.params = { id: "1" };

      jest
        .spyOn(UserService, "getUserById")
        .mockResolvedValueOnce({ id: 1 } as any);
      jest
        .spyOn(UserService, "deleteUser")
        .mockRejectedValueOnce(new Error("Database error"));

      // Execute
      await UserController.deleteUser(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });
});
