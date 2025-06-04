import { pool } from "../src/utils/db";
import {
  TaskModel,
  TaskStatus,
  TaskPriority,
  Task,
} from "../src/models/task.model";

// Mock the database pool
jest.mock("../src/utils/db", () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe("TaskModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a task with all fields provided", async () => {
      // Setup mock data
      const taskData = {
        title: "Test Task",
        description: "Task description",
        status: "in_progress" as TaskStatus,
        priority: "high" as TaskPriority,
        due_date: new Date("2023-12-31"),
        user_id: 1,
      };

      const mockTask = {
        id: 1,
        ...taskData,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock the database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockTask],
      });

      // Call the method
      const result = await TaskModel.create(taskData);

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO tasks"),
        [
          taskData.title,
          taskData.description,
          taskData.status,
          taskData.priority,
          taskData.due_date,
          taskData.user_id,
        ]
      );

      // Verify result
      expect(result).toEqual(mockTask);
    });

    it("should create a task with minimal fields and use defaults", async () => {
      // Setup minimal data
      const taskData = {
        title: "Minimal Task",
        user_id: 1,
      };

      const mockTask = {
        id: 1,
        title: "Minimal Task",
        description: null,
        status: "pending",
        priority: "medium",
        due_date: null,
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock the database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockTask],
      });

      // Call the method
      const result = await TaskModel.create(taskData);

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO tasks"),
        [
          taskData.title,
          null, // description defaults to null
          "pending", // status defaults to pending
          "medium", // priority defaults to medium
          null, // due_date defaults to null
          taskData.user_id,
        ]
      );

      // Verify result
      expect(result).toEqual(mockTask);
    });

    it("should throw an error if database query fails", async () => {
      // Setup data
      const taskData = {
        title: "Error Task",
        user_id: 1,
      };

      // Mock database error
      const dbError = new Error("Database error");
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Verify error is thrown
      await expect(TaskModel.create(taskData)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("findById", () => {
    it("should return a task when found", async () => {
      // Setup mock task
      const mockTask = {
        id: 1,
        title: "Test Task",
        description: "Task description",
        status: "pending" as TaskStatus,
        priority: "medium" as TaskPriority,
        due_date: null,
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockTask],
      });

      // Call the method
      const result = await TaskModel.findById(1);

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        "SELECT * FROM tasks WHERE id = $1;",
        [1]
      );

      // Verify result
      expect(result).toEqual(mockTask);
    });

    it("should return null when task is not found", async () => {
      // Mock empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      // Call the method
      const result = await TaskModel.findById(999);

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        "SELECT * FROM tasks WHERE id = $1;",
        [999]
      );

      // Verify result
      expect(result).toBeNull();
    });

    it("should throw an error if database query fails", async () => {
      // Mock database error
      const dbError = new Error("Database error");
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Verify error is thrown
      await expect(TaskModel.findById(1)).rejects.toThrow("Database error");
    });
  });

  describe("findByUserId", () => {
    it("should return tasks for a user", async () => {
      // Setup mock tasks
      const mockTasks = [
        {
          id: 1,
          title: "User Task 1",
          description: "Task description 1",
          status: "pending" as TaskStatus,
          priority: "medium" as TaskPriority,
          due_date: null,
          user_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          title: "User Task 2",
          description: "Task description 2",
          status: "completed" as TaskStatus,
          priority: "high" as TaskPriority,
          due_date: null,
          user_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockTasks,
      });

      // Call the method
      const result = await TaskModel.findByUserId(1);

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC;",
        [1]
      );

      // Verify result
      expect(result).toEqual(mockTasks);
      expect(result.length).toBe(2);
    });

    it("should return empty array when user has no tasks", async () => {
      // Mock empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      // Call the method
      const result = await TaskModel.findByUserId(2);

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC;",
        [2]
      );

      // Verify result
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it("should throw an error if database query fails", async () => {
      // Mock database error
      const dbError = new Error("Database error");
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Verify error is thrown
      await expect(TaskModel.findByUserId(1)).rejects.toThrow("Database error");
    });
  });

  describe("findAll", () => {
    it("should return all tasks with default options", async () => {
      // Setup mock tasks
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

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockTasks,
      });

      // Call the method with default options
      const result = await TaskModel.findAll();

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM tasks"),
        [100, 0] // Default limit and offset
      );
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY created_at DESC"),
        expect.any(Array)
      );

      // Verify result
      expect(result).toEqual(mockTasks);
    });

    it("should apply filtering by status and priority", async () => {
      // Setup mock filtered tasks
      const mockTasks = [
        {
          id: 1,
          title: "Pending High Task",
          description: "Description",
          status: "pending" as TaskStatus,
          priority: "high" as TaskPriority,
          due_date: null,
          user_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockTasks,
      });

      // Call the method with filters
      const result = await TaskModel.findAll({
        status: "pending",
        priority: "high",
      });

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE status = $1 AND priority = $2"),
        ["pending", "high", 100, 0]
      );

      // Verify result
      expect(result).toEqual(mockTasks);
    });

    it("should apply search filter", async () => {
      // Setup mock search results
      const mockTasks = [
        {
          id: 1,
          title: "Test Search",
          description: "This is a test search task",
          status: "pending" as TaskStatus,
          priority: "medium" as TaskPriority,
          due_date: null,
          user_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockTasks,
      });

      // Call the method with search
      const result = await TaskModel.findAll({
        search: "test",
      });

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "WHERE (title ILIKE $1 OR description ILIKE $1)"
        ),
        ["%test%", 100, 0]
      );

      // Verify result
      expect(result).toEqual(mockTasks);
    });

    it("should apply custom sorting and pagination", async () => {
      // Setup mock tasks
      const mockTasks = [
        {
          id: 1,
          title: "Task 1",
          description: "Description 1",
          status: "pending" as TaskStatus,
          priority: "high" as TaskPriority,
          due_date: new Date(),
          user_id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockTasks,
      });

      // Call the method with custom sorting and pagination
      const result = await TaskModel.findAll({
        sort_by: "due_date",
        sort_direction: "ASC",
        limit: 10,
        offset: 20,
      });

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY due_date ASC"),
        [10, 20]
      );
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("LIMIT $1 OFFSET $2"),
        expect.any(Array)
      );

      // Verify result
      expect(result).toEqual(mockTasks);
    });

    it("should apply user_id filter", async () => {
      // Setup mock user tasks
      const mockTasks = [
        {
          id: 1,
          title: "User Task",
          description: "User task description",
          status: "pending" as TaskStatus,
          priority: "medium" as TaskPriority,
          due_date: null,
          user_id: 5,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: mockTasks,
      });

      // Call the method with user filter
      const result = await TaskModel.findAll({
        user_id: 5,
      });

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE user_id = $1"),
        [5, 100, 0]
      );

      // Verify result
      expect(result).toEqual(mockTasks);
    });

    it("should throw an error if database query fails", async () => {
      // Mock database error
      const dbError = new Error("Database error");
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Verify error is thrown
      await expect(TaskModel.findAll()).rejects.toThrow("Database error");
    });
  });

  describe("count", () => {
    it("should return the total count of tasks with no filters", async () => {
      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ count: "10" }],
      });

      // Call the method
      const result = await TaskModel.count();

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith("SELECT COUNT(*) FROM tasks", []);

      // Verify result
      expect(result).toBe(10);
    });

    it("should apply filters when counting tasks", async () => {
      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ count: "3" }],
      });

      // Call the method with filters
      const result = await TaskModel.count({
        status: "pending",
        priority: "high",
        user_id: 1,
      });

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT COUNT(*) FROM tasks WHERE status = $1 AND priority = $2 AND user_id = $3"
        ),
        ["pending", "high", 1]
      );

      // Verify result
      expect(result).toBe(3);
    });

    it("should apply search filter when counting tasks", async () => {
      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ count: "2" }],
      });

      // Call the method with search
      const result = await TaskModel.count({
        search: "test",
      });

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "WHERE (title ILIKE $1 OR description ILIKE $1)"
        ),
        ["%test%"]
      );

      // Verify result
      expect(result).toBe(2);
    });

    it("should return 0 if no results found", async () => {
      // Mock empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ count: "0" }],
      });

      // Call the method
      const result = await TaskModel.count({
        user_id: 999, // Non-existent user
      });

      // Verify result
      expect(result).toBe(0);
    });

    it("should throw an error if database query fails", async () => {
      // Mock database error
      const dbError = new Error("Database error");
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Verify error is thrown
      await expect(TaskModel.count()).rejects.toThrow("Database error");
    });
  });

  describe("update", () => {
    it("should update a task with multiple fields", async () => {
      // Setup update data
      const updateData = {
        title: "Updated Title",
        description: "Updated Description",
        status: "completed" as TaskStatus,
      };

      const mockUpdatedTask = {
        id: 1,
        ...updateData,
        priority: "medium" as TaskPriority,
        due_date: null,
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockUpdatedTask],
      });

      // Call the method
      const result = await TaskModel.update(1, updateData);

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE tasks"),
        expect.arrayContaining([
          "Updated Title",
          "Updated Description",
          "completed",
          1, // Task ID
        ])
      );
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "SET title = $1, description = $2, status = $3"
        ),
        expect.any(Array)
      );
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE id = $4"),
        expect.any(Array)
      );

      // Verify result
      expect(result).toEqual(mockUpdatedTask);
    });

    it("should update a task with a single field", async () => {
      // Setup update data - just the status
      const updateData = {
        status: "in_progress" as TaskStatus,
      };

      const mockUpdatedTask = {
        id: 1,
        title: "Task 1",
        description: "Description",
        status: "in_progress" as TaskStatus,
        priority: "medium" as TaskPriority,
        due_date: null,
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock database response
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockUpdatedTask],
      });

      // Call the method
      const result = await TaskModel.update(1, updateData);

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE tasks"),
        ["in_progress", 1] // Only status and ID
      );
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("SET status = $1"),
        expect.any(Array)
      );

      // Verify result
      expect(result).toEqual(mockUpdatedTask);
    });

    it("should retrieve the task without updates if no fields to update", async () => {
      // Setup empty update data
      const updateData = {};

      const mockTask = {
        id: 1,
        title: "Task 1",
        description: "Description",
        status: "pending" as TaskStatus,
        priority: "medium" as TaskPriority,
        due_date: null,
        user_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock findById response instead of update query
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [mockTask],
      });

      // Call the method
      const result = await TaskModel.update(1, updateData);

      // Verify we called SELECT not UPDATE
      expect(pool.query).toHaveBeenCalledWith(
        "SELECT * FROM tasks WHERE id = $1;",
        [1]
      );

      // Verify result
      expect(result).toEqual(mockTask);
    });

    it("should return null if task is not found", async () => {
      // Setup update data
      const updateData = {
        title: "Updated Title",
      };

      // Mock empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      // Call the method
      const result = await TaskModel.update(999, updateData);

      // Verify SQL was called with correct ID
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE id = $2"),
        expect.arrayContaining([999])
      );

      // Verify result
      expect(result).toBeNull();
    });

    it("should throw an error if database query fails", async () => {
      // Setup update data
      const updateData = {
        title: "Error Task",
      };

      // Mock database error
      const dbError = new Error("Database error");
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Verify error is thrown
      await expect(TaskModel.update(1, updateData)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("delete", () => {
    it("should delete a task and return true if successful", async () => {
      // Mock successful deletion
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 1 }],
      });

      // Call the method
      const result = await TaskModel.delete(1);

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        "DELETE FROM tasks WHERE id = $1 RETURNING id;",
        [1]
      );

      // Verify result
      expect(result).toBe(true);
    });

    it("should return false if task is not found", async () => {
      // Mock empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      // Call the method
      const result = await TaskModel.delete(999);

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        "DELETE FROM tasks WHERE id = $1 RETURNING id;",
        [999]
      );

      // Verify result
      expect(result).toBe(false);
    });

    it("should throw an error if database query fails", async () => {
      // Mock database error
      const dbError = new Error("Database error");
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Verify error is thrown
      await expect(TaskModel.delete(1)).rejects.toThrow("Database error");
    });
  });

  describe("deleteByUserId", () => {
    it("should delete all tasks for a user and return the count", async () => {
      // Mock successful deletion of 5 tasks
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
        rowCount: 5,
      });

      // Call the method
      const result = await TaskModel.deleteByUserId(1);

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        "DELETE FROM tasks WHERE user_id = $1 RETURNING id;",
        [1]
      );

      // Verify result
      expect(result).toBe(5);
    });

    it("should return 0 if no tasks were found for the user", async () => {
      // Mock empty result
      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      // Call the method
      const result = await TaskModel.deleteByUserId(999);

      // Verify SQL and parameters
      expect(pool.query).toHaveBeenCalledWith(
        "DELETE FROM tasks WHERE user_id = $1 RETURNING id;",
        [999]
      );

      // Verify result
      expect(result).toBe(0);
    });

    it("should throw an error if database query fails", async () => {
      // Mock database error
      const dbError = new Error("Database error");
      (pool.query as jest.Mock).mockRejectedValueOnce(dbError);

      // Verify error is thrown
      await expect(TaskModel.deleteByUserId(1)).rejects.toThrow(
        "Database error"
      );
    });
  });
});
