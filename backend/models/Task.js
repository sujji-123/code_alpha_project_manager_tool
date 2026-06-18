// backend/models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    project: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Project", 
      required: true 
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    // Enhanced status options
    status: { 
      type: String, 
      enum: ["todo", "inprogress", "review", "done"], 
      default: "todo" 
    },
    // NEW: Priority field
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    assignedTo: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      default: null 
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    // NEW: Due date
    dueDate: { type: Date },
    // NEW: Time tracking
    estimatedHours: { type: Number, default: 0 },
    actualHours: { type: Number, default: 0 },
    // NEW: Subtasks
    subtasks: [{
      title: String,
      completed: { type: Boolean, default: false }
    }],
    // NEW: Attachments
    attachments: [{
      url: String,
      name: String,
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      uploadedAt: { type: Date, default: Date.now }
    }],
    // NEW: Dependencies
    dependsOn: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Task" 
    }],
    // NEW: Comments reference (will be in Comment model)
    comments: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Comment" 
    }],
    // NEW: Time tracking (start/end)
    startedAt: { type: Date },
    completedAt: { type: Date },
    // NEW: Task type
    type: {
      type: String,
      enum: ['Feature', 'Bug', 'Improvement', 'Task'],
      default: 'Task'
    }
  },
  { timestamps: true }
);

// NEW: Pre-save middleware to update timestamps
taskSchema.pre('save', function(next) {
  if (this.status === 'inprogress' && !this.startedAt) {
    this.startedAt = new Date();
  }
  if (this.status === 'done' && !this.completedAt) {
    this.completedAt = new Date();
    // Update user's task statistics
    this.constructor.updateUserStats(this.assignedTo);
  }
  next();
});

// NEW: Method to update user stats
taskSchema.statics.updateUserStats = async function(userId) {
  if (!userId) return;
  const User = mongoose.model('User');
  const tasks = await this.find({ assignedTo: userId });
  const completed = tasks.filter(t => t.status === 'done').length;
  
  await User.findByIdAndUpdate(userId, {
    totalTasks: tasks.length,
    completedTasks: completed
  });
};

// NEW: Method to check if task is overdue
taskSchema.methods.isOverdue = function() {
  if (!this.dueDate || this.status === 'done') return false;
  return new Date() > new Date(this.dueDate);
};

// NEW: Virtual for overdue status
taskSchema.virtual('overdue').get(function() {
  return this.isOverdue();
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

export default mongoose.model("Task", taskSchema);