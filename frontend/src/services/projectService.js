// src/services/projectService.js
import api from "./api";

export const createProject = (payload) => api.post("/projects", payload);
export const getProjects = () => api.get("/projects");
export const getMyProjects = () => api.get("/projects/my-projects");
export const getTeamProjects = () => api.get("/projects/team-projects");
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const getProjectById = (id) => api.get(`/projects/${id}`);
export const addTeamMember = (projectId, userId) => api.post(`/projects/${projectId}/team`, { userId });
export const removeTeamMember = (projectId, userId) => api.delete(`/projects/${projectId}/team`, { data: { userId } });

export default {
  createProject,
  getProjects,
  getMyProjects,
  getTeamProjects,
  deleteProject,
  updateProject,
  getProjectById,
  addTeamMember,
  removeTeamMember
};