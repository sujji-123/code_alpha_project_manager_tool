// backend/routes/ProjectRoutes.js
import express from "express";
import {
  createProject,
  getProjects,
  getMyProjects,
  getTeamProjects,
  updateProject,
  deleteProject,
  getProjectById,
  addTeamMember,
  removeTeamMember
} from "../controllers/projectController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// Project CRUD
router.post("/", auth, createProject);
router.get("/", auth, getProjects);
router.get("/my-projects", auth, getMyProjects);
router.get("/team-projects", auth, getTeamProjects); // NEW: Get projects where user is team member
router.get("/:id", auth, getProjectById);

// Project updates
router.put("/:id", auth, updateProject);
router.delete("/:id", auth, deleteProject);

// Team management
router.post("/:id/team", auth, addTeamMember); // NEW: Add team member
router.delete("/:id/team", auth, removeTeamMember); // NEW: Remove team member

export default router;