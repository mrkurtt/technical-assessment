import {
  up as createUsersTable,
  down as dropUsersTable,
} from "./create_users_table";
import {
  up as createTasksTable,
  down as dropTasksTable,
} from "./create_tasks_table";
import { pool } from "../src/utils/db";

type MigrationFunction = () => Promise<void>;

interface Migration {
  name: string;
  up: MigrationFunction;
  down: MigrationFunction;
}

// Add all migrations here in the order they should be applied
const migrations: Migration[] = [
  {
    name: "create_users_table",
    up: createUsersTable,
    down: dropUsersTable,
  },
  {
    name: "create_tasks_table",
    up: createTasksTable,
    down: dropTasksTable,
  },
  // Add more migrations as they are created
  // { name: 'create_tasks_table', up: createTasksTable, down: dropTasksTable },
];

// Run all migrations in sequence
async function runMigrations(direction: "up" | "down"): Promise<void> {
  console.log(`Running migrations ${direction}...`);

  try {
    // Create migration tracking table if it doesn't exist
    await createMigrationTable();

    if (direction === "up") {
      // Run migrations in order (first to last)
      for (const migration of migrations) {
        const isApplied = await isMigrationApplied(migration.name);

        if (!isApplied) {
          console.log(`Applying migration: ${migration.name}`);
          await migration.up();
          await markMigrationAsApplied(migration.name);
          console.log(`Migration applied: ${migration.name}`);
        } else {
          console.log(`Migration already applied: ${migration.name}`);
        }
      }
    } else {
      // Run migrations in reverse order (last to first)
      for (const migration of [...migrations].reverse()) {
        const isApplied = await isMigrationApplied(migration.name);

        if (isApplied) {
          console.log(`Reverting migration: ${migration.name}`);
          await migration.down();
          await markMigrationAsReverted(migration.name);
          console.log(`Migration reverted: ${migration.name}`);
        } else {
          console.log(`Migration not applied: ${migration.name}`);
        }
      }
    }

    console.log("All migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    // Close the pool after all migrations are done
    await pool.end();
  }
}

// Create a table to track applied migrations
async function createMigrationTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
  } catch (error) {
    console.error("Failed to create migrations table:", error);
    throw error;
  }
}

// Check if a migration has been applied
async function isMigrationApplied(name: string): Promise<boolean> {
  try {
    const result = await pool.query(
      "SELECT * FROM migrations WHERE name = $1",
      [name]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Failed to check migration status for ${name}:`, error);
    throw error;
  }
}

// Mark a migration as applied
async function markMigrationAsApplied(name: string): Promise<void> {
  try {
    await pool.query(
      "INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
      [name]
    );
  } catch (error) {
    console.error(`Failed to mark migration as applied for ${name}:`, error);
    throw error;
  }
}

// Mark a migration as reverted
async function markMigrationAsReverted(name: string): Promise<void> {
  try {
    await pool.query("DELETE FROM migrations WHERE name = $1", [name]);
  } catch (error) {
    console.error(`Failed to mark migration as reverted for ${name}:`, error);
    throw error;
  }
}

// Parse command line arguments
const direction = process.argv[2] === "down" ? "down" : "up";

// Run migrations
runMigrations(direction)
  .then(() => {
    console.log("Migration script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });
