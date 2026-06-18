// backend/routes/commentRoutes.js
import express from "express";
import { 
  getCommentsByTask,
  createComment,
  updateComment,
  deleteComment
} from "../controllers/commentController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// Task comments (replacing project messages)
router.get("/task/:taskId", auth, getCommentsByTask);
router.post("/task/:taskId", auth, createComment);

// Comment management
router.put("/:id", auth, updateComment);
router.delete("/:id", auth, deleteComment);

export default router;