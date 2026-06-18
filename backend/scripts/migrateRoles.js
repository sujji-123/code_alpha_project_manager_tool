// backend/scripts/migrateRoles.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Project from '../models/Project.js';

dotenv.config();

const migrateRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Update users: client → project_manager
    const clientResult = await User.updateMany(
      { role: 'client' },
      { $set: { role: 'project_manager' } }
    );
    console.log(`Updated ${clientResult.modifiedCount} clients to project managers`);

    // Update users: freelancer → team_member
    const freelancerResult = await User.updateMany(
      { role: 'freelancer' },
      { $set: { role: 'team_member' } }
    );
    console.log(`Updated ${freelancerResult.modifiedCount} freelancers to team members`);

    // Update projects: client → createdBy (add if missing)
    const projects = await Project.find({});
    for (const project of projects) {
      if (project.client && !project.createdBy) {
        project.createdBy = project.client;
        await project.save();
        console.log(`Updated project ${project.title}`);
      }
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateRoles();