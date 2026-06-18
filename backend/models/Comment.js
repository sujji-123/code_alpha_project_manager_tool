// backend/models/Comment.js
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    // NEW: Link to task instead of project
    task: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Task", 
      required: true 
    },
    // NEW: Link to project for context
    project: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Project" 
    },
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    content: { type: String, required: true },
    // NEW: Reply to specific comment (threaded comments)
    parentComment: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Comment" 
    },
    // NEW: Attachments for comments
    attachments: [{
      url: String,
      name: String,
      size: Number
    }],
    // NEW: Edited flag
    isEdited: { type: Boolean, default: false },
    // OLD: receiver, read → REMOVED (not needed for comments)
  },
  { timestamps: true }
);

// NEW: Pre-save middleware to set project from task
commentSchema.pre('save', async function(next) {
  if (!this.project && this.task) {
    const Task = mongoose.model('Task');
    const task = await Task.findById(this.task);
    if (task) {
      this.project = task.project;
    }
  }
  next();
});

// NEW: Index for faster queries
commentSchema.index({ task: 1, createdAt: -1 });
commentSchema.index({ user: 1 });

export default mongoose.model("Comment", commentSchema);