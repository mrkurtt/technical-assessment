import { config } from "dotenv";
import { pool } from "../utils/db";

config();

// Task status types
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

// Task priority types
export type TaskPriority = "low" | "medium" | "high" | "urgent";

// Task interface
export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: Date | null;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

// Task creation interface (without id and timestamps)
export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: Date | null;
  user_id: number;
}

// Task update interface (all fields optional)
export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: Date | null;
  user_id?: number;
}

// Task query options
export interface TaskQueryOptions {
  status?: TaskStatus;
  priority?: TaskPriority;
  user_id?: number;
  search?: string;
  sort_by?: "created_at" | "updated_at" | "due_date" | "priority";
  sort_direction?: "ASC" | "DESC";
  limit?: number;
  offset?: number;
}

// Task model class with database operations
export class TaskModel {
  // Create a new task
  static async create(taskData: CreateTaskInput): Promise<Task> {
    const { title, description, status, priority, due_date, user_id } =
      taskData;

    const query = `
      INSERT INTO tasks (
        title, 
        description, 
        status, 
        priority, 
        due_date, 
        user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const values = [
      title,
      description || null,
      status || "pending",
      priority || "medium",
      due_date || null,
      user_id,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get task by ID
  static async findById(id: number): Promise<Task | null> {
    const query = "SELECT * FROM tasks WHERE id = $1;";
    const result = await pool.query(query, [id]);

    return result.rows.length ? result.rows[0] : null;
  }

  // Get tasks by user ID
  static async findByUserId(userId: number): Promise<Task[]> {
    const query =
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC;";
    const result = await pool.query(query, [userId]);

    return result.rows;
  }

  // Get all tasks with filter options
  static async findAll(options: TaskQueryOptions = {}): Promise<Task[]> {
    const {
      status,
      priority,
      user_id,
      search,
      sort_by = "created_at",
      sort_direction = "DESC",
      limit = 100,
      offset = 0,
    } = options;

    // Build WHERE clause based on filter options
    const whereConditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (priority) {
      whereConditions.push(`priority = $${paramIndex}`);
      values.push(priority);
      paramIndex++;
    }

    if (user_id) {
      whereConditions.push(`user_id = $${paramIndex}`);
      values.push(user_id);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(
        `(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
      );
      values.push(`%${search}%`);
      paramIndex++;
    }

    // Build the complete query
    let query = "SELECT * FROM tasks";

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    // Add sorting
    query += ` ORDER BY ${sort_by} ${sort_direction}`;

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);
    return result.rows;
  }

  // Count tasks (for pagination)
  static async count(options: TaskQueryOptions = {}): Promise<number> {
    const { status, priority, user_id, search } = options;

    // Build WHERE clause based on filter options
    const whereConditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (priority) {
      whereConditions.push(`priority = $${paramIndex}`);
      values.push(priority);
      paramIndex++;
    }

    if (user_id) {
      whereConditions.push(`user_id = $${paramIndex}`);
      values.push(user_id);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(
        `(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
      );
      values.push(`%${search}%`);
      paramIndex++;
    }

    // Build the complete query
    let query = "SELECT COUNT(*) FROM tasks";

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count) || 0;
  }

  // Update task
  static async update(
    id: number,
    taskData: UpdateTaskInput
  ): Promise<Task | null> {
    // Build the SET part of the query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(taskData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    // If no fields to update, return the task as is
    if (updates.length === 0) {
      return this.findById(id);
    }

    // Add the ID as the last parameter
    values.push(id);

    const query = `
      UPDATE tasks
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows.length ? result.rows[0] : null;
  }

  // Delete task
  static async delete(id: number): Promise<boolean> {
    const query = "DELETE FROM tasks WHERE id = $1 RETURNING id;";
    const result = await pool.query(query, [id]);

    return result.rows.length > 0;
  }

  // Delete all tasks for a user
  static async deleteByUserId(userId: number): Promise<number> {
    const query = "DELETE FROM tasks WHERE user_id = $1 RETURNING id;";
    const result = await pool.query(query, [userId]);

    return result.rowCount || 0;
  }
}
