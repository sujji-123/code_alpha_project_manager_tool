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
  getTaskStats,
  assignTask,
  submitTaskForReview,
  approveTask,
  getTasksByStatus
} from "../controllers/taskController.js";

const router = express.Router();

// Task CRUD
router.post("/", auth, createTask);
router.get("/project/:projectId", auth, getTasksByProject);
router.get("/project/:projectId/grouped", auth, getTasksByStatus);
router.get("/my-tasks", auth, getMyTasks);
router.get("/stats", auth, getTaskStats);
router.get("/:id", auth, getTaskById);

// Task updates
router.put("/:id", auth, updateTask);
router.delete("/:id", auth, deleteTask);
router.patch("/:id/status", auth, updateTaskStatus);

// Task assignment and review
router.patch("/:id/assign", auth, assignTask);
router.patch("/:id/submit", auth, submitTaskForReview);
router.patch("/:id/approve", auth, approveTask);

export default router;