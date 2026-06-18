// backend/routes/userRoutes.js
import express from 'express';
import { 
  getProfile, 
  updateProfile, 
  uploadProfilePicture, 
  getAllProjectManagers,
  getAllTeamMembers,
  getAllUsers,
  changePassword,
  updateNotificationPreferences,
  getCollaboratedUsers,
  getUserProfileById,
  getProjectTeamMembers
} from '../controllers/userController.js';
import auth from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Profile routes
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/profile/picture', auth, upload.single('profilePicture'), uploadProfilePicture);
router.put('/profile/change-password', auth, changePassword);
router.put('/profile/notification-preferences', auth, updateNotificationPreferences);

// User listing
router.get('/collaborated', auth, getCollaboratedUsers);
router.get('/project-managers', auth, getAllProjectManagers);
router.get('/team-members', auth, getAllTeamMembers);
router.get('/project-team/:projectId', auth, getProjectTeamMembers);
router.get('/', auth, getAllUsers);

// Get user by ID (must be last to avoid overriding other routes)
router.get('/:id', auth, getUserProfileById);

export default router;