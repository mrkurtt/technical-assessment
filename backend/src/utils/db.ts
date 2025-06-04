import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create and export a single instance of the database pool
export const pool = new Pool({
  user: process.env.DB_USER || "developer",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "taskdb",
  password: process.env.DB_PASSWORD || "localdev",
  port: parseInt(process.env.DB_PORT || "5432"),
});

// Error handling for the pool
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Function to test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();
    console.log("Database connection successful:", result.rows[0].now);
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
};
