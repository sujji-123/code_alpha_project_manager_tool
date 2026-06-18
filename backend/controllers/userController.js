// backend/controllers/userController.js
import User from '../models/User.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import bcrypt from 'bcryptjs';
import { cloudinary } from '../config/cloudinary.js';

// Helper function to transform user
const transformUser = (user) => {
  if (user && user.profilePicture && user.profilePicture.startsWith('https://res.cloudinary.com/')) {
    const transformedUser = user.toObject ? user.toObject() : { ...user };
    transformedUser.profilePicture = transformedUser.profilePicture.replace(
      'https://res.cloudinary.com/daxvjw2au/image/upload/', 
      '/images/'
    );
    return transformedUser;
  }
  return user;
};

// Get Logged In User Profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -otp -otpExpires')
      .populate('assignedProjects', 'title status progress');
    
    const tasks = await Task.find({ assignedTo: req.user.id });
    const taskStats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inprogress: tasks.filter(t => t.status === 'inprogress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length,
    };
    
    res.json({
      ...transformUser(user),
      taskStats
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update Logged In User Profile
export const updateProfile = async (req, res) => {
  const { name, bio, skills, position, department } = req.body;
  try {
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    user.name = name || user.name;
    user.bio = bio || user.bio;
    user.position = position || user.position;
    user.department = department || user.department;
    if (skills) {
      user.skills = Array.isArray(skills) ? skills : skills.split(',').map(skill => skill.trim());
    }
    await user.save();
    res.json(transformUser(user));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Upload Profile Picture to Cloudinary
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'profile_pictures',
      transformation: [{ width: 200, height: 200, crop: "fill" }]
    });
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    user.profilePicture = result.secure_url;
    await user.save();
    res.json(transformUser(user));
  } catch (err) {
    console.error('Cloudinary Upload Error:', err);
    res.status(500).send('Server error during file upload');
  }
};

// Get Public User Profile by ID
export const getUserProfileById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -otp -otpExpires')
      .populate('assignedProjects', 'title status progress');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const projects = await Project.find({
      $or: [
        { createdBy: req.params.id },
        { projectManager: req.params.id },
        { teamMembers: req.params.id }
      ]
    })
      .populate('createdBy', 'name')
      .populate('projectManager', 'name')
      .sort({ createdAt: -1 });

    const tasks = await Task.find({ assignedTo: req.params.id })
      .populate('project', 'title');

    res.json({
      user: transformUser(user),
      projects,
      tasks
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
};

// Change Password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Incorrect current password' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update Notification Preferences
export const updateNotificationPreferences = async (req, res) => {
  const { enabled } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { emailNotificationsEnabled: !!enabled },
      { new: true }
    ).select('-password -otp -otpExpires');
    res.json(transformUser(user));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get Collaborated Users
export const getCollaboratedUsers = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { createdBy: req.user.id },
        { projectManager: req.user.id },
        { teamMembers: req.user.id }
      ]
    }).populate('teamMembers', 'name email profilePicture role')
      .populate('createdBy', 'name email profilePicture role')
      .populate('projectManager', 'name email profilePicture role');

    const users = new Map();
    
    projects.forEach(project => {
      if (project.createdBy && project.createdBy._id.toString() !== req.user.id) {
        users.set(project.createdBy._id.toString(), project.createdBy);
      }
      if (project.projectManager && project.projectManager._id.toString() !== req.user.id) {
        users.set(project.projectManager._id.toString(), project.projectManager);
      }
      project.teamMembers.forEach(member => {
        if (member._id.toString() !== req.user.id) {
          users.set(member._id.toString(), member);
        }
      });
    });

    res.json(Array.from(users.values()).map(transformUser));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get All Project Managers
export const getAllProjectManagers = async (req, res) => {
  try {
    const managers = await User.find({ role: 'project_manager' })
      .select('-password -otp -otpExpires');
    res.json(managers.map(transformUser));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get All Team Members
export const getAllTeamMembers = async (req, res) => {
  try {
    const members = await User.find({ role: 'team_member' })
      .select('-password -otp -otpExpires');
    res.json(members.map(transformUser));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get Project Team Members
export const getProjectTeamMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId).populate('teamMembers', 'name email profilePicture skills');
    
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    const projectManager = await User.findById(project.projectManager).select('name email profilePicture');
    
    res.json({
      teamMembers: project.teamMembers || [],
      projectManager: projectManager || null
    });
  } catch (err) {
    console.error('getProjectTeamMembers error:', err);
    res.status(500).send('Server Error');
  }
};

// Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -otp -otpExpires')
      .populate('assignedProjects', 'title');
    res.json(users.map(transformUser));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};