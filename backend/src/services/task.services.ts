import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskModel,
  TaskQueryOptions,
} from "../models/task.model";
import { UserModel } from "../models/user.model";

export class TaskService {
  // Create a new task
  static async createTask(taskData: CreateTaskInput): Promise<Task> {
    try {
      // Check if user exists
      const user = await UserModel.findById(taskData.user_id);
      if (!user) {
        throw new Error("User not found");
      }

      // Create task
      return await TaskModel.create(taskData);
    } catch (error) {
      throw error;
    }
  }

  // Get task by ID
  static async getTaskById(id: number): Promise<Task | null> {
    try {
      return await TaskModel.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Get tasks by user ID
  static async getTasksByUserId(userId: number): Promise<Task[]> {
    try {
      // Check if user exists
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      return await TaskModel.findByUserId(userId);
    } catch (error) {
      throw error;
    }
  }

  // Get all tasks with pagination and filtering
  static async getAllTasks(
    options: TaskQueryOptions = {}
  ): Promise<{ tasks: Task[]; total: number }> {
    try {
      const [tasks, total] = await Promise.all([
        TaskModel.findAll(options),
        TaskModel.count(options),
      ]);

      return { tasks, total };
    } catch (error) {
      throw error;
    }
  }

  // Update task
  static async updateTask(
    id: number,
    taskData: UpdateTaskInput
  ): Promise<Task | null> {
    try {
      // Check if task exists
      const task = await TaskModel.findById(id);
      if (!task) {
        throw new Error("Task not found");
      }

      // If user_id is being updated, check if the new user exists
      if (taskData.user_id && taskData.user_id !== task.user_id) {
        const user = await UserModel.findById(taskData.user_id);
        if (!user) {
          throw new Error("User not found");
        }
      }

      return await TaskModel.update(id, taskData);
    } catch (error) {
      throw error;
    }
  }

  // Delete task
  static async deleteTask(id: number): Promise<boolean> {
    try {
      // Check if task exists
      const task = await TaskModel.findById(id);
      if (!task) {
        throw new Error("Task not found");
      }

      return await TaskModel.delete(id);
    } catch (error) {
      throw error;
    }
  }

  // Delete all tasks for a user
  static async deleteTasksByUserId(userId: number): Promise<number> {
    try {
      // Check if user exists
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      return await TaskModel.deleteByUserId(userId);
    } catch (error) {
      throw error;
    }
  }
}
