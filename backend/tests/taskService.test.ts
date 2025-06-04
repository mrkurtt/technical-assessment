import {
  TaskModel,
  Task,
  TaskStatus,
  TaskPriority,
} from "../src/models/task.model";
import { TaskService } from "../src/services/task.services";
import { UserModel } from "../src/models/user.model";

// Mock the UserModel
jest.mock("../src/models/user.model", () => ({
  UserModel: {
    findById: jest.fn(),
  },
}));

// Mock the TaskModel
jest.mock("../src/models/task.model", () => ({
  TaskModel: {
    create: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteByUserId: jest.fn(),
  },
  TaskStatus: {
    PENDING: "pending",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
  },
  TaskPriority: {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    URGENT: "urgent",
  },
}));

describe("TaskService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createTask", () => {
    it("should create a new task", async () => {
      // Mock task data
      const taskData = {
        title: "Test Task",
        description: "This is a test task",
        status: "pending" as TaskStatus,
        priority: "medium" as TaskPriority,
        user_id: 1,
      };

      // Mock the user
      const mockUser = { id: 1, name: "Test User", email: "test@example.com" };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      // Mock the created task
      const mockTask = {
        id: 1,
        ...taskData,
        due_date: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (TaskModel.create as jest.Mock).mockResolvedValue(mockTask);

      // Call the method
      const result = await TaskService.createTask(taskData);

      // Assertions
      expect(UserModel.findById).toHaveBeenCalledWith(taskData.user_id);
      expect(TaskModel.create).toHaveBeenCalledWith(taskData);
      expect(result).toEqual(mockTask);
    });

    it("should handle database errors during task creation", async () => {
      const taskData = {
        title: "Test Task",
        description: "This is a test task",
        status: "pending" as TaskStatus,
        priority: "medium" as TaskPriority,
        user_id: 1,
      };

      // Mock the user
      const mockUser = { id: 1, name: "Test User", email: "test@example.com" };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      const errorMessage = "Database error";
      (TaskModel.create as jest.Mock).mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await expect(async () => {
        await TaskService.createTask(taskData);
      }).rejects.toThrow(errorMessage);
    });

    it("should throw error if user not found", async () => {
      const taskData = {
        title: "Test Task",
        description: "This is a test task",
        status: "pending" as TaskStatus,
        priority: "medium" as TaskPriority,
        user_id: 999, // Non-existent user
      };

      // Mock user not found
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(async () => {
        await TaskService.createTask(taskData);
      }).rejects.toThrow("User not found");
    });
  });

  describe("getTaskById", () => {
    it("should return a task by ID", async () => {
      const taskId = 1;
      const mockTask = {
        id: taskId,
        title: "Test Task",
        description: "This is a test task",
        status: "pending" as TaskStatus,
        priority: "medium" as TaskPriority,
        due_date: null,
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (TaskModel.findById as jest.Mock).mockResolvedValue(mockTask);

      const result = await TaskService.getTaskById(taskId);

      expect(TaskModel.findById).toHaveBeenCalledWith(taskId);
      expect(result).toEqual(mockTask);
    });

    it("should return null if task is not found", async () => {
      const taskId = 999;
      (TaskModel.findById as jest.Mock).mockResolvedValue(null);

      const result = await TaskService.getTaskById(taskId);

      expect(TaskModel.findById).toHaveBeenCalledWith(taskId);
      expect(result).toBeNull();
    });

    it("should handle database errors when fetching task", async () => {
      const taskId = 1;
      const errorMessage = "Database error";
      (TaskModel.findById as jest.Mock).mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await expect(async () => {
        await TaskService.getTaskById(taskId);
      }).rejects.toThrow(errorMessage);
    });
  });

  describe("getTasksByUserId", () => {
    it("should return tasks for a specific user", async () => {
      const userId = 1;

      // Mock the user
      const mockUser = { id: 1, name: "Test User", email: "test@example.com" };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      const mockTasks = [
        {
          id: 1,
          title: "Task 1",
          description: "Description 1",
          status: "pending" as TaskStatus,
          priority: "medium" as TaskPriority,
          due_date: null,
          user_id: userId,
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
          user_id: userId,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (TaskModel.findByUserId as jest.Mock).mockResolvedValue(mockTasks);

      const result = await TaskService.getTasksByUserId(userId);

      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(TaskModel.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockTasks);
    });

    it("should return empty array if user has no tasks", async () => {
      const userId = 1;

      // Mock the user
      const mockUser = { id: 1, name: "Test User", email: "test@example.com" };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      (TaskModel.findByUserId as jest.Mock).mockResolvedValue([]);

      const result = await TaskService.getTasksByUserId(userId);

      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(TaskModel.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
    });

    it("should handle database errors when fetching user tasks", async () => {
      const userId = 1;

      // Mock the user
      const mockUser = { id: 1, name: "Test User", email: "test@example.com" };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      const errorMessage = "Database error";
      (TaskModel.findByUserId as jest.Mock).mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await expect(async () => {
        await TaskService.getTasksByUserId(userId);
      }).rejects.toThrow(errorMessage);
    });

    it("should throw error if user not found", async () => {
      const userId = 999; // Non-existent user

      // Mock user not found
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(async () => {
        await TaskService.getTasksByUserId(userId);
      }).rejects.toThrow("User not found");
    });
  });

  describe("getAllTasks", () => {
    it("should return all tasks", async () => {
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

      const mockTotal = 2;
      (TaskModel.findAll as jest.Mock).mockResolvedValue(mockTasks);
      (TaskModel.count as jest.Mock).mockResolvedValue(mockTotal);

      const result = await TaskService.getAllTasks();

      expect(TaskModel.findAll).toHaveBeenCalled();
      expect(TaskModel.count).toHaveBeenCalled();
      expect(result).toEqual({ tasks: mockTasks, total: mockTotal });
    });

    it("should return empty array if no tasks exist", async () => {
      (TaskModel.findAll as jest.Mock).mockResolvedValue([]);
      (TaskModel.count as jest.Mock).mockResolvedValue(0);

      const result = await TaskService.getAllTasks();

      expect(TaskModel.findAll).toHaveBeenCalled();
      expect(TaskModel.count).toHaveBeenCalled();
      expect(result).toEqual({ tasks: [], total: 0 });
    });

    it("should handle database errors when fetching all tasks", async () => {
      const errorMessage = "Database error";
      (TaskModel.findAll as jest.Mock).mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await expect(async () => {
        await TaskService.getAllTasks();
      }).rejects.toThrow(errorMessage);
    });

    it("should pass filter options to the model", async () => {
      const options = {
        status: "pending" as TaskStatus,
        priority: "high" as TaskPriority,
        user_id: 1,
        search: "test",
      };

      (TaskModel.findAll as jest.Mock).mockResolvedValue([]);
      (TaskModel.count as jest.Mock).mockResolvedValue(0);

      await TaskService.getAllTasks(options);

      expect(TaskModel.findAll).toHaveBeenCalledWith(options);
      expect(TaskModel.count).toHaveBeenCalledWith(options);
    });
  });

  describe("updateTask", () => {
    it("should update a task with non-user related fields", async () => {
      const taskId = 1;
      const updateData = {
        title: "Updated Task",
        description: "Updated description",
        status: "completed" as TaskStatus,
        priority: "high" as TaskPriority,
      };

      // Mock existing task
      const mockExistingTask = {
        id: taskId,
        title: "Original Task",
        description: "Original description",
        status: "pending" as TaskStatus,
        priority: "medium" as TaskPriority,
        due_date: null,
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockUpdatedTask = {
        ...mockExistingTask,
        ...updateData,
        updated_at: new Date(),
      };

      // Setup mocks
      (TaskModel.findById as jest.Mock).mockResolvedValueOnce(mockExistingTask);
      (TaskModel.update as jest.Mock).mockResolvedValueOnce(mockUpdatedTask);

      // Call the service method
      const result = await TaskService.updateTask(taskId, updateData);

      // Verify the model methods were called correctly
      expect(TaskModel.findById).toHaveBeenCalledWith(taskId);
      expect(UserModel.findById).not.toHaveBeenCalled(); // User check should not be called
      expect(TaskModel.update).toHaveBeenCalledWith(taskId, updateData);

      // Verify result
      expect(result).toEqual(mockUpdatedTask);
    });

    it("should update a task with a valid new user_id", async () => {
      const taskId = 1;
      const newUserId = 2;
      const updateData = {
        title: "Updated Task",
        user_id: newUserId,
      };

      // Mock existing task
      const mockExistingTask = {
        id: taskId,
        title: "Original Task",
        description: "Original description",
        status: "pending" as TaskStatus,
        priority: "medium" as TaskPriority,
        due_date: null,
        user_id: 1, // Original user_id
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock new user
      const mockNewUser = {
        id: newUserId,
        name: "New User",
        email: "new@example.com",
      };

      const mockUpdatedTask = {
        ...mockExistingTask,
        title: updateData.title,
        user_id: newUserId,
        updated_at: new Date(),
      };

      // Setup mocks
      (TaskModel.findById as jest.Mock).mockResolvedValueOnce(mockExistingTask);
      (UserModel.findById as jest.Mock).mockResolvedValueOnce(mockNewUser);
      (TaskModel.update as jest.Mock).mockResolvedValueOnce(mockUpdatedTask);

      // Call the service method
      const result = await TaskService.updateTask(taskId, updateData);

      // Verify the model methods were called correctly
      expect(TaskModel.findById).toHaveBeenCalledWith(taskId);
      expect(UserModel.findById).toHaveBeenCalledWith(newUserId);
      expect(TaskModel.update).toHaveBeenCalledWith(taskId, updateData);

      // Verify result
      expect(result).toEqual(mockUpdatedTask);
    });

    it("should throw error when task is not found", async () => {
      const taskId = 999;
      const updateData = {
        title: "Updated Task",
      };

      // Mock task not found
      (TaskModel.findById as jest.Mock).mockResolvedValueOnce(null);

      // Call the service method and expect error
      await expect(TaskService.updateTask(taskId, updateData)).rejects.toThrow(
        "Task not found"
      );

      // Verify model methods
      expect(TaskModel.findById).toHaveBeenCalledWith(taskId);
      expect(TaskModel.update).not.toHaveBeenCalled();
    });

    it("should throw error when updating to non-existent user_id", async () => {
      const taskId = 1;
      const invalidUserId = 999;
      const updateData = {
        title: "Updated Task",
        user_id: invalidUserId,
      };

      // Mock existing task
      const mockExistingTask = {
        id: taskId,
        title: "Original Task",
        description: "Original description",
        status: "pending" as TaskStatus,
        priority: "medium" as TaskPriority,
        due_date: null,
        user_id: 1, // Original user_id
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock user not found
      (TaskModel.findById as jest.Mock).mockResolvedValueOnce(mockExistingTask);
      (UserModel.findById as jest.Mock).mockResolvedValueOnce(null);

      // Call the service method and expect error
      await expect(TaskService.updateTask(taskId, updateData)).rejects.toThrow(
        "User not found"
      );

      // Verify model methods
      expect(TaskModel.findById).toHaveBeenCalledWith(taskId);
      expect(UserModel.findById).toHaveBeenCalledWith(invalidUserId);
      expect(TaskModel.update).not.toHaveBeenCalled();
    });

    it("should not check user when user_id is the same as the current task", async () => {
      const taskId = 1;
      const currentUserId = 1;
      const updateData = {
        title: "Updated Task",
        user_id: currentUserId, // Same as current user_id
      };

      // Mock existing task
      const mockExistingTask = {
        id: taskId,
        title: "Original Task",
        description: "Original description",
        status: "pending" as TaskStatus,
        priority: "medium" as TaskPriority,
        due_date: null,
        user_id: currentUserId,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockUpdatedTask = {
        ...mockExistingTask,
        title: updateData.title,
        updated_at: new Date(),
      };

      // Setup mocks
      (TaskModel.findById as jest.Mock).mockResolvedValueOnce(mockExistingTask);
      (TaskModel.update as jest.Mock).mockResolvedValueOnce(mockUpdatedTask);

      // Call the service method
      const result = await TaskService.updateTask(taskId, updateData);

      // Verify the model methods were called correctly
      expect(TaskModel.findById).toHaveBeenCalledWith(taskId);
      expect(UserModel.findById).not.toHaveBeenCalled(); // User check should not be called
      expect(TaskModel.update).toHaveBeenCalledWith(taskId, updateData);

      // Verify result
      expect(result).toEqual(mockUpdatedTask);
    });

    it("should handle database errors during update", async () => {
      const taskId = 1;
      const updateData = {
        title: "Updated Task",
      };

      // Mock existing task
      const mockExistingTask = {
        id: taskId,
        title: "Original Task",
        description: "Original description",
        status: "pending" as TaskStatus,
        priority: "medium" as TaskPriority,
        due_date: null,
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Setup mocks
      (TaskModel.findById as jest.Mock).mockResolvedValueOnce(mockExistingTask);

      const errorMessage = "Database error";
      (TaskModel.update as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      // Call the service method and expect error
      await expect(TaskService.updateTask(taskId, updateData)).rejects.toThrow(
        errorMessage
      );

      // Verify model methods
      expect(TaskModel.findById).toHaveBeenCalledWith(taskId);
      expect(TaskModel.update).toHaveBeenCalledWith(taskId, updateData);
    });
  });

  describe("deleteTask", () => {
    it("should delete a task", async () => {
      const taskId = 1;

      // Mock existing task
      const mockExistingTask = {
        id: taskId,
        title: "Task to delete",
        description: "Description",
        status: "pending" as TaskStatus,
        priority: "medium" as TaskPriority,
        due_date: null,
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Reset all mocks for this test
      jest.clearAllMocks();

      (TaskModel.findById as jest.Mock).mockResolvedValue(mockExistingTask);
      (TaskModel.delete as jest.Mock).mockResolvedValue(true);

      const result = await TaskService.deleteTask(taskId);

      expect(TaskModel.delete).toHaveBeenCalledWith(taskId);
      expect(result).toBe(true);
    });

    it("should return false if task is not found", async () => {
      const taskId = 999;

      // Reset all mocks for this test
      jest.clearAllMocks();

      // Mock task not found
      (TaskModel.findById as jest.Mock).mockResolvedValue(null);

      // Expect the deleteTask to throw "Task not found" error
      await expect(async () => {
        await TaskService.deleteTask(taskId);
      }).rejects.toThrow("Task not found");

      expect(TaskModel.delete).not.toHaveBeenCalled();
    });

    it("should handle database errors during deletion", async () => {
      const taskId = 1;

      // Mock existing task
      const mockExistingTask = {
        id: taskId,
        title: "Task to delete",
        description: "Description",
        status: "pending" as TaskStatus,
        priority: "medium" as TaskPriority,
        due_date: null,
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Reset all mocks for this test
      jest.clearAllMocks();

      (TaskModel.findById as jest.Mock).mockResolvedValue(mockExistingTask);

      const errorMessage = "Database error";
      (TaskModel.delete as jest.Mock).mockImplementation(() => {
        throw new Error(errorMessage);
      });

      await expect(async () => {
        await TaskService.deleteTask(taskId);
      }).rejects.toThrow(errorMessage);
    });
  });

  describe("deleteTasksByUserId", () => {
    it("should delete all tasks for a user", async () => {
      const userId = 1;
      const deletedCount = 5;

      // Mock the user
      const mockUser = {
        id: userId,
        name: "Test User",
        email: "test@example.com",
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      // Mock successful deletion of tasks
      (TaskModel.deleteByUserId as jest.Mock).mockResolvedValue(deletedCount);

      const result = await TaskService.deleteTasksByUserId(userId);

      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(TaskModel.deleteByUserId).toHaveBeenCalledWith(userId);
      expect(result).toBe(deletedCount);
    });

    it("should throw error if user is not found", async () => {
      const userId = 999;

      // Mock user not found
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(TaskService.deleteTasksByUserId(userId)).rejects.toThrow(
        "User not found"
      );

      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(TaskModel.deleteByUserId).not.toHaveBeenCalled();
    });

    it("should handle database errors during deletion", async () => {
      const userId = 1;

      // Mock the user
      const mockUser = {
        id: userId,
        name: "Test User",
        email: "test@example.com",
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      // Mock database error
      const errorMessage = "Database error";
      (TaskModel.deleteByUserId as jest.Mock).mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(TaskService.deleteTasksByUserId(userId)).rejects.toThrow(
        errorMessage
      );

      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(TaskModel.deleteByUserId).toHaveBeenCalledWith(userId);
    });

    it("should return zero if user has no tasks", async () => {
      const userId = 1;

      // Mock the user
      const mockUser = {
        id: userId,
        name: "Test User",
        email: "test@example.com",
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

      // Mock no tasks deleted
      (TaskModel.deleteByUserId as jest.Mock).mockResolvedValue(0);

      const result = await TaskService.deleteTasksByUserId(userId);

      expect(UserModel.findById).toHaveBeenCalledWith(userId);
      expect(TaskModel.deleteByUserId).toHaveBeenCalledWith(userId);
      expect(result).toBe(0);
    });
  });
});
