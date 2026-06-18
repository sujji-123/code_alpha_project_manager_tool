// backend/routes/taskRoutes.js
import express from "express";
import auth from "../middleware/authMiddleware.js";
import { 
  createTask, 
  getTasksByProject, 
  getTaskById,
  updateTask, 
  deleteTask, 
  updateTaskStatus,
  getMyTasks,
  getTaskStats
} from "../controllers/taskController.js";

const router = express.Router();

// Task CRUD
router.post("/", auth, createTask);
router.get("/project/:projectId", auth, getTasksByProject);
router.get("/my-tasks", auth, getMyTasks); // NEW: Get tasks assigned to current user
router.get("/stats", auth, getTaskStats); // NEW: Get task statistics
router.get("/:id", auth, getTaskById); // NEW: Get single task with details

// Task updates
router.put("/:id", auth, updateTask);
router.delete("/:id", auth, deleteTask);
router.patch("/:id/status", auth, updateTaskStatus);

export default router;