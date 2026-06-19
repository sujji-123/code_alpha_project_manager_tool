// backend/controllers/projectController.js
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { getSocketIO } from "../utils/socket.js";

// NEW: Get public available projects for Landing Page
export const getPublicProjects = async (req, res) => {
  try {
    const projects = await Project.find({ status: { $in: ['Active', 'Planning'] } })
      .populate("projectManager", "name profilePicture")
      .sort({ createdAt: -1 })
      .limit(6);
    res.json(projects);
  } catch (err) {
    console.error("getPublicProjects:", err);
    res.status(500).send("Server Error");
  }
};

// Create a new project
export const createProject = async (req, res) => {
  try {
    const { title, description, budget, startDate, endDate, priority, teamMembers, tags } = req.body;
    
    const project = new Project({
      createdBy: req.user.id,
      projectManager: req.user.id,
      title,
      description: description || "",
      budget: budget || 0,
      status: "Planning",
      priority: priority || "Medium",
      startDate: startDate || Date.now(),
      endDate: endDate || null,
      teamMembers: teamMembers || [],
      tags: tags || [],
      progress: 0,
    });
    
    await project.save();
    await project.populate("createdBy", "name email");
    await project.populate("teamMembers", "name email");

    const io = getSocketIO();
    
    if (teamMembers && teamMembers.length > 0) {
      const notifications = teamMembers.map(memberId => ({
        user: memberId,
        type: 'project_created',
        payload: {
          projectId: project._id,
          projectTitle: project.title,
          createdBy: req.user.name || req.user.id
        },
        actionUrl: `/project/${project._id}`,
        priority: 'high'
      }));
      
      await Notification.insertMany(notifications);
      
      teamMembers.forEach(memberId => {
        io.to(`user_${memberId}`).emit("newNotification", {
          type: 'project_created',
          projectId: project._id,
          projectTitle: project.title
        });
      });
    }

    io.to(`project_${project._id}`).emit("projectCreated", project);
    
    res.status(201).json(project);
  } catch (err) {
    console.error("createProject:", err);
    res.status(500).send("Server Error");
  }
};

// Get all projects with filters
export const getProjects = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    let filter = {};
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(filter)
      .populate("createdBy", "name email profilePicture")
      .populate("projectManager", "name email profilePicture")
      .populate("teamMembers", "name email profilePicture")
      .sort({ createdAt: -1 });
    
    res.json(projects);
  } catch (err) {
    console.error("getProjects:", err);
    res.status(500).send("Server Error");
  }
};

// Get projects created by the current user
export const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ 
      $or: [
        { createdBy: req.user.id },
        { projectManager: req.user.id },
        { teamMembers: req.user.id }
      ]
    })
      .populate("createdBy", "name email profilePicture")
      .populate("projectManager", "name email profilePicture")
      .populate("teamMembers", "name email profilePicture")
      .sort({ updatedAt: -1 });
    
    res.json(projects);
  } catch (err) {
    console.error("getMyProjects:", err);
    res.status(500).send("Server Error");
  }
};

// Get projects where user is a team member
export const getTeamProjects = async (req, res) => {
  try {
    const projects = await Project.find({ 
      teamMembers: req.user.id,
      status: { $ne: 'Completed' }
    })
      .populate("createdBy", "name email profilePicture")
      .populate("projectManager", "name email profilePicture")
      .populate("teamMembers", "name email profilePicture")
      .sort({ updatedAt: -1 });
    
    res.json(projects);
  } catch (err) {
    console.error("getTeamProjects:", err);
    res.status(500).send("Server Error");
  }
};

// Get project by ID
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("createdBy", "name email profilePicture")
      .populate("projectManager", "name email profilePicture")
      .populate("teamMembers", "name email profilePicture");

    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }
    
    const tasks = await Task.find({ project: project._id });
    const taskStats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inprogress: tasks.filter(t => t.status === 'inprogress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length,
    };
    
    res.json({ ...project.toObject(), taskStats });
  } catch (err) {
    console.error("getProjectById Error:", err.message);
    res.status(500).send("Server Error");
  }
};

// Update project
export const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const updates = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ msg: "Project not found" });

    if (String(project.createdBy) !== String(req.user.id) && 
        String(project.projectManager) !== String(req.user.id)) {
      return res.status(403).json({ msg: "Forbidden: not your project" });
    }

    const allowed = [
      "title", "description", "budget", "status", "priority", 
      "startDate", "endDate", "teamMembers", "tags"
    ];
    
    allowed.forEach((k) => {
      if (updates[k] !== undefined) project[k] = updates[k];
    });

    project.activityLog.push({
      action: `Project updated by ${req.user.name || req.user.id}`,
      user: req.user.id,
      timestamp: new Date()
    });

    await project.save();
    
    const populated = await Project.findById(projectId)
      .populate("createdBy", "name email")
      .populate("projectManager", "name email")
      .populate("teamMembers", "name email");

    try {
      const io = getSocketIO();
      io.to(`project_${projectId}`).emit("projectUpdated", populated);
    } catch (e) {
      console.warn("Socket emit skipped:", e.message);
    }

    res.json(populated);
  } catch (err) {
    console.error("updateProject:", err);
    res.status(500).send("Server Error");
  }
};

// Delete project
export const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ msg: "Project not found" });

    if (String(project.createdBy) !== String(req.user.id)) {
      return res.status(403).json({ msg: "Forbidden: only creator can delete this project" });
    }

    await Task.deleteMany({ project: projectId });
    await Project.findByIdAndDelete(projectId);
    
    res.json({ msg: "Project and all associated tasks deleted" });
  } catch (err) {
    console.error("deleteProject:", err);
    res.status(500).send("Server Error");
  }
};

// Add team member to project
export const addTeamMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) return res.status(404).json({ msg: "Project not found" });
    
    if (String(project.createdBy) !== String(req.user.id) && 
        String(project.projectManager) !== String(req.user.id)) {
      return res.status(403).json({ msg: "Forbidden: not your project" });
    }

    if (project.teamMembers.includes(userId)) {
      return res.status(400).json({ msg: "User already in team" });
    }

    project.teamMembers.push(userId);
    await project.save();

    await User.findByIdAndUpdate(userId, {
      $addToSet: { assignedProjects: project._id }
    });

    const user = await User.findById(userId);
    const notification = new Notification({
      user: userId,
      type: 'team_member_added',
      payload: {
        projectId: project._id,
        projectTitle: project.title,
        addedBy: req.user.name || req.user.id
      },
      actionUrl: `/project/${project._id}`,
      priority: 'high'
    });
    await notification.save();

    try {
      const io = getSocketIO();
      io.to(`user_${userId}`).emit("newNotification", {
        type: 'team_member_added',
        projectId: project._id,
        projectTitle: project.title
      });
    } catch (e) {
      console.warn("Socket emit skipped:", e.message);
    }

    const populated = await Project.findById(project._id)
      .populate("teamMembers", "name email profilePicture");

    res.json(populated);
  } catch (err) {
    console.error("addTeamMember:", err);
    res.status(500).send("Server Error");
  }
};

// Remove team member from project
export const removeTeamMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) return res.status(404).json({ msg: "Project not found" });
    
    if (String(project.createdBy) !== String(req.user.id) && 
        String(project.projectManager) !== String(req.user.id)) {
      return res.status(403).json({ msg: "Forbidden: not your project" });
    }

    project.teamMembers = project.teamMembers.filter(
      id => id.toString() !== userId
    );
    await project.save();

    await User.findByIdAndUpdate(userId, {
      $pull: { assignedProjects: project._id }
    });

    const populated = await Project.findById(project._id)
      .populate("teamMembers", "name email profilePicture");

    res.json(populated);
  } catch (err) {
    console.error("removeTeamMember:", err);
    res.status(500).send("Server Error");
  }
};