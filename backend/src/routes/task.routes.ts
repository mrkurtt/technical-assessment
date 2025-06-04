import { Router } from "express";
import { TaskController } from "../controllers/task.controller";
import { authenticateJWT } from "../middleware/auth.middleware";

const router = Router();

// All task routes require authentication
router.use(authenticateJWT);

// Task CRUD operations
router.post("/", TaskController.createTask);
router.get("/:id", TaskController.getTask);
router.put("/:id", TaskController.updateTask);
router.delete("/:id", TaskController.deleteTask);

// Get all tasks (with filtering and pagination)
router.get("/", TaskController.getAllTasks);

// User-specific task operations
router.get("/user/:userId", TaskController.getUserTasks);
router.delete("/user/:userId", TaskController.deleteUserTasks);

// Get current user's tasks (shorthand)
router.get("/my/tasks", (req, res) => {
  if (req.user && req.user.userId) {
    (req as any).params.userId = req.user.userId.toString();
    return TaskController.getUserTasks(req, res);
  }
  res.status(401).json({ message: "User not authenticated" });
});

export default router;
