// backend/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['project_manager', 'team_member', 'admin'],
      required: true,
      default: 'team_member'
    },
    // OTP fields REMOVED
    skills: { type: [String], default: [] },
    bio: { type: String, default: '' },
    rating: { type: Number, default: 0 },
    reviews: [
      {
        reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: Number,
        comment: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    profilePicture: { type: String, default: '' },
    position: { type: String, default: '' },
    department: { type: String, default: '' },
    emailNotificationsEnabled: { type: Boolean, default: true },
    assignedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    completedTasks: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

UserSchema.virtual('completionRate').get(function() {
  if (this.totalTasks === 0) return 0;
  return Math.round((this.completedTasks / this.totalTasks) * 100);
});

UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', UserSchema);

export default User;