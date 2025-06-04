import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import userRoutes from "./routes/user.routes";
import taskRoutes from "./routes/task.routes";
import { pool, testConnection } from "./utils/db";
import { setupSwagger } from "../docs/swagger";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Swagger
setupSwagger(app);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);

// Health check route
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Test database connection
app.get("/api/db-test", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.status(200).json({
      status: "OK",
      message: "Database connection successful",
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({
      status: "ERROR",
      message: "Database connection failed",
    });
  }
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `API Documentation available at http://localhost:${PORT}/api-docs`
  );

  // Test database connection on startup
  await testConnection();
});
