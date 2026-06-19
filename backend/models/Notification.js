import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    type: { 
      type: String, 
      required: true,
      enum: [
        'task_assigned',
        'task_completed',
        'task_updated',
        'project_created',
        'project_updated',
        'comment_added',
        'mention',
        'deadline_approaching',
        'deadline_missed',
        'team_member_added',
        'status_changed'
      ]
    },
    message: { type: String, default: '' }, // Added for display
    reference: {
      type: {
        model: { type: String, enum: ['Task', 'Project', 'Comment'] },
        id: { type: mongoose.Schema.Types.ObjectId }
      }
    },
    payload: { 
      type: Object, 
      default: {} 
    },
    read: { type: Boolean, default: false }, // IMPORTANT: false by default
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    actionUrl: { type: String }
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, createdAt: -1 });

NotificationSchema.methods.markAsRead = async function() {
  this.read = true;
  await this.save();
  return this;
};

NotificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { user: userId, read: false },
    { read: true }
  );
};

export default mongoose.model("Notification", NotificationSchema);