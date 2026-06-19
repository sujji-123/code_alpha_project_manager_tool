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
    // Priority field
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
    // Due date
    dueDate: { type: Date },
    // Time tracking
    estimatedHours: { type: Number, default: 0 },
    actualHours: { type: Number, default: 0 },
    // Subtasks
    subtasks: [{
      title: String,
      completed: { type: Boolean, default: false }
    }],
    // Attachments
    attachments: [{
      url: String,
      name: String,
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      uploadedAt: { type: Date, default: Date.now }
    }],
    // Dependencies
    dependsOn: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Task" 
    }],
    // Comments reference
    comments: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Comment" 
    }],
    // Time tracking (start/end)
    startedAt: { type: Date },
    completedAt: { type: Date },
    // Task type
    type: {
      type: String,
      enum: ['Feature', 'Bug', 'Improvement', 'Task'],
      default: 'Task'
    },
    // NEW: Deliverables fields
    deliverables: { 
      type: String, 
      default: '' 
    },
    deliverableFiles: [{
      url: String,
      name: String,
      size: Number,
      uploadedAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

// Pre-save middleware to update timestamps
taskSchema.pre('save', function(next) {
  if (this.status === 'inprogress' && !this.startedAt) {
    this.startedAt = new Date();
  }
  if (this.status === 'done' && !this.completedAt) {
    this.completedAt = new Date();
    this.constructor.updateUserStats(this.assignedTo);
  }
  next();
});

// Method to update user stats
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

// Method to check if task is overdue
taskSchema.methods.isOverdue = function() {
  if (!this.dueDate || this.status === 'done') return false;
  return new Date() > new Date(this.dueDate);
};

// Virtual for overdue status
taskSchema.virtual('overdue').get(function() {
  return this.isOverdue();
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

export default mongoose.model("Task", taskSchema);