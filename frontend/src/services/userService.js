// frontend/src/services/userService.js
import api from './api';

export const getProfile = () => api.get('/users/profile');
export const updateProfile = (profileData) => api.put('/users/profile', profileData);
export const uploadProfilePicture = (formData) => api.post('/users/profile/picture', formData);
export const getAllProjectManagers = () => api.get('/users/project-managers');
export const getAllTeamMembers = () => api.get('/users/team-members');
export const changePassword = (passwordData) => api.put('/users/profile/change-password', passwordData);
export const updateNotificationPreferences = (preferences) => api.put('/users/profile/notification-preferences', preferences);
export const getCollaboratedUsers = () => api.get('/users/collaborated');
export const getAllUsers = () => api.get('/users');
export const getUserProfileById = (id) => api.get(`/users/${id}`);

// NEW: Get team members for a project
export const getProjectTeamMembers = async (projectId) => {
  const res = await api.get(`/users/project-team/${projectId}`);
  return res.data;
};

export default {
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
};