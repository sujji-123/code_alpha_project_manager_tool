// backend/models/Project.js
import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    // OLD: client → NEW: createdBy (Project Manager)
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    // NEW: Project management specific fields
    status: { 
      type: String, 
      enum: ['Planning', 'Active', 'In Review', 'Completed', 'On Hold'], 
      default: 'Planning' 
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    progress: { 
      type: Number, 
      min: 0, 
      max: 100, 
      default: 0 
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    // Team members assigned to this project
    teamMembers: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }],
    // Project Manager (same as createdBy, but explicitly defined)
    projectManager: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    // OLD: budget → NEW: can keep but as project budget/estimate
    budget: { type: Number, default: 0 },
    // OLD: assignedFreelancer → REMOVED
    // NEW: Tags/Categories
    tags: { type: [String], default: [] },
    // NEW: Attachments
    attachments: [{
      url: String,
      name: String,
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      uploadedAt: { type: Date, default: Date.now }
    }],
    // NEW: Activity log
    activityLog: [{
      action: String,
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      timestamp: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

// NEW: Method to update project progress based on tasks
ProjectSchema.methods.updateProgress = async function() {
  const Task = mongoose.model('Task');
  const tasks = await Task.find({ project: this._id });
  
  if (tasks.length === 0) {
    this.progress = 0;
    return;
  }
  
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  this.progress = Math.round((completedTasks / tasks.length) * 100);
  
  // Update project status based on progress
  if (this.progress === 100) {
    this.status = 'Completed';
  } else if (this.progress > 0 && this.status === 'Planning') {
    this.status = 'Active';
  }
  
  await this.save();
};

// NEW: Pre-save middleware to set projectManager if not set
ProjectSchema.pre('save', function(next) {
  if (!this.projectManager) {
    this.projectManager = this.createdBy;
  }
  next();
});

export default mongoose.model("Project", ProjectSchema);