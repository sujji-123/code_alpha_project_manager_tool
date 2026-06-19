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
  removeTeamMember,
  getPublicProjects
} from "../controllers/projectController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

// PUBLIC route for the landing page (no auth required)
router.get("/public", getPublicProjects);

// Project CRUD
router.post("/", auth, createProject);
router.get("/", auth, getProjects);
router.get("/my-projects", auth, getMyProjects);
router.get("/team-projects", auth, getTeamProjects); 
router.get("/:id", auth, getProjectById);

// Project updates
router.put("/:id", auth, updateProject);
router.delete("/:id", auth, deleteProject);

// Team management
router.post("/:id/team", auth, addTeamMember); 
router.delete("/:id/team", auth, removeTeamMember); 

export default router;