import { Pool } from "pg";
import { pool } from "../src/utils/db";

/**
 * Migration to create the users table and add timestamp trigger
 */
export async function up(): Promise<void> {
  const client = await pool.connect();

  try {
    // Begin transaction
    await client.query("BEGIN");

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create function for automatic timestamp updates
    await client.query(`
      CREATE OR REPLACE FUNCTION update_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger for automatic timestamp updates
    await client.query(`
      DROP TRIGGER IF EXISTS users_update_timestamp ON users;
      CREATE TRIGGER users_update_timestamp
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    `);

    // Commit transaction
    await client.query("COMMIT");

    console.log("Migration up: users table created successfully");
  } catch (error) {
    // Rollback transaction on error
    await client.query("ROLLBACK");
    console.error("Migration up failed:", error);
    throw error;
  } finally {
    // Release client back to pool
    client.release();
  }
}

/**
 * Migration to drop the users table
 */
export async function down(): Promise<void> {
  const client = await pool.connect();

  try {
    // Begin transaction
    await client.query("BEGIN");

    // Drop trigger
    await client.query(`
      DROP TRIGGER IF EXISTS users_update_timestamp ON users;
    `);

    // Drop table
    await client.query(`
      DROP TABLE IF EXISTS users;
    `);

    // Commit transaction
    await client.query("COMMIT");

    console.log("Migration down: users table dropped successfully");
  } catch (error) {
    // Rollback transaction on error
    await client.query("ROLLBACK");
    console.error("Migration down failed:", error);
    throw error;
  } finally {
    // Release client back to pool
    client.release();
  }
}

// Run migration if file is executed directly
if (require.main === module) {
  up()
    .then(() => {
      console.log("Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
