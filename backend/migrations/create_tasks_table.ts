import { Pool } from "pg";
import { pool } from "../src/utils/db";

/**
 * Migration to create the tasks table
 */
export async function up(): Promise<void> {
  const client = await pool.connect();

  try {
    // Begin transaction
    await client.query("BEGIN");

    // Create tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        due_date TIMESTAMP WITH TIME ZONE,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create index on user_id for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    `);

    // Create index on status for filtering
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    `);

    // Create index on due_date for sorting
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    `);

    // Create trigger for automatic timestamp updates
    // Reuse the update_timestamp function created in the users migration
    await client.query(`
      DROP TRIGGER IF EXISTS tasks_update_timestamp ON tasks;
      CREATE TRIGGER tasks_update_timestamp
      BEFORE UPDATE ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    `);

    // Commit transaction
    await client.query("COMMIT");

    console.log("Migration up: tasks table created successfully");
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
 * Migration to drop the tasks table
 */
export async function down(): Promise<void> {
  const client = await pool.connect();

  try {
    // Begin transaction
    await client.query("BEGIN");

    // Drop trigger
    await client.query(`
      DROP TRIGGER IF EXISTS tasks_update_timestamp ON tasks;
    `);

    // Drop indexes
    await client.query(`
      DROP INDEX IF EXISTS idx_tasks_user_id;
      DROP INDEX IF EXISTS idx_tasks_status;
      DROP INDEX IF EXISTS idx_tasks_due_date;
    `);

    // Drop table
    await client.query(`
      DROP TABLE IF EXISTS tasks;
    `);

    // Commit transaction
    await client.query("COMMIT");

    console.log("Migration down: tasks table dropped successfully");
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
