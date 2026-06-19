import Task from "../models/Task.js";
import Project from "../models/Project.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { getSocketIO } from "../utils/socket.js";

// Safe inline method to update project progress and phases dynamically
const updateProjectProgressSafe = async (projectId) => {
  try {
    const tasks = await Task.find({ project: projectId });
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    let statusUpdate = {};
    if (total > 0 && total === completed) {
      statusUpdate.status = 'Completed';
    } else if (total > 0 && completed < total) {
      statusUpdate.status = 'Active';
    }

    await Project.findByIdAndUpdate(projectId, { progress, ...statusUpdate });
  } catch (e) {
    console.error("Error safely updating progress:", e);
  }
};

export const createTask = async (req, res) => {
  try {
    const { 
      project, title, description, assignedTo, dueDate, 
      priority, type, estimatedHours, dependsOn 
    } = req.body;
    
    if (!project || !title) {
      return res.status(400).json({ error: "project and title are required" });
    }

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

    await updateProjectProgressSafe(project);

    if (assignedTo) {
      const notification = new Notification({
        user: assignedTo,
        type: 'task_assigned',
        message: `You have been assigned a new task: "${task.title}"`,
        payload: {
          taskId: task._id,
          taskTitle: task.title,
          projectId: project,
          projectTitle: projectDoc.title,
          assignedBy: req.user.name || req.user.id,
          action: 'start_working'
        },
        actionUrl: `/task/${task._id}`,
        priority: 'high',
        read: false
      });
      await notification.save();

      try {
        const io = getSocketIO();
        io.to(`user_${assignedTo}`).emit("newNotification", {
          type: 'task_assigned',
          message: `You have been assigned: "${task.title}"`,
          payload: {
            taskId: task._id,
            taskTitle: task.title,
            projectId: project,
            projectTitle: projectDoc.title,
            action: 'start_working'
          },
          notificationId: notification._id
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

    await updateProjectProgressSafe(task.project);

    if (req.body.status && req.body.status === 'done') {
      const notification = new Notification({
        user: task.createdBy,
        type: 'task_completed',
        message: `Task "${task.title}" has been completed`,
        payload: {
          taskId: task._id,
          taskTitle: task.title,
          completedBy: req.user.name || req.user.id,
          projectId: task.project
        },
        actionUrl: `/task/${task._id}`,
        priority: 'medium',
        read: false
      });
      await notification.save();

      try {
        const io = getSocketIO();
        io.to(`user_${task.createdBy}`).emit("newNotification", {
          type: 'task_completed',
          message: `Task "${task.title}" has been completed`,
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

    const projectId = task.project;
    await task.deleteOne();

    await updateProjectProgressSafe(projectId);

    try {
      const io = getSocketIO();
      io.to(`project_${projectId.toString()}`).emit("taskDeleted", { _id: req.params.id });
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

    await updateProjectProgressSafe(task.project);

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

export const getTaskStats = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments({ assignedTo: req.user.id });
    const completedTasks = await Task.countDocuments({ assignedTo: req.user.id, status: 'done' });
    const inProgressTasks = await Task.countDocuments({ assignedTo: req.user.id, status: 'inprogress' });
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

// FIXED: assignTask - adds user to project team when assigning
export const assignTask = async (req, res) => {
  try {
    const { userId } = req.body;
    const task = await Task.findById(req.params.id);
    
    if (!task) return res.status(404).json({ error: "Task not found" });
    
    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ error: "Project not found" });
    
    if (project.createdBy.toString() !== req.user.id && project.projectManager.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only project manager can assign tasks" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // ✅ CRITICAL FIX: Add user to project team if not already a member
    if (!project.teamMembers.includes(userId)) {
      project.teamMembers.push(userId);
      await project.save();
      console.log(`✅ User ${user.name} (${userId}) added to project team: ${project.title}`);
    }
    
    task.assignedTo = userId;
    await task.save();
    
    const notification = new Notification({
      user: userId,
      type: 'task_assigned',
      message: `You have been assigned a new task: "${task.title}" in project "${project.title}"`,
      payload: {
        taskId: task._id,
        taskTitle: task.title,
        projectId: project._id,
        projectTitle: project.title,
        assignedBy: req.user.name || req.user.id,
        action: 'start_working'
      },
      actionUrl: `/task-board`,
      priority: 'high',
      read: false
    });
    await notification.save();
    console.log(`✅ Notification created for user ${userId}`);
    
    const populatedTask = await Task.findById(task._id)
      .populate("createdBy", "name _id profilePicture")
      .populate("assignedTo", "name _id profilePicture");
    
    try {
      const io = getSocketIO();
      io.to(`user_${userId}`).emit("newNotification", {
        type: 'task_assigned',
        message: `You have been assigned: "${task.title}"`,
        payload: {
          taskId: task._id,
          taskTitle: task.title,
          projectId: project._id,
          projectTitle: project.title,
          action: 'start_working'
        },
        notificationId: notification._id
      });
      io.to(`project_${task.project.toString()}`).emit("taskUpdated", populatedTask);
      console.log(`✅ Socket events emitted for task assignment`);
    } catch (e) {
      console.warn("Socket emit skipped:", e.message);
    }
    
    res.json(populatedTask);
  } catch (err) {
    console.error("Assign Task Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const submitTaskForReview = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) return res.status(404).json({ error: "Task not found" });
    
    if (task.assignedTo.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only assigned team member can submit this task" });
    }
    
    task.status = 'review';
    await task.save();
    
    const project = await Project.findById(task.project);
    const notification = new Notification({
      user: project.projectManager,
      type: 'task_submitted',
      message: `Task "${task.title}" has been submitted for review by ${req.user.name}`,
      payload: {
        taskId: task._id,
        taskTitle: task.title,
        projectId: project._id,
        projectTitle: project.title,
        submittedBy: req.user.name || req.user.id,
        action: 'review_task'
      },
      actionUrl: `/task-board`,
      priority: 'high',
      read: false
    });
    await notification.save();
    
    const populatedTask = await Task.findById(task._id)
      .populate("createdBy", "name _id profilePicture")
      .populate("assignedTo", "name _id profilePicture");
    
    try {
      const io = getSocketIO();
      io.to(`user_${project.projectManager}`).emit("newNotification", {
        type: 'task_submitted',
        message: `Task "${task.title}" submitted for review`,
        payload: {
          taskId: task._id,
          taskTitle: task.title,
          projectId: project._id,
          action: 'review_task'
        }
      });
      io.to(`project_${task.project.toString()}`).emit("taskUpdated", populatedTask);
    } catch (e) {
      console.warn("Socket emit skipped:", e.message);
    }
    
    res.json(populatedTask);
  } catch (err) {
    console.error("Submit Task Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const approveTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) return res.status(404).json({ error: "Task not found" });
    
    const project = await Project.findById(task.project);
    if (!project) return res.status(404).json({ error: "Project not found" });
    
    if (project.createdBy.toString() !== req.user.id && project.projectManager.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only project manager can approve tasks" });
    }
    
    task.status = 'done';
    task.completedAt = Date.now();
    await task.save();
    
    if (task.assignedTo) {
      await Task.updateUserStats(task.assignedTo);
    }
    
    await updateProjectProgressSafe(project._id);
    
    if (task.assignedTo) {
      const notification = new Notification({
        user: task.assignedTo,
        type: 'task_approved',
        message: `Your task "${task.title}" has been approved!`,
        payload: {
          taskId: task._id,
          taskTitle: task.title,
          projectId: project._id,
          projectTitle: project.title,
          approvedBy: req.user.name || req.user.id
        },
        actionUrl: `/task/${task._id}`,
        priority: 'medium',
        read: false
      });
      await notification.save();
      
      try {
        const io = getSocketIO();
        io.to(`user_${task.assignedTo}`).emit("newNotification", {
          type: 'task_approved',
          message: `Your task "${task.title}" has been approved!`,
          taskId: task._id,
          taskTitle: task.title,
          projectId: project._id
        });
      } catch (e) {
        console.warn("Socket emit skipped:", e.message);
      }
    }
    
    const populatedTask = await Task.findById(task._id)
      .populate("createdBy", "name _id profilePicture")
      .populate("assignedTo", "name _id profilePicture");
    
    try {
      const io = getSocketIO();
      io.to(`project_${task.project.toString()}`).emit("taskUpdated", populatedTask);
      io.to(`project_${task.project.toString()}`).emit("projectUpdated", project);
    } catch (e) {
      console.warn("Socket emit skipped:", e.message);
    }
    
    res.json(populatedTask);
  } catch (err) {
    console.error("Approve Task Error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getTasksByStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.find({ project: projectId })
      .populate("createdBy", "name _id profilePicture")
      .populate("assignedTo", "name _id profilePicture")
      .sort({ createdAt: 1 });
    
    const groupedTasks = {
      todo: tasks.filter(t => t.status === 'todo'),
      inprogress: tasks.filter(t => t.status === 'inprogress'),
      review: tasks.filter(t => t.status === 'review'),
      done: tasks.filter(t => t.status === 'done')
    };
    
    res.json(groupedTasks);
  } catch (err) {
    console.error("Get Tasks By Status Error:", err);
    res.status(500).json({ error: err.message });
  }
};