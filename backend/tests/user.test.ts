import { User, UserModel } from "../src/models/user.model";
import { UserService } from "../src/services/user.services";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Mock the database pool
jest.mock("../src/utils/db", () => ({
  pool: {
    query: jest.fn(),
  },
}));

// Get the mocked pool
const mockPool = jest.requireMock("../src/utils/db").pool;

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

describe("UserModel", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new user", async () => {
      // Mock user data
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      // Mock database response
      const mockUser = {
        id: 1,
        ...userData,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      // Call the method
      const result = await UserModel.create(userData);

      // Assertions
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO users"),
        [userData.username, userData.email, userData.password]
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe("findById", () => {
    it("should find a user by ID", async () => {
      // Mock user
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword",
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      // Call the method
      const result = await UserModel.findById(1);

      // Assertions
      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE id = $1;",
        [1]
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null if user is not found", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      // Call the method
      const result = await UserModel.findById(999);

      // Assertions
      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE id = $1;",
        [999]
      );
      expect(result).toBeNull();
    });
  });

  describe("findByEmail", () => {
    it("should find a user by email", async () => {
      // Mock user
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword",
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      // Call the method
      const result = await UserModel.findByEmail("test@example.com");

      // Assertions
      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE email = $1;",
        ["test@example.com"]
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null if user is not found", async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      // Call the method
      const result = await UserModel.findByEmail("nonexistent@example.com");

      // Assertions
      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE email = $1;",
        ["nonexistent@example.com"]
      );
      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should return all users", async () => {
      // Mock users
      const mockUsers = [
        {
          id: 1,
          username: "user1",
          email: "user1@example.com",
          password: "hashedpassword",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          username: "user2",
          email: "user2@example.com",
          password: "hashedpassword",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockUsers });

      // Call the method
      const result = await UserModel.findAll();

      // Assertions
      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT * FROM users ORDER BY created_at DESC;"
      );
      expect(result).toEqual(mockUsers);
    });
  });

  describe("update", () => {
    it("should update a user", async () => {
      // Mock user data
      const userId = 1;
      const updateData = {
        username: "updateduser",
        email: "updated@example.com",
      };

      // Mock updated user
      const mockUpdatedUser = {
        id: userId,
        ...updateData,
        password: "hashedpassword",
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockUpdatedUser],
      });

      // Call the method
      const result = await UserModel.update(userId, updateData);

      // Assertions
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE users[\s\S]*SET[\s\S]*WHERE id = \$3/),
        expect.arrayContaining([updateData.username, updateData.email, userId])
      );
      expect(result).toEqual(mockUpdatedUser);
    });

    it("should call findById if no fields are provided for update", async () => {
      const userId = 1;
      const emptyUpdateData = {};

      // Need to spy on findById since it will be called internally
      const findByIdSpy = jest
        .spyOn(UserModel, "findById")
        .mockResolvedValueOnce({
          id: userId,
          username: "testuser",
          email: "test@example.com",
          password: "hashedpassword",
          created_at: new Date(),
          updated_at: new Date(),
        });

      // Mock the pool query to ensure it's not called
      mockPool.query.mockClear();

      await UserModel.update(userId, emptyUpdateData);

      // Should call findById instead of running an update query
      expect(findByIdSpy).toHaveBeenCalledWith(userId);

      // Query should not be called since we're just fetching the user
      expect(mockPool.query).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should delete a user", async () => {
      const userId = 1;
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: userId }],
      });

      // Call the method
      const result = await UserModel.delete(userId);

      // Assertions
      expect(mockPool.query).toHaveBeenCalledWith(
        "DELETE FROM users WHERE id = $1 RETURNING id;",
        [userId]
      );
      expect(result).toBe(true);
    });

    it("should return false if user is not found", async () => {
      const userId = 999;
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      // Call the method
      const result = await UserModel.delete(userId);

      // Assertions
      expect(mockPool.query).toHaveBeenCalledWith(
        "DELETE FROM users WHERE id = $1 RETURNING id;",
        [userId]
      );
      expect(result).toBe(false);
    });
  });
});

describe("UserService", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    it("should register a new user with hashed password", async () => {
      // Mock user data
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      };

      // Mock hashed password
      const hashedPassword = "hashedpassword123";
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce(hashedPassword);

      // Mock finding no existing user with the email
      jest.spyOn(UserModel, "findByEmail").mockResolvedValueOnce(null);

      // Mock user creation
      const mockUser = {
        id: 1,
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date(),
      };
      jest.spyOn(UserModel, "create").mockResolvedValueOnce(mockUser);

      // Call the method
      const result = await UserService.registerUser(userData);

      // Assertions
      expect(UserModel.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(UserModel.create).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword,
      });

      // Check password is removed from result
      expect(result).not.toHaveProperty("password");
      expect(result).toHaveProperty("id", mockUser.id);
      expect(result).toHaveProperty("username", mockUser.username);
      expect(result).toHaveProperty("email", mockUser.email);
    });

    it("should throw error if user with email already exists", async () => {
      // Mock user data
      const userData = {
        username: "testuser",
        email: "existing@example.com",
        password: "password123",
      };

      // Mock finding existing user with the email
      const existingUser = {
        id: 1,
        username: "existinguser",
        email: userData.email,
        password: "hashedpassword",
        created_at: new Date(),
        updated_at: new Date(),
      };
      jest.spyOn(UserModel, "findByEmail").mockResolvedValueOnce(existingUser);

      // Call the method and expect it to throw
      await expect(UserService.registerUser(userData)).rejects.toThrow(
        "User with this email already exists"
      );

      // Verify that create was not called
      expect(UserModel.create).not.toHaveBeenCalled();
    });
  });

  describe("authenticateUser", () => {
    it("should authenticate a user with valid credentials", async () => {
      // Mock credentials
      const email = "test@example.com";
      const password = "password123";

      // Mock user
      const mockUser = {
        id: 1,
        username: "testuser",
        email,
        password: "hashedpassword",
        created_at: new Date(),
        updated_at: new Date(),
      };
      jest.spyOn(UserModel, "findByEmail").mockResolvedValueOnce(mockUser);

      // Mock password comparison
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      // Mock JWT token
      const mockToken = "jwt-token";
      (jwt.sign as jest.Mock).mockReturnValueOnce(mockToken);

      // Call the method
      const result = await UserService.authenticateUser(email, password);

      // Assertions
      expect(UserModel.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(jwt.sign).toHaveBeenCalled();

      // Check result structure
      expect(result).toHaveProperty("token", mockToken);
      expect(result).toHaveProperty("user");
      expect(result.user).not.toHaveProperty("password");
      expect(result.user).toHaveProperty("id", mockUser.id);
      expect(result.user).toHaveProperty("email", mockUser.email);
    });

    it("should throw error if user not found", async () => {
      jest.spyOn(UserModel, "findByEmail").mockResolvedValueOnce(null);

      await expect(
        UserService.authenticateUser("nonexistent@example.com", "password")
      ).rejects.toThrow("Invalid credentials");
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should throw error if password is incorrect", async () => {
      // Mock user
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword",
        created_at: new Date(),
        updated_at: new Date(),
      };
      jest.spyOn(UserModel, "findByEmail").mockResolvedValueOnce(mockUser);

      // Mock password comparison
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        UserService.authenticateUser("test@example.com", "wrongpassword")
      ).rejects.toThrow("Invalid credentials");
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  describe("getUserById", () => {
    it("should return user without password", async () => {
      // Mock user
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword",
        created_at: new Date(),
        updated_at: new Date(),
      };
      jest.spyOn(UserModel, "findById").mockResolvedValueOnce(mockUser);

      // Call the method
      const result = await UserService.getUserById(1);

      // Assertions
      expect(UserModel.findById).toHaveBeenCalledWith(1);
      expect(result).not.toHaveProperty("password");
      expect(result).toHaveProperty("id", mockUser.id);
      expect(result).toHaveProperty("username", mockUser.username);
      expect(result).toHaveProperty("email", mockUser.email);
    });

    it("should return null if user not found", async () => {
      jest.spyOn(UserModel, "findById").mockResolvedValueOnce(null);

      // Call the method
      const result = await UserService.getUserById(999);

      // Assertions
      expect(UserModel.findById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });

  // Add more tests for other UserService methods
});
