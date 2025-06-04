import { Request, Response } from "express";
import { TaskService } from "../services/task.services";
import {
  CreateTaskInput,
  UpdateTaskInput,
  TaskQueryOptions,
} from "../models/task.model";

export class TaskController {
  // Create a new task
  static async createTask(req: Request, res: Response): Promise<void> {
    try {
      const taskData: CreateTaskInput = req.body;

      // Validate required fields
      if (!taskData.title) {
        res.status(400).json({ message: "Task title is required" });
        return;
      }

      // If user_id is not provided, use the authenticated user ID from JWT
      if (!taskData.user_id && req.user) {
        taskData.user_id = req.user.userId;
      }

      // Validate user_id
      if (!taskData.user_id) {
        res.status(400).json({ message: "User ID is required" });
        return;
      }

      const task = await TaskService.createTask(taskData);
      res.status(201).json(task);
    } catch (error: any) {
      if (error.message === "User not found") {
        res.status(404).json({ message: error.message });
      } else {
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  // Get a task by ID
  static async getTask(req: Request, res: Response): Promise<void> {
    try {
      const taskId = parseInt(req.params.id);

      if (isNaN(taskId)) {
        res.status(400).json({ message: "Invalid task ID" });
        return;
      }

      const task = await TaskService.getTaskById(taskId);

      if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
      }

      res.status(200).json(task);
    } catch (error) {
      console.error("Error getting task:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get tasks for a user
  static async getUserTasks(req: Request, res: Response): Promise<void> {
    try {
      // Get user ID from request params or JWT token
      let userId = parseInt(req.params.userId);

      // If userId is not in params, use the authenticated user ID
      if (isNaN(userId) && req.user) {
        userId = req.user.userId;
      }

      if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      const tasks = await TaskService.getTasksByUserId(userId);
      res.status(200).json(tasks);
    } catch (error: any) {
      if (error.message === "User not found") {
        res.status(404).json({ message: error.message });
      } else {
        console.error("Error getting user tasks:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  // Get all tasks with filtering and pagination
  static async getAllTasks(req: Request, res: Response): Promise<void> {
    try {
      // Parse query parameters
      const options: TaskQueryOptions = {
        status: req.query.status as any,
        priority: req.query.priority as any,
        search: req.query.search as string,
        sort_by: req.query.sort_by as any,
        sort_direction: (req.query.sort_direction as any)?.toUpperCase(),
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
        offset: req.query.offset
          ? parseInt(req.query.offset as string)
          : undefined,
      };

      // If user_id is provided, use it
      if (req.query.user_id) {
        options.user_id = parseInt(req.query.user_id as string);
      }

      const { tasks, total } = await TaskService.getAllTasks(options);

      // Return tasks with pagination metadata
      res.status(200).json({
        data: tasks,
        meta: {
          total,
          limit: options.limit || 100,
          offset: options.offset || 0,
        },
      });
    } catch (error) {
      console.error("Error getting all tasks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Update a task
  static async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const taskId = parseInt(req.params.id);
      const taskData: UpdateTaskInput = req.body;

      if (isNaN(taskId)) {
        res.status(400).json({ message: "Invalid task ID" });
        return;
      }

      const task = await TaskService.updateTask(taskId, taskData);

      if (!task) {
        res.status(404).json({ message: "Task not found" });
        return;
      }

      res.status(200).json(task);
    } catch (error: any) {
      if (
        error.message === "Task not found" ||
        error.message === "User not found"
      ) {
        res.status(404).json({ message: error.message });
      } else {
        console.error("Error updating task:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  // Delete a task
  static async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const taskId = parseInt(req.params.id);

      if (isNaN(taskId)) {
        res.status(400).json({ message: "Invalid task ID" });
        return;
      }

      const deleted = await TaskService.deleteTask(taskId);

      if (deleted) {
        res.status(200).json({ message: "Task deleted successfully" });
      } else {
        res.status(404).json({ message: "Task not found" });
      }
    } catch (error: any) {
      if (error.message === "Task not found") {
        res.status(404).json({ message: error.message });
      } else {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }

  // Delete all tasks for a user
  static async deleteUserTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        res.status(400).json({ message: "Invalid user ID" });
        return;
      }

      const count = await TaskService.deleteTasksByUserId(userId);

      res.status(200).json({
        message: `${count} tasks deleted successfully for user ID: ${userId}`,
      });
    } catch (error: any) {
      if (error.message === "User not found") {
        res.status(404).json({ message: error.message });
      } else {
        console.error("Error deleting user tasks:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  }
}
