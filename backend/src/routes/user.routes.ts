import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticateJWT } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.post("/register", UserController.register);
router.post("/login", UserController.login);

// Protected routes (require authentication)
router.get("/profile/:id", authenticateJWT, UserController.getProfile);
router.get("/", authenticateJWT, UserController.getAllUsers);
router.put("/:id", authenticateJWT, UserController.updateUser);
router.delete("/:id", authenticateJWT, UserController.deleteUser);

export default router;
