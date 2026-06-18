// backend/controllers/taskController.js
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { getSocketIO } from "../utils/socket.js";

export const createTask = async (req, res) => {
  try {
    const { 
      project, title, description, assignedTo, dueDate, 
      priority, type, estimatedHours, dependsOn 
    } = req.body;
    
    if (!project || !title) {
      return res.status(400).json({ error: "project and title are required" });
    }

    // Verify project exists and user has access
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ error: "Project not found" });
    }

    const createdBy = req.user.id;
    const task = await Task.create({
      project,
      title,
      description: description || "",
      assignedTo: assignedTo || null,
      createdBy,
      status: "todo",
      priority: priority || "Medium",
      dueDate: dueDate || null,
      type: type || "Task",
      estimatedHours: estimatedHours || 0,
      dependsOn: dependsOn || [],
    });

    // Update project progress
    await projectDoc.updateProgress();

    // Create notification for assigned user
    if (assignedTo) {
      const notification = new Notification({
        user: assignedTo,
        type: 'task_assigned',
        payload: {
          taskId: task._id,
          taskTitle: task.title,
          projectId: project,
          projectTitle: projectDoc.title,
          assignedBy: req.user.name || req.user.id
        },
        actionUrl: `/task/${task._id}`,
        priority: 'high'
      });
      await notification.save();

      try {
        const io = getSocketIO();
        io.to(`user_${assignedTo}`).emit("newNotification", {
          type: 'task_assigned',
          taskId: task._id,
          taskTitle: task.title,
          projectId: project
        });
      } catch (e) {
        console.warn("Socket emit skipped:", e.message);
      }
    }

    const populated = await Task.findById(task._id)
      .populate("createdBy", "name _id profilePicture")
      .populate("assignedTo", "name _id profilePicture");

    try {
      const io = getSocketIO();
      io.to(`project_${project}`).emit("taskCreated", populated);
    } catch (e) {
      console.warn("Socket emit skipped:", e.message);
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("Create Task Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate("createdBy", "name _id profilePicture")
      .populate("assignedTo", "name _id profilePicture")
      .populate("dependsOn", "title status")
      .sort({ createdAt: 1 });
    
    res.json(tasks);
  } catch (err) {
    console.error("Get Tasks Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("createdBy", "name _id profilePicture")
      .populate("assignedTo", "name _id profilePicture")
      .populate("dependsOn", "title status")
      .populate("comments", "content user createdAt")
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'name profilePicture' }
      });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (err) {
    console.error("Get Task By ID Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const updates = {};
    const allowed = [
      "title", "description", "status", "assignedTo", 
      "priority", "dueDate", "estimatedHours", "type", 
      "dependsOn", "subtasks"
    ];
    
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const task = await Task.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("createdBy", "name _id profilePicture")
      .populate("assignedTo", "name _id profilePicture");

    if (!task) return res.status(404).json({ error: "Task not found" });

    // Update project progress
    const project = await Project.findById(task.project);
    if (project) {
      await project.updateProgress();
    }

    // Create notification for status change
    if (req.body.status && req.body.status === 'done') {
      // Notify creator that task is completed
      const notification = new Notification({
        user: task.createdBy,
        type: 'task_completed',
        payload: {
          taskId: task._id,
          taskTitle: task.title,
          completedBy: req.user.name || req.user.id,
          projectId: task.project
        },
        actionUrl: `/task/${task._id}`,
        priority: 'medium'
      });
      await notification.save();

      try {
        const io = getSocketIO();
        io.to(`user_${task.createdBy}`).emit("newNotification", {
          type: 'task_completed',
          taskId: task._id,
          taskTitle: task.title
        });
      } catch (e) {
        console.warn("Socket emit skipped:", e.message);
      }
    }

    try {
      const io = getSocketIO();
      io.to(`project_${task.project.toString()}`).emit("taskUpdated", task);
    } catch (e) {
      console.warn("Socket emit skipped:", e.message);
    }

    res.json(task);
  } catch (err) {
    console.error("Update Task Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only the task creator can delete this task" });
    }

    await task.deleteOne();

    // Update project progress
    const project = await Project.findById(task.project);
    if (project) {
      await project.updateProgress();
    }

    try {
      const io = getSocketIO();
      io.to(`project_${task.project.toString()}`).emit("taskDeleted", { _id: req.params.id });
    } catch (e) {
      console.warn("Socket emit skipped:", e.message);
    }

    res.json({ message: "Task deleted", _id: req.params.id });
  } catch (err) {
    console.error("Delete Task Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    )
      .populate("createdBy", "name _id profilePicture")
      .populate("assignedTo", "name _id profilePicture");

    if (!task) return res.status(404).json({ error: "Task not found" });

    // Update project progress
    const project = await Project.findById(task.project);
    if (project) {
      await project.updateProgress();
    }

    // Update user stats if task is completed
    if (status === 'done' && task.assignedTo) {
      await Task.updateUserStats(task.assignedTo);
    }

    try {
      const io = getSocketIO();
      io.to(`project_${task.project.toString()}`).emit("taskUpdated", task);
    } catch (e) {
      console.warn("Socket emit skipped:", e.message);
    }

    res.json(task);
  } catch (err) {
    console.error("Update Task Status Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get tasks assigned to current user
export const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ 
      assignedTo: req.user.id,
      status: { $ne: 'done' }
    })
      .populate("createdBy", "name _id profilePicture")
      .populate("assignedTo", "name _id profilePicture")
      .populate("project", "title status")
      .sort({ dueDate: 1, priority: -1 });
    
    res.json(tasks);
  } catch (err) {
    console.error("Get My Tasks Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get task statistics for dashboard
export const getTaskStats = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments({ 
      assignedTo: req.user.id 
    });
    const completedTasks = await Task.countDocuments({ 
      assignedTo: req.user.id,
      status: 'done'
    });
    const inProgressTasks = await Task.countDocuments({ 
      assignedTo: req.user.id,
      status: 'inprogress'
    });
    const overdueTasks = await Task.countDocuments({
      assignedTo: req.user.id,
      status: { $ne: 'done' },
      dueDate: { $lt: new Date() }
    });

    res.json({
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      overdue: overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    });
  } catch (err) {
    console.error("Get Task Stats Error:", err);
    res.status(500).json({ error: err.message });
  }
};