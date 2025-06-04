import { Request, Response } from "express";
import { TaskController } from "../src/controllers/task.controller";
import { TaskService } from "../src/services/task.services";
import { TaskStatus, TaskPriority, Task } from "../src/models/task.model";

// Mock the TaskService
jest.mock("../src/services/task.services");

describe("TaskController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObj: any = {};

  beforeEach(() => {
    mockRequest = {};
    responseObj = {
      statusCode: 0,
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockImplementation((code) => {
        responseObj.statusCode = code;
        return responseObj;
      }),
    };
    mockResponse = responseObj;

    jest.clearAllMocks();
  });

  describe("createTask", () => {
    it("should create a new task and return 201 status", async () => {
      // Setup request body
      mockRequest.body = {
        title: "Test Task",
        description: "This is a test task",
        status: "pending",
        priority: "medium",
      };

      // Mock user object in request (from auth middleware)
      mockRequest.user = { userId: 1, email: "user@example.com" };

      // Mock the TaskService response
      const mockTask = {
        id: 1,
        ...mockRequest.body,
        user_id: 1,
        due_date: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (TaskService.createTask as jest.Mock).mockResolvedValueOnce(mockTask);

      // Call controller method
      await TaskController.createTask(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assertions
      expect(TaskService.createTask).toHaveBeenCalledWith({
        ...mockRequest.body,
        user_id: 1, // Should use the ID from authenticated user
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockTask);
    });

    it("should return 400 if title is missing", async () => {
      // Missing title
      mockRequest.body = {
        description: "This is a test task",
        status: "pending",
        priority: "medium",
      };
      mockRequest.user = { userId: 1, email: "user@example.com" };

      await TaskController.createTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(TaskService.createTask).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Task title is required",
      });
    });

    it("should return 400 if user_id is missing and no authenticated user", async () => {
      mockRequest.body = {
        title: "Test Task",
        description: "This is a test task",
        status: "pending",
        priority: "medium",
      };
      mockRequest.user = undefined;

      await TaskController.createTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(TaskService.createTask).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User ID is required",
      });
    });

    it("should use explicit user_id from body over authenticated user", async () => {
      mockRequest.body = {
        title: "Test Task",
        description: "This is a test task",
        status: "pending",
        priority: "medium",
        user_id: 2, // Explicit user_id in body
      };
      mockRequest.user = { userId: 1, email: "user@example.com" };

      const mockTask = {
        id: 1,
        ...mockRequest.body,
        due_date: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (TaskService.createTask as jest.Mock).mockResolvedValueOnce(mockTask);

      await TaskController.createTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(TaskService.createTask).toHaveBeenCalledWith({
        ...mockRequest.body,
        user_id: 2, // Should use the explicit ID from body
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockTask);
    });

    it("should return 404 if user not found", async () => {
      mockRequest.body = {
        title: "Test Task",
        description: "This is a test task",
        status: "pending",
        priority: "medium",
      };
      mockRequest.user = { userId: 1, email: "user@example.com" };

      const error = new Error("User not found");
      (TaskService.createTask as jest.Mock).mockRejectedValueOnce(error);

      await TaskController.createTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User not found",
      });
    });

    it("should return 500 for other errors", async () => {
      mockRequest.body = {
        title: "Test Task",
        description: "This is a test task",
        status: "pending",
        priority: "medium",
      };
      mockRequest.user = { userId: 1, email: "user@example.com" };

      const error = new Error("Database error");
      (TaskService.createTask as jest.Mock).mockRejectedValueOnce(error);

      await TaskController.createTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("getTask", () => {
    it("should return a task if found", async () => {
      // Setup request params
      mockRequest.params = { id: "1" };

      // Mock the TaskService response
      const mockTask = {
        id: 1,
        title: "Test Task",
        description: "This is a test task",
        status: "pending" as TaskStatus,
        priority: "medium" as TaskPriority,
        due_date: null,
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (TaskService.getTaskById as jest.Mock).mockResolvedValueOnce(mockTask);

      // Call controller method
      await TaskController.getTask(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assertions
      expect(TaskService.getTaskById).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockTask);
    });

    it("should return 404 if task is not found", async () => {
      mockRequest.params = { id: "999" };

      (TaskService.getTaskById as jest.Mock).mockResolvedValueOnce(null);

      await TaskController.getTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(TaskService.getTaskById).toHaveBeenCalledWith(999);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Task not found",
      });
    });

    it("should return 400 if ID is invalid", async () => {
      mockRequest.params = { id: "invalid" };

      await TaskController.getTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(TaskService.getTaskById).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid task ID",
      });
    });

    it("should return 500 if service throws an error", async () => {
      mockRequest.params = { id: "1" };

      const error = new Error("Database error");
      (TaskService.getTaskById as jest.Mock).mockRejectedValueOnce(error);

      await TaskController.getTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("getUserTasks", () => {
    it("should return tasks for specified user ID in params", async () => {
      // Setup request params
      mockRequest.params = { userId: "1" };

      // Mock the TaskService response
      const mockTasks = [
        {
          id: 1,
          title: "Task 1",
          description: "Description 1",
          status: "pending" as TaskStatus,
          priority: "medium" as TaskPriority,
          due_date: null,
          user_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          title: "Task 2",
          description: "Description 2",
          status: "completed" as TaskStatus,
          priority: "high" as TaskPriority,
          due_date: null,
          user_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (TaskService.getTasksByUserId as jest.Mock).mockResolvedValueOnce(
        mockTasks
      );

      // Call controller method
      await TaskController.getUserTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assertions
      expect(TaskService.getTasksByUserId).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockTasks);
    });

    it("should use authenticated user ID when params userId is missing", async () => {
      // No userId in params, but authenticated user in request
      mockRequest.params = {};
      mockRequest.user = { userId: 2, email: "user@example.com" };

      const mockTasks = [
        {
          id: 3,
          title: "User 2 Task",
          description: "Task for user 2",
          status: "pending" as TaskStatus,
          priority: "low" as TaskPriority,
          due_date: null,
          user_id: 2,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (TaskService.getTasksByUserId as jest.Mock).mockResolvedValueOnce(
        mockTasks
      );

      await TaskController.getUserTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(TaskService.getTasksByUserId).toHaveBeenCalledWith(2);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockTasks);
    });

    it("should return 400 if user ID is invalid and no authenticated user", async () => {
      mockRequest.params = { userId: "invalid" };
      mockRequest.user = undefined;

      await TaskController.getUserTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(TaskService.getTasksByUserId).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid user ID",
      });
    });

    it("should return 404 if user is not found", async () => {
      mockRequest.params = { userId: "999" };

      const error = new Error("User not found");
      (TaskService.getTasksByUserId as jest.Mock).mockRejectedValueOnce(error);

      await TaskController.getUserTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(TaskService.getTasksByUserId).toHaveBeenCalledWith(999);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User not found",
      });
    });

    it("should return 500 if service throws an error", async () => {
      mockRequest.params = { userId: "1" };

      const error = new Error("Database error");
      (TaskService.getTasksByUserId as jest.Mock).mockRejectedValueOnce(error);

      await TaskController.getUserTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("getAllTasks", () => {
    it("should return all tasks with default pagination", async () => {
      // Setup empty query parameters
      mockRequest.query = {};

      // Mock the TaskService response
      const mockTasks = [
        {
          id: 1,
          title: "Task 1",
          description: "Description 1",
          status: "pending" as TaskStatus,
          priority: "medium" as TaskPriority,
          due_date: null,
          user_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          title: "Task 2",
          description: "Description 2",
          status: "completed" as TaskStatus,
          priority: "high" as TaskPriority,
          due_date: null,
          user_id: 2,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const serviceResponse = { tasks: mockTasks, total: 2 };
      (TaskService.getAllTasks as jest.Mock).mockResolvedValueOnce(
        serviceResponse
      );

      // Call controller method
      await TaskController.getAllTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assertions
      expect(TaskService.getAllTasks).toHaveBeenCalledWith({});
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockTasks,
        meta: {
          total: 2,
          limit: 100,
          offset: 0,
        },
      });
    });

    it("should apply filtering and pagination options", async () => {
      // Setup query parameters
      mockRequest.query = {
        status: "pending",
        priority: "high",
        user_id: "1",
        search: "test",
        limit: "10",
        offset: "20",
        sort_by: "due_date",
        sort_direction: "desc",
      };

      const mockTasks = [
        {
          id: 1,
          title: "Test Task",
          description: "This is a test task",
          status: "pending" as TaskStatus,
          priority: "high" as TaskPriority,
          due_date: null,
          user_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const serviceResponse = { tasks: mockTasks, total: 1 };
      (TaskService.getAllTasks as jest.Mock).mockResolvedValueOnce(
        serviceResponse
      );

      await TaskController.getAllTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      // Check that all query params are passed correctly
      expect(TaskService.getAllTasks).toHaveBeenCalledWith({
        status: "pending",
        priority: "high",
        user_id: 1,
        search: "test",
        limit: 10,
        offset: 20,
        sort_by: "due_date",
        sort_direction: "DESC",
      });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockTasks,
        meta: {
          total: 1,
          limit: 10,
          offset: 20,
        },
      });
    });

    it("should handle invalid parameters gracefully", async () => {
      // Setup invalid query parameters
      mockRequest.query = {
        limit: "invalid",
        offset: "invalid",
        user_id: "invalid",
      };

      const mockTasks: any[] = [];
      const serviceResponse = { tasks: mockTasks, total: 0 };
      (TaskService.getAllTasks as jest.Mock).mockResolvedValueOnce(
        serviceResponse
      );

      await TaskController.getAllTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      // The controller should pass NaN values to the service
      // But the service might handle them internally
      expect(TaskService.getAllTasks).toHaveBeenCalledWith({
        limit: NaN,
        offset: NaN,
        user_id: NaN,
      });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: mockTasks,
        meta: {
          total: 0,
          limit: 100, // Default values used for invalid params
          offset: 0,
        },
      });
    });

    it("should return 500 if service throws an error", async () => {
      mockRequest.query = {};

      const error = new Error("Database error");
      (TaskService.getAllTasks as jest.Mock).mockRejectedValueOnce(error);

      await TaskController.getAllTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("updateTask", () => {
    it("should update a task and return the updated data", async () => {
      // Setup request
      mockRequest.params = { id: "1" };
      mockRequest.body = {
        title: "Updated Task",
        description: "Updated description",
        status: "completed" as TaskStatus,
      };

      // Mock the TaskService response
      const mockUpdatedTask = {
        id: 1,
        title: "Updated Task",
        description: "Updated description",
        status: "completed" as TaskStatus,
        priority: "medium" as TaskPriority,
        due_date: null,
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (TaskService.updateTask as jest.Mock).mockResolvedValueOnce(
        mockUpdatedTask
      );

      // Call controller method
      await TaskController.updateTask(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assertions
      expect(TaskService.updateTask).toHaveBeenCalledWith(1, mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUpdatedTask);
    });

    it("should return 400 if task ID is invalid", async () => {
      mockRequest.params = { id: "invalid" };
      mockRequest.body = { title: "Updated Task" };

      await TaskController.updateTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(TaskService.updateTask).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid task ID",
      });
    });

    it("should return 404 if task is not found", async () => {
      mockRequest.params = { id: "999" };
      mockRequest.body = { title: "Updated Task" };

      (TaskService.updateTask as jest.Mock).mockResolvedValueOnce(null);

      await TaskController.updateTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(TaskService.updateTask).toHaveBeenCalledWith(
        999,
        mockRequest.body
      );
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Task not found",
      });
    });

    it("should return 404 if service throws 'Task not found'", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { title: "Updated Task" };

      const error = new Error("Task not found");
      (TaskService.updateTask as jest.Mock).mockRejectedValueOnce(error);

      await TaskController.updateTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Task not found",
      });
    });

    it("should return 404 if service throws 'User not found'", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { title: "Updated Task", user_id: 999 };

      const error = new Error("User not found");
      (TaskService.updateTask as jest.Mock).mockRejectedValueOnce(error);

      await TaskController.updateTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User not found",
      });
    });

    it("should return 500 if service throws other errors", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { title: "Updated Task" };

      const error = new Error("Database error");
      (TaskService.updateTask as jest.Mock).mockRejectedValueOnce(error);

      await TaskController.updateTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("deleteTask", () => {
    it("should delete a task and return success message", async () => {
      // Setup request
      mockRequest.params = { id: "1" };

      // Mock successful deletion
      (TaskService.deleteTask as jest.Mock).mockResolvedValueOnce(true);

      // Call controller method
      await TaskController.deleteTask(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assertions
      expect(TaskService.deleteTask).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Task deleted successfully",
      });
    });

    it("should return 400 if task ID is invalid", async () => {
      mockRequest.params = { id: "invalid" };

      await TaskController.deleteTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(TaskService.deleteTask).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid task ID",
      });
    });

    it("should return 404 if task is not found (service returns false)", async () => {
      mockRequest.params = { id: "999" };

      (TaskService.deleteTask as jest.Mock).mockResolvedValueOnce(false);

      await TaskController.deleteTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(TaskService.deleteTask).toHaveBeenCalledWith(999);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Task not found",
      });
    });

    it("should return 404 if service throws 'Task not found'", async () => {
      mockRequest.params = { id: "1" };

      const error = new Error("Task not found");
      (TaskService.deleteTask as jest.Mock).mockRejectedValueOnce(error);

      await TaskController.deleteTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Task not found",
      });
    });

    it("should return 500 if service throws other errors", async () => {
      mockRequest.params = { id: "1" };

      const error = new Error("Database error");
      (TaskService.deleteTask as jest.Mock).mockRejectedValueOnce(error);

      await TaskController.deleteTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });
  });

  describe("deleteUserTasks", () => {
    it("should delete all tasks for a user and return success message", async () => {
      // Setup request
      mockRequest.params = { userId: "1" };

      // Mock successful deletion of 5 tasks
      (TaskService.deleteTasksByUserId as jest.Mock).mockResolvedValueOnce(5);

      // Call controller method
      await TaskController.deleteUserTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assertions
      expect(TaskService.deleteTasksByUserId).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "5 tasks deleted successfully for user ID: 1",
      });
    });

    it("should return 400 if user ID is invalid", async () => {
      mockRequest.params = { userId: "invalid" };

      await TaskController.deleteUserTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(TaskService.deleteTasksByUserId).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Invalid user ID",
      });
    });

    it("should return 404 if service throws 'User not found'", async () => {
      mockRequest.params = { userId: "999" };

      const error = new Error("User not found");
      (TaskService.deleteTasksByUserId as jest.Mock).mockRejectedValueOnce(
        error
      );

      await TaskController.deleteUserTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(TaskService.deleteTasksByUserId).toHaveBeenCalledWith(999);
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "User not found",
      });
    });

    it("should return 500 if service throws other errors", async () => {
      mockRequest.params = { userId: "1" };

      const error = new Error("Database error");
      (TaskService.deleteTasksByUserId as jest.Mock).mockRejectedValueOnce(
        error
      );

      await TaskController.deleteUserTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Internal server error",
      });
    });

    it("should return success with 0 tasks if no tasks were found", async () => {
      mockRequest.params = { userId: "1" };

      // Mock successful deletion of 0 tasks (no tasks found)
      (TaskService.deleteTasksByUserId as jest.Mock).mockResolvedValueOnce(0);

      await TaskController.deleteUserTasks(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(TaskService.deleteTasksByUserId).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "0 tasks deleted successfully for user ID: 1",
      });
    });
  });
});
