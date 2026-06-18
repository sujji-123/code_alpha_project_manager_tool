// backend/controllers/commentController.js
import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import Notification from "../models/Notification.js";
import { getSocketIO } from "../utils/socket.js";

// Get comments for a task
export const getCommentsByTask = async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate("user", "name _id profilePicture")
      .populate("parentComment", "content user")
      .sort({ createdAt: 1 });
    
    res.json(comments);
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).send("Server Error");
  }
};

// Create a comment on a task
export const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, parentComment } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const comment = new Comment({
      task: taskId,
      project: task.project,
      user: req.user.id,
      content,
      parentComment: parentComment || null,
    });

    await comment.save();

    // Add comment to task's comments array
    task.comments.push(comment._id);
    await task.save();

    // Populate user data
    await comment.populate("user", "name _id profilePicture");
    if (parentComment) {
      await comment.populate("parentComment", "content user");
    }

    // Create notification for task assignee if not the commenter
    if (task.assignedTo && task.assignedTo.toString() !== req.user.id) {
      const notification = new Notification({
        user: task.assignedTo,
        type: 'comment_added',
        payload: {
          taskId: task._id,
          taskTitle: task.title,
          projectId: task.project,
          commenter: req.user.name || req.user.id,
          content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        },
        actionUrl: `/task/${task._id}`,
        priority: 'medium'
      });
      await notification.save();

      try {
        const io = getSocketIO();
        io.to(`user_${task.assignedTo}`).emit("newNotification", {
          type: 'comment_added',
          taskId: task._id,
          taskTitle: task.title,
          commenter: req.user.name || req.user.id
        });
      } catch (e) {
        console.warn("Socket emit skipped:", e.message);
      }
    }

    // Also notify task creator if different from assignee and commenter
    if (task.createdBy.toString() !== req.user.id && 
        task.createdBy.toString() !== task.assignedTo?.toString()) {
      const notification = new Notification({
        user: task.createdBy,
        type: 'comment_added',
        payload: {
          taskId: task._id,
          taskTitle: task.title,
          projectId: task.project,
          commenter: req.user.name || req.user.id
        },
        actionUrl: `/task/${task._id}`,
        priority: 'low'
      });
      await notification.save();
    }

    // Emit socket event
    try {
      const io = getSocketIO();
      io.to(`project_${task.project.toString()}`).emit("commentCreated", {
        comment,
        taskId: task._id
      });
    } catch (e) {
      console.warn("Socket emit skipped:", e.message);
    }

    res.status(201).json(comment);
  } catch (err) {
    console.error("Create comment error:", err);
    res.status(500).send("Server Error");
  }
};

// Update a comment
export const updateComment = async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check if user is the comment author
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to edit this comment" });
    }

    comment.content = content;
    comment.isEdited = true;
    await comment.save();

    await comment.populate("user", "name _id profilePicture");

    // Emit socket event
    try {
      const io = getSocketIO();
      const task = await Task.findById(comment.task);
      if (task) {
        io.to(`project_${task.project.toString()}`).emit("commentUpdated", comment);
      }
    } catch (e) {
      console.warn("Socket emit skipped:", e.message);
    }

    res.json(comment);
  } catch (err) {
    console.error("Update comment error:", err);
    res.status(500).send("Server Error");
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check if user is the comment author
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this comment" });
    }

    // Remove comment from task's comments array
    await Task.findByIdAndUpdate(comment.task, {
      $pull: { comments: comment._id }
    });

    await comment.deleteOne();

    // Emit socket event
    try {
      const io = getSocketIO();
      const task = await Task.findById(comment.task);
      if (task) {
        io.to(`project_${task.project.toString()}`).emit("commentDeleted", {
          commentId: req.params.id,
          taskId: comment.task
        });
      }
    } catch (e) {
      console.warn("Socket emit skipped:", e.message);
    }

    res.json({ message: "Comment deleted", _id: req.params.id });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).send("Server Error");
  }
};

// REMOVED: getDirectMessages, createDirectMessage, getConversations (not needed for project management)