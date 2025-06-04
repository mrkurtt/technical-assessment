import { config } from "dotenv";
import { pool } from "../utils/db";

config();

// User interface
export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

// User creation interface (without id and timestamps)
export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
}

// User update interface (all fields optional)
export interface UpdateUserInput {
  username?: string;
  email?: string;
  password?: string;
}

// User model class with database operations
export class UserModel {
  // Create a new user
  static async create(userData: CreateUserInput): Promise<User> {
    const { username, email, password } = userData;
    const query = `
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const result = await pool.query(query, [username, email, password]);
    return result.rows[0];
  }

  // Get user by ID
  static async findById(id: number): Promise<User | null> {
    const query = "SELECT * FROM users WHERE id = $1;";
    const result = await pool.query(query, [id]);

    return result.rows.length ? result.rows[0] : null;
  }

  // Get user by email
  static async findByEmail(email: string): Promise<User | null> {
    const query = "SELECT * FROM users WHERE email = $1;";
    const result = await pool.query(query, [email]);

    return result.rows.length ? result.rows[0] : null;
  }

  // Get all users
  static async findAll(): Promise<User[]> {
    const query = "SELECT * FROM users ORDER BY created_at DESC;";
    const result = await pool.query(query);

    return result.rows;
  }

  // Update user
  static async update(
    id: number,
    userData: UpdateUserInput
  ): Promise<User | null> {
    // Build the SET part of the query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(userData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    // Add updated_at timestamp
    updates.push(`updated_at = NOW()`);

    // If no fields to update, return the user as is
    if (updates.length === 1) {
      return this.findById(id);
    }

    // Add the ID as the last parameter
    values.push(id);

    const query = `
      UPDATE users
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

    const result = await pool.query(query, values);
    return result.rows.length ? result.rows[0] : null;
  }

  // Delete user
  static async delete(id: number): Promise<boolean> {
    const query = "DELETE FROM users WHERE id = $1 RETURNING id;";
    const result = await pool.query(query, [id]);

    return result.rows.length > 0;
  }
}
