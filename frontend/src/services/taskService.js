import api from "./api";

export const createTask = async (taskData) => {
  const res = await api.post(`/tasks`, taskData);
  return res.data;
};

export const getTasksByProject = async (projectId) => {
  const res = await api.get(`/tasks/project/${projectId}`);
  return res.data;
};

export const getMyTasks = async () => {
  const res = await api.get(`/tasks/my-tasks`);
  return res.data;
};

export const getTaskStats = async () => {
  const res = await api.get(`/tasks/stats`);
  return res.data;
};

export const getTaskById = async (id) => {
  const res = await api.get(`/tasks/${id}`);
  return res.data;
};

export const updateTask = async (id, updates) => {
  const res = await api.put(`/tasks/${id}`, updates);
  return res.data;
};

export const deleteTask = async (id) => {
  const res = await api.delete(`/tasks/${id}`);
  return res.data;
};

export const updateTaskStatus = async (id, status) => {
  const res = await api.patch(`/tasks/${id}/status`, { status });
  return res.data;
};

export const getTasksByStatus = async (projectId) => {
  const res = await api.get(`/tasks/project/${projectId}/grouped`);
  return res.data;
};

export const assignTask = async (taskId, userId) => {
  const res = await api.patch(`/tasks/${taskId}/assign`, { userId });
  return res.data;
};

// ✅ FIXED: Submit task with deliverables
export const submitTaskForReview = async (taskId, data = {}) => {
  const res = await api.patch(`/tasks/${taskId}/submit`, data);
  return res.data;
};

export const approveTask = async (taskId) => {
  const res = await api.patch(`/tasks/${taskId}/approve`);
  return res.data;
};